/**
 * Basic structural checks for all Markdown learning notes:
 * - closed fenced blocks and balanced TeX braces in math blocks / inline math
 * - no raw $$ delimiters, unprotected inline math, or Markdown ** emphasis
 * - explicit braced arguments for TeX fractions and no HTML entities in math
 * - paired <strong> HTML emphasis tags
 * - local Markdown links resolve to existing files
 * - no duplicate level-2 headings in one document
 * - GitHub Markdown tables have consistent column counts
 * - exercise numbering is continuous and every question includes an answer
 * - lecture exercise totals agree with the slide-coverage index
 *
 * Usage: node scripts/check-docs.mjs
 * Pair with: node scripts/normalize-math.mjs --check
 */

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const dirs = ["notes", "exercises", "guides", "visuals"];
const files = ["README.md"];

for (const dir of dirs) {
  for (const entry of fs.readdirSync(path.join(root, dir))) {
    if (entry.endsWith(".md")) files.push(path.join(dir, entry));
  }
}

const problems = [];
const exerciseCounts = new Map();

function validateTex(expression, where) {
  let depth = 0;
  for (let i = 0; i < expression.length; i++) {
    if (expression[i] === "\\" && /[{}]/.test(expression[i + 1] || "")) {
      i++;
      continue;
    }
    if (expression[i] === "{") depth++;
    if (expression[i] === "}") depth--;
    if (depth < 0) {
      problems.push(where + " TeX brace closes before opening");
      break;
    }
  }
  if (depth !== 0) problems.push(where + " unbalanced TeX braces: " + depth);
  if (/\\(?:frac|tfrac|dfrac)(?!\{)/.test(expression)) {
    problems.push(where + " TeX fraction without braced numerator");
  }
  if (/&(?:amp|lt|gt);/.test(expression)) {
    problems.push(where + " HTML entity inside TeX formula");
  }
  if (/(?:_\{[^{}]*\}|_[a-zA-Z0-9])\s*_(?:\{|[a-zA-Z0-9])/.test(expression)) {
    problems.push(where + " repeated subscript (potential MathJax double-subscript error)");
  }
  if (/(?:\^\{[^{}]*\}|\^[a-zA-Z0-9])\s*\^(?:\{|[a-zA-Z0-9])/.test(expression)) {
    problems.push(where + " repeated superscript");
  }
}

for (const filename of files) {
  const full = path.join(root, filename);
  const lines = fs.readFileSync(full, "utf8").split("\n");
  const headingSet = new Set();
  let fenced = null;
  let braceDepth = 0;
  let mathBuffer = [];
  let previousTableColumns = null;
  const exerciseNumbers = [];
  const questionAnswerMarkers = [];

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const where = filename + ":" + (index + 1);

    if (/^\s*\x60{3,}/.test(line)) {
      previousTableColumns = null;
      if (fenced === "math" && braceDepth !== 0) {
        problems.push(where + " math braces are not balanced: " + braceDepth);
      }
      if (fenced === null) {
        fenced = /^\s*\x60{3,}math\s*$/.test(line) ? "math" : "other";
        braceDepth = 0;
        mathBuffer = [];
      } else {
        if (fenced === "math") validateTex(mathBuffer.join("\n"), where);
        fenced = null;
      }
      continue;
    }

    if (fenced === "math") {
      mathBuffer.push(line);
      for (const letter of line) {
        if (letter === "{") braceDepth++;
        if (letter === "}") braceDepth--;
      }
      if (braceDepth < 0) {
        problems.push(where + " math braces close before opening");
      }
      continue;
    }
    if (fenced !== null) continue;

    // Only a consecutive run of pipe-delimited rows is a potential GFM table.
    // Escaped pipes inside formulae or prose must not create extra columns.
    const isTableRow = /^\s*\|.*\|\s*$/.test(line);
    if (isTableRow) {
      const columns = line
        .replace(/^\s*\|/, "")
        .replace(/\|\s*$/, "")
        .split(/(?<!\\)\|/).length;
      if (previousTableColumns !== null && columns !== previousTableColumns) {
        problems.push(where + " inconsistent table columns: " + columns + " vs " + previousTableColumns);
      }
      previousTableColumns = columns;
    } else {
      previousTableColumns = null;
    }

    if (filename.startsWith("exercises/")) {
      const questionHeading = line.match(/^## 题\s+(\d+)｜/);
      if (questionHeading) {
        exerciseNumbers.push(Number(questionHeading[1]));
        questionAnswerMarkers.push(false);
      } else if (questionAnswerMarkers.length > 0 && /<strong>(?:标准)?答案(?:与(?:完整)?解析)?[：:]?<\/strong>/.test(line)) {
        questionAnswerMarkers[questionAnswerMarkers.length - 1] = true;
      }
    }

    if (line.includes("$$")) problems.push(where + " raw $$ delimiter");
    if (line.includes("**")) problems.push(where + " raw Markdown bold delimiter (use <strong>)");
    if (/(?<![\x60\\])\$(?![\x60$])/.test(line)) {
      problems.push(where + " unprotected inline dollar delimiter");
    }
    const openedStrong = (line.match(/<strong>/g) || []).length;
    const closedStrong = (line.match(/<\/strong>/g) || []).length;
    if (openedStrong !== closedStrong) problems.push(where + " unpaired <strong> tags");
    for (const match of line.matchAll(/\$\x60([^\x60]*)\x60\$/g)) {
      validateTex(match[1], where);
    }
    if (line.startsWith("## ")) {
      if (headingSet.has(line)) problems.push(where + " duplicate heading");
      headingSet.add(line);
    }

    for (const match of line.matchAll(/\]\(([^)#]+)(?:#[^)]*)?\)/g)) {
      const href = match[1];
      if (/^(https?:|mailto:)/.test(href)) continue;
      const target = path.resolve(path.dirname(full), href);
      if (!fs.existsSync(target)) {
        problems.push(where + " missing local link: " + href);
      }
    }
  }
  if (fenced !== null) problems.push(filename + " unclosed fenced block");
  if (filename.startsWith("exercises/")) {
    for (let i = 0; i < exerciseNumbers.length; i++) {
      if (exerciseNumbers[i] !== i + 1) {
        problems.push(filename + " exercise " + (i + 1) + " is numbered " + exerciseNumbers[i]);
      }
      if (!questionAnswerMarkers[i]) {
        problems.push(filename + " exercise " + (i + 1) + " has no answer marker");
      }
    }
    const lecture = filename.match(/^exercises\/lecture-(\d\d)-exercises\.md$/)?.[1];
    if (lecture) exerciseCounts.set(lecture, exerciseNumbers.length);
  }
}

const audit = fs.readFileSync(path.join(root, "guides/slide-coverage-audit.md"), "utf8");
const auditRows = [...audit.matchAll(/^\| Lecture (\d)：[^\n]*\|\s*(\d+)\s*\|$/gm)];
for (const [, lecture, listedCount] of auditRows) {
  const actualCount = exerciseCounts.get(lecture.padStart(2, "0"));
  if (actualCount !== Number(listedCount)) {
    problems.push("slide-coverage-audit.md Lecture " + lecture + " lists " + listedCount + " exercises but has " + actualCount);
  }
}
const listedTotal = audit.match(/^\| 合计 \|[^\n]*\|\s*(\d+)\s*\|$/m)?.[1];
const actualTotal = [...exerciseCounts.values()].reduce((sum, count) => sum + count, 0);
if (auditRows.length !== 9 || Number(listedTotal) !== actualTotal) {
  problems.push("slide-coverage-audit.md total is not aligned with nine exercise files: " + actualTotal);
}

if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(problem + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write("Verified " + files.length + " Markdown files and " + actualTotal + " numbered exercises: no structural errors.\n");
}
