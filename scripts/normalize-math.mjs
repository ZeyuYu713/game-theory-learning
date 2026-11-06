/**
 * Normalize mathematical Markdown for GitHub's MathJax renderer.
 *
 * Converts double-dollar display expressions into fenced math blocks,
 * protects inline expressions with GitHub's $-backtick math syntax,
 * expands TeX fractions to braced arguments, and uses HTML strong tags
 * in prose to avoid typography depending on Markdown delimiter parsing.
 *
 * Run: node scripts/normalize-math.mjs
 * Check: node scripts/normalize-math.mjs --check
 */

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const folders = ["notes", "exercises", "guides", "visuals"];
const checkOnly = process.argv.includes("--check");

function texArgument(source, start) {
  let offset = start;
  while (/\s/.test(source[offset] || "")) offset++;
  if (offset >= source.length) return null;

  if (source[offset] === "{") {
    let depth = 1;
    for (let pos = offset + 1; pos < source.length; pos++) {
      if (source[pos] === "{" && source[pos - 1] !== "\\") depth++;
      if (source[pos] === "}" && source[pos - 1] !== "\\") depth--;
      if (depth === 0) return { value: source.slice(offset + 1, pos), end: pos + 1 };
    }
    return null;
  }
  if (source[offset] === "\\") {
    const command = source.slice(offset).match(/^\\(?:[A-Za-z]+|.)/);
    if (!command) return null;
    return { value: command[0], end: offset + command[0].length };
  }
  return { value: source[offset], end: offset + 1 };
}

function normalizeFractions(source) {
  let result = "";
  for (let i = 0; i < source.length;) {
    const command = source.slice(i).match(/^\\(?:frac|tfrac|dfrac)(?![A-Za-z])/);
    if (command) {
      const numerator = texArgument(source, i + command[0].length);
      const denominator = numerator && texArgument(source, numerator.end);
      if (denominator) {
        result += command[0] + "{" + normalizeFractions(numerator.value) +
          "}{" + normalizeFractions(denominator.value) + "}";
        i = denominator.end;
        continue;
      }
    }
    result += source[i++];
  }
  return result;
}

function formatProse(line) {
  return line.replace(/(?<!\\)\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function formatInline(line) {
  return line.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (full, formula) => {
    if (formula.startsWith("\x60") && formula.endsWith("\x60")) return full;
    if (formula.includes("\x60")) return full;
    const normalized = normalizeFractions(formula.replace(/\^\*/g, "^{*}"));
    return "$\x60" + normalized + "\x60$";
  });
}

function normalizeExistingInline(line) {
  return line.replace(/\$\x60([^\x60]*)\x60\$/g,
    (whole, expression) => "$\x60" + normalizeFractions(expression) + "\x60$");
}

function normalizeMath(source, filename) {
  const lines = source.split("\n");
  const output = [];
  let fenced = null;
  let inMath = false;
  let convertedBlocks = 0;
  let protectedInline = 0;
  let changedFractionsAndBold = 0;

  for (const [index, line] of lines.entries()) {
    if (!inMath && /^\s*\x60{3,}/.test(line)) {
      fenced = fenced === null
        ? (/^\s*\x60{3,}math\s*$/.test(line) ? "math" : "other")
        : null;
      output.push(line);
      continue;
    }
    if (fenced) {
      const updated = fenced === "math" ? normalizeFractions(line) : line;
      if (updated !== line) changedFractionsAndBold++;
      output.push(updated);
      continue;
    }

    if (inMath) {
      const closing = line.match(/^(.*?)\$\$\s*$/);
      if (closing) {
        if (closing[1].trim()) {
          output.push(normalizeFractions(closing[1].replace(/\^\*/g, "^{*}")));
        }
        output.push("\x60\x60\x60");
        inMath = false;
      } else {
        output.push(normalizeFractions(line.replace(/\^\*/g, "^{*}")));
      }
      continue;
    }

    const singleLine = line.match(/^\s*\$\$(.*?)\$\$\s*$/);
    if (singleLine) {
      output.push("\x60\x60\x60math");
      output.push(normalizeFractions(singleLine[1].replace(/\^\*/g, "^{*}")));
      output.push("\x60\x60\x60");
      convertedBlocks++;
      continue;
    }

    const opening = line.match(/^\s*\$\$(.*)$/);
    if (opening) {
      output.push("\x60\x60\x60math");
      if (opening[1].trim()) {
        output.push(normalizeFractions(opening[1].replace(/\^\*/g, "^{*}")));
      }
      inMath = true;
      convertedBlocks++;
      continue;
    }

    if (line.includes("$$")) {
      throw new Error(filename + ":" + (index + 1) + " has unexpected $$");
    }
    const updated = formatProse(normalizeExistingInline(formatInline(line)));
    if (updated !== line) protectedInline++;
    if (updated.includes("<strong>") && line.includes("**")) changedFractionsAndBold++;
    output.push(updated);
  }

  if (inMath) throw new Error(filename + ": unmatched display math");
  if (fenced) throw new Error(filename + ": unclosed fenced code block");

  return { text: output.join("\n"), convertedBlocks, protectedInline,
    changedFractionsAndBold };
}

let changed = 0;
let totalBlocks = 0;
let totalInline = 0;
let totalPolish = 0;
for (const dir of folders) {
  for (const entry of fs.readdirSync(path.join(root, dir))) {
    if (!entry.endsWith(".md")) continue;
    const filename = path.join(dir, entry);
    const fullPath = path.join(root, filename);
    const source = fs.readFileSync(fullPath, "utf8");
    const result = normalizeMath(source, filename);
    totalBlocks += result.convertedBlocks;
    totalInline += result.protectedInline;
    totalPolish += result.changedFractionsAndBold;
    if (result.text === source) continue;
    changed++;
    if (!checkOnly) fs.writeFileSync(fullPath, result.text);
    process.stdout.write(
      (checkOnly ? "NEEDS FORMAT " : "FORMATTED ") + filename +
      " (" + result.convertedBlocks + " blocks, " +
      result.protectedInline + " prose lines, " +
      result.changedFractionsAndBold + " emphasis/fraction lines)\n",
    );
  }
}

process.stdout.write(
  changed + " files; " + totalBlocks + " math blocks and " +
  totalInline + " prose lines and " + totalPolish + " emphasis/fraction lines" +
  (checkOnly ? " need normalization" : " normalized") + ".\n",
);
if (checkOnly && changed) process.exitCode = 1;
