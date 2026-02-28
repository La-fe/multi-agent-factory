#!/usr/bin/env bash
# Cross-package-manager tool executor
# Detects pnpm → bun → npm → npx and runs the tool consistently
set -euo pipefail

if command -v pnpm &>/dev/null; then
  exec pnpm exec "$@"
elif command -v bun &>/dev/null; then
  exec bunx "$@"
elif command -v npx &>/dev/null; then
  exec npx "$@"
else
  echo "No package manager found (pnpm/bun/npx)" >&2
  exit 1
fi
