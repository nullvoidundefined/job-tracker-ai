#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
PIDS=()

cleanup() {
  echo "Cleaning up..."
  for pid in "${PIDS[@]}"; do
    kill "$pid" 2>/dev/null || true
  done
  wait 2>/dev/null || true
}
trap cleanup EXIT

echo "=== Smoke Test: job-tracker-ai ==="

# Start server
cd "$PROJECT_DIR"
PORT=3000 npx tsx src/index.ts &>/dev/null &
PIDS+=($!)

echo "Waiting for server to start..."

# Wait for server (port 3000)
for i in $(seq 1 20); do
  if curl -s -o /dev/null http://localhost:3000/health 2>/dev/null; then
    echo "Server ready on port 3000"
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "FAIL: Server did not start on port 3000 within 20 seconds"
    exit 1
  fi
  sleep 1
done

# Run health checks (no frontend, no CSRF app)
"$SCRIPT_DIR/health-check.sh" http://localhost:3000 "" "false"
