#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
run_timed() {
  /usr/bin/time -p "$@"
}

PROJECT_DIR="$(pwd -P)"
RUNTIME_DIR="${RUNTIME_DIR:?RUNTIME_DIR must point to the worker runtime}"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to an output directory}"
CAPTURE_DIR="$(run_timed realpath -m "$CAPTURE_DIR")"
case "$CAPTURE_DIR/" in
  "$PROJECT_DIR/"*) echo 'CAPTURE_DIR must be outside the project directory.' >&2; exit 1 ;;
esac
export CAPTURE_DIR

run_timed test -f "$RUNTIME_DIR/scripts/default-capture.mjs"
# The capture runtime waits for rendered content, saves desktop and mobile
# screenshots, classifies transient browser/navigation errors, and closes its browser.
run_timed node "$RUNTIME_DIR/scripts/default-capture.mjs"
