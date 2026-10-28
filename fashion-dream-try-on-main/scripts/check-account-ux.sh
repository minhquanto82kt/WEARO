#!/usr/bin/env bash
set -uo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_DIR"

echo
echo "[WEARO] Running account UX regression checks..."
echo "Project: $PROJECT_DIR"
echo

npm run test:account-ux
result=$?

if [ "$result" -eq 0 ]; then
  echo
  echo "[PASS] Account UX checks completed successfully."
else
  echo
  echo "[FAIL] Account UX checks failed with exit code $result."
fi

exit "$result"
