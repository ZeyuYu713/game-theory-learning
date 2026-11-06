/**
 * Basic structural checks for all Markdown learning notes:
 * - closed fenced blocks and balanced TeX braces in math blocks / inline math
 * - no raw $$ delimiters, unprotected inline math, or Markdown ** emphasis
 * - explicit braced arguments for TeX fractions and no HTML entities in math
 * - paired <strong> HTML emphasis tags
 * - local Markdown links resolve to existing files
 * - no duplicate level-2 headings in one document
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

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const where = filename + ":" + (index + 1);

    if (/^\s*\x60{3,}/.test(line)) {
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
}

if (problems.length > 0) {
  for (const problem of problems) process.stderr.write(problem + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write("Verified " + files.length + " Markdown files: no structural errors.\n");
}
