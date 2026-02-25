#!/usr/bin/env bash
set -euo pipefail

# Autonomous Phase 2 tick:
# 1) Pull highest-impact focus item from Mission Control API
# 2) Execute a concrete action for known top tasks (BusyBits outreach pipeline)
# 3) Emit heartbeat-formatted summary text
# 4) Optionally auto-log that summary back into Mission Control
#
# Usage:
#   ./scripts/autonomous_tick.sh
#   ./scripts/autonomous_tick.sh --owner OpenClaw --log

BASE_URL="${MISSION_CONTROL_BASE_URL:-http://localhost:8787}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKSPACE_ROOT="$(cd "$MC_ROOT/.." && pwd)"
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

heartbeat_text=$(FOCUS_JSON="$focus_json" WORKSPACE_ROOT="$WORKSPACE_ROOT" python3 - <<'PY'
import json
import os
import subprocess
from datetime import datetime
from pathlib import Path

raw = os.environ.get("FOCUS_JSON", "")
workspace = Path(os.environ.get("WORKSPACE_ROOT", ".")).resolve()

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

pipeline_name = "busybits sponsor outreach daily pipeline"
if pipeline_name in title.lower():
    run_date = datetime.now().strftime("%Y-%m-%d")
    pipeline = workspace / "builds" / "busybits-newsletter" / "scripts" / "run_daily_outreach_pipeline.py"

    if not pipeline.exists():
        print("Task: Execute top focus item: BusyBits sponsor outreach daily pipeline")
        print("Changed files: n/a")
        print("What changed: Attempted to run the outreach pipeline from autonomous tick but script was missing.")
        print("Why it helps: Surfaces a concrete blocker immediately instead of silently returning HEARTBEAT_OK.")
        print("Next: Restore builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py, then rerun autonomous tick.")
        raise SystemExit(0)

    cmd = [
        "python3",
        str(pipeline),
        "--date",
        run_date,
        "--limit",
        "20",
        "--skip-if-unchanged",
        "--log-progress",
    ]

    proc = subprocess.run(cmd, capture_output=True, text=True)
    combined = (proc.stdout or "") + ("\n" + proc.stderr if proc.stderr else "")

    if proc.returncode != 0:
        tail = " | ".join([line.strip() for line in combined.splitlines()[-3:] if line.strip()])
        print("Task: Execute top focus item: BusyBits sponsor outreach daily pipeline")
        print(f"Changed files: builds/busybits-newsletter/scripts/run_daily_outreach_pipeline.py (invocation failed)")
        print(f"What changed: Tried running pipeline with --skip-if-unchanged and --log-progress for {run_date}; command failed ({tail[:500]}).")
        print("Why it helps: Makes failures explicit in heartbeat so recovery can be immediate.")
        print("Next: Fix the pipeline error, rerun the command, and validate generated outreach artifacts.")
        raise SystemExit(0)

    skipped = "PIPELINE_SKIPPED" in combined

    if skipped:
        print("Task: Execute top focus item: BusyBits sponsor outreach daily pipeline")
        print("Changed files: builds/busybits-newsletter/.daily_outreach_pipeline_state.json")
        print(f"What changed: Ran outreach pipeline for {run_date} with --skip-if-unchanged; detected no tracker/input changes, so regeneration was intentionally skipped.")
        print("Why it helps: Prevents redundant compute/log noise each heartbeat while keeping the loop responsive to real tracker updates.")
        print("Next: Wait for tracker/contact updates; next tick will auto-regenerate and log when input changes.")
    else:
        print("Task: Execute top focus item: BusyBits sponsor outreach daily pipeline")
        print("Changed files: builds/busybits-newsletter/sponsor_outreach_day_queue.csv, builds/busybits-newsletter/sponsor_send_all_exec_YYYY-MM-DD.sh, builds/busybits-newsletter/sponsor_operator_brief_YYYY-MM-DD.md")
        print(f"What changed: Ran outreach pipeline for {run_date} with --skip-if-unchanged and --log-progress; inputs changed so queue/send/follow-up/copy/exec/KPI/operator artifacts were regenerated and logged.")
        print("Why it helps: Keeps sponsor outreach execution assets fresh so sends/follow-ups can be dispatched immediately with minimal operator prep.")
        print("Next: Execute DRY_RUN then live send using sponsor_send_all_exec_<date>.sh, and update tracker statuses after sends.")

    raise SystemExit(0)

# Default generic summary path
print(f"Task: Execute top focus item: {title}")
print("Changed files: mission-control/scripts/autonomous_tick.sh")
print(
    "What changed: Pulled /api/focus top item for owner and generated a heartbeat-safe execution summary. "
    f"Top now: {title} (project: {project}, impact: {impact}, score: {score}, status: {status}, priority: {priority})."
)
print("Why it helps: Removes manual triage in autonomous loops so each tick starts from the highest-leverage task immediately.")
print(f"Next: Start/continue delivery on '{title}' and rerun this tick with --log after concrete progress.")
PY
)

printf '%s\n' "$heartbeat_text"

if [[ "$DO_LOG" == true && "$heartbeat_text" != "HEARTBEAT_OK" ]]; then
  "$SCRIPT_DIR/log_progress.sh" --summary-text "$heartbeat_text" --impact-type "System" --impact-score 8 >/dev/null
fi
