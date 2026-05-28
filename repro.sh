#!/usr/bin/env bash
# Reproduces a MikroORM snapshot inconsistency: the JSON written by
# `migration:up` (from MySQL information_schema) differs cosmetically from
# the JSON written by `migration:create` (from entity metadata). Because of
# this, running `migration:create` against an up-to-date schema generates a
# large no-op migration full of `ALTER TABLE … MODIFY …` statements that do
# nothing.
#
# Usage: ./repro.sh

set -euo pipefail
cd "$(dirname "$0")"

CLI="./node_modules/.bin/mikro-orm"
SNAP="src/migrations/.snapshot-repro.json"
# Saved copies live next to the live snapshot so VSCode shows them as siblings
# (right-click any pair → "Compare Selected" to see the flip-flop).
SNAP_DIR="src/migrations"

step() { printf '\n\033[1;36m>>> %s\033[0m\n' "$1"; }

step "1. Reset DB + migrations + sn./apshot"
docker compose down -v >/dev/null 2>&1 || true
rm -rf src/migrations dist
docker compose up -d --wait >/dev/null

step "2. Build TS"
npx tsc -p . >/dev/null

step "3. migration:create --initial (writes snapshot from entities)"
$CLI migration:create --initial >/dev/null
npx tsc -p . >/dev/null
cp "$SNAP" "$SNAP_DIR/snapshot-1-after-create.json"

step "4. migration:up (writes snapshot from MySQL information_schema)"
$CLI migration:up >/dev/null
cp "$SNAP" "$SNAP_DIR/snapshot-2-after-up.json"

echo
echo "Snapshot diff: 'create' (entity metadata) vs 'up' (information_schema):"
diff -u "$SNAP_DIR/snapshot-1-after-create.json" "$SNAP_DIR/snapshot-2-after-up.json" \
  | sed -n '1,80p' || true

step "5. migration:create — entity unchanged, expect NO new migration"
INITIAL=$(ls src/migrations/Migration*.ts | head -n1)
$CLI migration:create 2>&1 | tail -1
cp "$SNAP" "$SNAP_DIR/snapshot-3-after-create.json"
LATEST=$(ls -t src/migrations/Migration*.ts | head -n1)
echo
if [ "$LATEST" = "$INITIAL" ]; then
  echo "(no new migration produced — clean exit)"
else
  echo "Generated migration content (should have been empty):"
  echo "------------------------------------------------------------"
  cat "$LATEST"
  echo "------------------------------------------------------------"
fi

step "6. Apply the no-op migration and run migration:create again"
echo "(showing that the cycle continues — applying still does not stabilize the snapshot)"
npx tsc -p . >/dev/null
$CLI migration:up >/dev/null
cp "$SNAP" "$SNAP_DIR/snapshot-4-after-up.json"
$CLI migration:create 2>&1 | tail -1
cp "$SNAP" "$SNAP_DIR/snapshot-5-after-create.json"
echo
echo "Latest migration:"
echo "------------------------------------------------------------"
ls -t src/migrations/Migration*.ts | head -n1 | xargs cat
echo "------------------------------------------------------------"

echo
echo "Saved snapshot copies (open in VSCode and compare adjacent pairs):"
ls -1 "$SNAP_DIR"/snapshot-*.json

step "Done. Re-run './repro.sh' to reset. 'docker compose down -v' to stop MySQL."
