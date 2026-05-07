#!/usr/bin/env bash
set -euo pipefail

echo "Running RecycleRight local test suite (Jest)..."

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR/artifacts/collector"

export TEST_MODE=1

pnpm test

echo "All tests passed."

