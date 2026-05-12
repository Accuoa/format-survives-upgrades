#!/usr/bin/env bash
# Full chain: ChatGPT memory export → PMF v0.1 (context-portability) →
# PMF v0.2 (this repo) → memorystore POST bodies.
#
# Prerequisites:
#   - This repo cloned + npm-installed (you're here)
#   - context-portability cloned at ../context-portability (or set CTX_PORT_DIR env var)
#   - memorystore running on http://localhost:8787 (optional; only if you want to POST)

set -euo pipefail

if [ "$#" -lt 1 ]; then
  echo "Usage: $0 <chatgpt-export.json> [memorystore-url]"
  echo "Example: $0 user.json http://localhost:8787"
  exit 2
fi

INPUT="$1"
MEMORYSTORE_URL="${2:-}"
CTX_PORT_DIR="${CTX_PORT_DIR:-../context-portability}"
OUT_DIR="$(mktemp -d)"

if [ ! -d "$CTX_PORT_DIR" ]; then
  echo "error: context-portability not found at $CTX_PORT_DIR"
  echo "  Set CTX_PORT_DIR env var or clone https://github.com/Accuoa/context-portability there."
  exit 1
fi

echo "→ Step 1: convert ChatGPT export → PMF v0.1..."
node "$CTX_PORT_DIR/src/cli.mjs" convert --in "$INPUT" --out "$OUT_DIR/v01/"

echo "→ Step 2: migrate PMF v0.1 → v0.2..."
node "$(dirname "$0")/../src/cli.mjs" migrate --in "$OUT_DIR/v01/portable.json" --out "$OUT_DIR/v02/portable.json"

echo "→ Output paths:"
echo "    PMF v0.1: $OUT_DIR/v01/portable.json"
echo "    PMF v0.2: $OUT_DIR/v02/portable.json"
echo "    JSONL  : $OUT_DIR/v01/memorystore.jsonl  (from context-portability — v0.2 doesn't reshape this)"

if [ -n "$MEMORYSTORE_URL" ]; then
  echo "→ Step 3: posting JSONL lines to ${MEMORYSTORE_URL}..."
  if ! curl -sf "${MEMORYSTORE_URL}/health" > /dev/null; then
    echo "error: memorystore not reachable at ${MEMORYSTORE_URL}/health"
    exit 1
  fi
  OK=0; FAIL=0
  while IFS= read -r line; do
    [ -z "$line" ] && continue
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${MEMORYSTORE_URL}/memories" -H 'content-type: application/json' -d "$line")
    if [ "$STATUS" = "201" ]; then OK=$((OK+1)); else FAIL=$((FAIL+1)); fi
  done < "$OUT_DIR/v01/memorystore.jsonl"
  echo "→ done. ${OK} stored, ${FAIL} failed."
fi

rm -rf "$OUT_DIR"
