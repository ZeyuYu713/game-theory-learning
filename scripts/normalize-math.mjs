/**
 * Normalize mathematical Markdown for GitHub's MathJax renderer.
 *
 * Converts double-dollar display expressions into fenced math blocks,
 * protects every inline expression with GitHub's $-backtick math syntax,
 * and normalizes ^*. This also fixes dollar signs displayed as literal
 * text around tuples and adjacent Chinese punctuation.
 *
 * Run: node scripts/normalize-math.mjs
 * Check: node scripts/normalize-math.mjs --check
 */

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const folders = ["notes", "exercises", "guides", "visuals"];
const checkOnly = process.argv.includes("--check");

function formatInline(line) {
  return line.replace(/(?<!\$)\$(?!\$)([^$\n]+?)\$(?!\$)/g, (full, formula) => {
    if (formula.startsWith("\x60") && formula.endsWith("\x60")) return full;
    if (formula.includes("\x60")) return full;
    const normalized = formula.replace(/\^\*/g, "^{*}");
    return "$\x60" + normalized + "\x60$";
  });
}

function normalizeMath(source, filename) {
  const lines = source.split("\n");
  const output = [];
  let fenced = false;
  let inMath = false;
  let convertedBlocks = 0;
  let protectedInline = 0;

  for (const [index, line] of lines.entries()) {
    if (!inMath && /^\s*\x60{3,}/.test(line)) {
      fenced = !fenced;
      output.push(line);
      continue;
    }
    if (fenced) {
      output.push(line);
      continue;
    }

    if (inMath) {
      const closing = line.match(/^(.*?)\$\$\s*$/);
      if (closing) {
        if (closing[1].trim()) {
          output.push(closing[1].replace(/\^\*/g, "^{*}"));
        }
        output.push("\x60\x60\x60");
        inMath = false;
      } else {
        output.push(line.replace(/\^\*/g, "^{*}"));
      }
      continue;
    }

    const singleLine = line.match(/^\s*\$\$(.*?)\$\$\s*$/);
    if (singleLine) {
      output.push("\x60\x60\x60math");
      output.push(singleLine[1].replace(/\^\*/g, "^{*}"));
      output.push("\x60\x60\x60");
      convertedBlocks++;
      continue;
    }

    const opening = line.match(/^\s*\$\$(.*)$/);
    if (opening) {
      output.push("\x60\x60\x60math");
      if (opening[1].trim()) {
        output.push(opening[1].replace(/\^\*/g, "^{*}"));
      }
      inMath = true;
      convertedBlocks++;
      continue;
    }

    if (line.includes("$$")) {
      throw new Error(filename + ":" + (index + 1) + " has unexpected $$");
    }
    const updated = formatInline(line);
    if (updated !== line) protectedInline++;
    output.push(updated);
  }

  if (inMath) throw new Error(filename + ": unmatched display math");
  if (fenced) throw new Error(filename + ": unclosed fenced code block");

  return { text: output.join("\n"), convertedBlocks, protectedInline };
}

let changed = 0;
let totalBlocks = 0;
let totalInline = 0;
for (const dir of folders) {
  for (const entry of fs.readdirSync(path.join(root, dir))) {
    if (!entry.endsWith(".md")) continue;
    const filename = path.join(dir, entry);
    const fullPath = path.join(root, filename);
    const source = fs.readFileSync(fullPath, "utf8");
    const result = normalizeMath(source, filename);
    totalBlocks += result.convertedBlocks;
    totalInline += result.protectedInline;
    if (result.text === source) continue;
    changed++;
    if (!checkOnly) fs.writeFileSync(fullPath, result.text);
    process.stdout.write(
      (checkOnly ? "NEEDS FORMAT " : "FORMATTED ") + filename +
      " (" + result.convertedBlocks + " blocks, " +
      result.protectedInline + " inline lines)\n",
    );
  }
}

process.stdout.write(
  changed + " files; " + totalBlocks + " math blocks and " +
  totalInline + " inline lines" +
  (checkOnly ? " need normalization" : " normalized") + ".\n",
);
if (checkOnly && changed) process.exitCode = 1;
