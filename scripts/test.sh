#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

if ! command -v node >/dev/null 2>&1; then
  echo "node not installed — required for tests" >&2
  exit 1
fi

node tests/detector.test.js
