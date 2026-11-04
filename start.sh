#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"
run_timed() {
  /usr/bin/time -p "$@"
}

PROJECT_DIR="$(pwd -P)"
RUNTIME_DIR="${RUNTIME_DIR:?RUNTIME_DIR must point to the worker runtime}"
OPENCODE_WEB_DIR="${OPENCODE_WEB_DIR:-/home/runner/work/_temp/omgithub-web}"
PORT="${PORT:-3000}"
export PROJECT_DIR RUNTIME_DIR OPENCODE_WEB_DIR PORT

run_timed test -f package.json
run_timed test -f package-lock.json
run_timed test -f "$RUNTIME_DIR/scripts/default-start.mjs"
# The runtime installs dependencies when the lockfile stamp is stale, builds
# the static output, writes deployment-output.json, then serves in foreground.
# It also reports timings for each install/build subprocess.
run_timed node "$RUNTIME_DIR/scripts/default-start.mjs"
