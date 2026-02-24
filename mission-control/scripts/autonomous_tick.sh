#!/usr/bin/env bash
set -euo pipefail

# Autonomous Phase 2 tick:
# 1) Pull highest-impact focus item from Mission Control API
# 2) Emit heartbeat-formatted summary text
# 3) Optionally auto-log that summary back into Mission Control
#
# Usage:
#   ./scripts/autonomous_tick.sh
#   ./scripts/autonomous_tick.sh --owner OpenClaw --log

BASE_URL="${MISSION_CONTROL_BASE_URL:-http://localhost:8787}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${MISSION_CONTROL_ENV_FILE:-$MC_ROOT/.env}"
TOKEN="${MISSION_CONTROL_API_TOKEN:-}"
OWNER="OpenClaw"
DO_LOG=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --owner) OWNER="$2"; shift 2 ;;
    --log) DO_LOG=true; shift 1 ;;
    *) echo "Unknown arg: $1" >&2; exit 1 ;;
  esac
done

if [[ -z "$TOKEN" && -f "$ENV_FILE" ]]; then
  TOKEN="$(grep '^API_TOKEN=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
fi

if [[ -z "$TOKEN" ]]; then
  echo "Missing API token. Set MISSION_CONTROL_API_TOKEN or .env API_TOKEN." >&2
  exit 1
fi

focus_json=$(curl -sS \
  -H "x-api-token: $TOKEN" \
  "$BASE_URL/api/focus?owner=${OWNER}&includeBlocked=false&limit=5")

heartbeat_text=$(FOCUS_JSON="$focus_json" python3 - <<'PY'
import json, os

raw = os.environ.get("FOCUS_JSON", "")
try:
    obj = json.loads(raw)
except Exception:
    print("HEARTBEAT_OK")
    raise SystemExit(0)

ranked = obj.get("ranked") or []
top = obj.get("top") or (ranked[0] if ranked else None)
if not top:
    print("HEARTBEAT_OK")
    raise SystemExit(0)

title = top.get("title", "Top focus task")
project = top.get("projectName") or "Unscoped"
impact = top.get("impactType") or "Other"
score = top.get("impactScore")
status = top.get("status") or "Open"
priority = top.get("priority") or "Normal"

task = f"Execute top focus item: {title}"
changed = "mission-control/scripts/autonomous_tick.sh"
what = f"Pulled /api/focus top item for owner and generated a heartbeat-safe execution summary. Top now: {title} (project: {project}, impact: {impact}, score: {score}, status: {status}, priority: {priority})."
why = "Removes manual triage in autonomous loops so each tick starts from the highest-leverage task immediately."
next_step = f"Start/continue delivery on '{title}' and rerun this tick with --log after concrete progress."

print(f"Task: {task}")
print(f"Changed files: {changed}")
print(f"What changed: {what}")
print(f"Why it helps: {why}")
print(f"Next: {next_step}")
PY
)

printf '%s\n' "$heartbeat_text"

if [[ "$DO_LOG" == true && "$heartbeat_text" != "HEARTBEAT_OK" ]]; then
  "$SCRIPT_DIR/log_progress.sh" --summary-text "$heartbeat_text" --impact-type "System" --impact-score 8 >/dev/null
fi
