#!/usr/bin/env node
// Filter staged files by category (lint vs format)
// Zero dependencies — used by git pre-commit hook
//
// Usage: node filter-staged-files.mjs <lint|format> -- file1 file2 ...
// Output: NUL-delimited file list (safe for bash read loops)

const LINT_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs"]);
const FORMAT_EXTENSIONS = new Set([
  ...LINT_EXTENSIONS,
  ".json",
  ".md",
  ".mdx",
]);

const args = process.argv.slice(2);
const separatorIndex = args.indexOf("--");
if (separatorIndex === -1 || separatorIndex === 0) {
  process.stderr.write(
    "Usage: filter-staged-files.mjs <lint|format> -- file1 file2 ...\n"
  );
  process.exit(2);
}

const mode = args[0];
const files = args.slice(separatorIndex + 1);
const extensions = mode === "lint" ? LINT_EXTENSIONS : FORMAT_EXTENSIONS;

for (const file of files) {
  const ext = file.slice(file.lastIndexOf("."));
  if (extensions.has(ext)) {
    process.stdout.write(file + "\0");
  }
}
