#!/usr/bin/env bash
set -euo pipefail

# Log a concrete work update to Mission Control API.
# Usage:
#   ./scripts/log_progress.sh \
#     --task "Build X" \
#     --what "Implemented Y" \
#     --why "Saves time" \
#     --next "Do Z" \
#     [--files "a.md, b.md"] \
#     [--resource-title "Doc"] [--resource-type "doc"] [--resource-url "file://..."] \
#     [--task-status "In Progress|Blocked|Done"] \
#     [--impact-type "Revenue|Time Saving|System|Other"] [--impact-score 0..10]
#
# Or parse heartbeat summary text automatically:
#   ./scripts/log_progress.sh --summary-file /tmp/heartbeat.txt
#   ./scripts/log_progress.sh --summary-text "Task: ...\nChanged files: ...\nWhat changed: ...\nWhy it helps: ...\nNext: ..."
#   cat heartbeat_update.txt | ./scripts/log_progress.sh --summary-stdin

BASE_URL="${MISSION_CONTROL_BASE_URL:-http://localhost:8787}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MC_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="${MISSION_CONTROL_ENV_FILE:-$MC_ROOT/.env}"
TOKEN="${MISSION_CONTROL_API_TOKEN:-}"
PROJECT_ID="${MISSION_CONTROL_PROJECT_ID:-proj_1771743579776_rdsklv}"

TASK=""
WHAT=""
WHY=""
NEXT=""
FILES=""
RESOURCE_TITLE=""
RESOURCE_TYPE="doc"
RESOURCE_URL=""
TASK_STATUS="In Progress"
IMPACT_TYPE="System"
IMPACT_SCORE="8"
SUMMARY_FILE=""
SUMMARY_TEXT=""
SUMMARY_STDIN=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --task) TASK="$2"; shift 2;;
    --what) WHAT="$2"; shift 2;;
    --why) WHY="$2"; shift 2;;
    --next) NEXT="$2"; shift 2;;
    --files) FILES="$2"; shift 2;;
    --resource-title) RESOURCE_TITLE="$2"; shift 2;;
    --resource-type) RESOURCE_TYPE="$2"; shift 2;;
    --resource-url) RESOURCE_URL="$2"; shift 2;;
    --task-status) TASK_STATUS="$2"; shift 2;;
    --impact-type) IMPACT_TYPE="$2"; shift 2;;
    --impact-score) IMPACT_SCORE="$2"; shift 2;;
    --summary-file) SUMMARY_FILE="$2"; shift 2;;
    --summary-text) SUMMARY_TEXT="$2"; shift 2;;
    --summary-stdin) SUMMARY_STDIN=true; shift 1;;
    *) echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

parse_summary() {
  local summary="$1"
  python3 - "$summary" <<'PY'
import json, re, sys
text = sys.argv[1]

def pick(label):
    m = re.search(rf'(?im)^\s*{re.escape(label)}\s*:\s*(.+)$', text)
    return (m.group(1).strip() if m else "")

print(json.dumps({
    "task": pick("Task"),
    "files": pick("Changed files"),
    "what": pick("What changed"),
    "why": pick("Why it helps"),
    "next": pick("Next")
}))
PY
}

if [[ "$SUMMARY_STDIN" == true ]]; then
  SUMMARY_TEXT="$(cat)"
fi

if [[ -n "$SUMMARY_FILE" || -n "$SUMMARY_TEXT" ]]; then
  if [[ -n "$SUMMARY_FILE" ]]; then
    if [[ ! -f "$SUMMARY_FILE" ]]; then
      echo "Summary file not found: $SUMMARY_FILE" >&2
      exit 1
    fi
    SUMMARY_TEXT="$(cat "$SUMMARY_FILE")"
  fi

  PARSED=$(parse_summary "$SUMMARY_TEXT")
  TASK="${TASK:-$(printf '%s' "$PARSED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("task",""))')}"
  FILES="${FILES:-$(printf '%s' "$PARSED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("files",""))')}"
  WHAT="${WHAT:-$(printf '%s' "$PARSED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("what",""))')}"
  WHY="${WHY:-$(printf '%s' "$PARSED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("why",""))')}"
  NEXT="${NEXT:-$(printf '%s' "$PARSED" | python3 -c 'import json,sys; print(json.load(sys.stdin).get("next",""))')}"
fi

if [[ -z "$TASK" || -z "$WHAT" || -z "$WHY" || -z "$NEXT" ]]; then
  echo "Missing required flags: --task --what --why --next (or provide --summary-file/--summary-text with Task/What changed/Why it helps/Next)" >&2
  exit 1
fi

if [[ -z "$TOKEN" && -f "$ENV_FILE" ]]; then
  TOKEN="$(grep '^API_TOKEN=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
fi

if [[ -z "$TOKEN" ]]; then
  echo "Missing API token. Set MISSION_CONTROL_API_TOKEN or provide .env with API_TOKEN." >&2
  exit 1
fi

if ! [[ "$IMPACT_SCORE" =~ ^([0-9]|10)$ ]]; then
  echo "Invalid --impact-score '$IMPACT_SCORE' (must be integer 0..10)" >&2
  exit 1
fi

CONTENT="Task: ${TASK}\nChanged files: ${FILES:-n/a}\nWhat changed: ${WHAT}\nWhy it helps: ${WHY}\nNext: ${NEXT}"

mc_request() {
  local method="$1"; shift
  local path="$1"; shift
  local payload="${1:-}"

  local response http body
  if [[ -n "$payload" ]]; then
    response=$(curl -sS -X "$method" \
      -H "x-api-token: $TOKEN" \
      -H 'content-type: application/json' \
      "$BASE_URL$path" \
      -d "$payload" \
      -w $'\n%{http_code}')
  else
    response=$(curl -sS -X "$method" \
      -H "x-api-token: $TOKEN" \
      "$BASE_URL$path" \
      -w $'\n%{http_code}')
  fi

  http="${response##*$'\n'}"
  body="${response%$'\n'*}"

  if [[ "$http" -lt 200 || "$http" -ge 300 ]]; then
    echo "Mission Control API error ${http} on ${method} ${path}: ${body}" >&2
    exit 1
  fi

  printf '%s' "$body"
}

NOTE_PAYLOAD=$(TASK="$TASK" CONTENT="$CONTENT" PROJECT_ID="$PROJECT_ID" python3 - <<'PY'
import json, os
print(json.dumps({
  "title": f"Progress — {os.environ['TASK']}",
  "content": os.environ["CONTENT"],
  "projectId": os.environ["PROJECT_ID"],
  "tags": ["heartbeat", "autonomous", "progress"]
}))
PY
)

NOTE_JSON=$(mc_request POST "/api/notes" "$NOTE_PAYLOAD")
NOTE_ID=$(printf '%s' "$NOTE_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(obj.get("id",""))')

RESOURCE_ID=""
if [[ -n "$RESOURCE_TITLE" ]]; then
  RES_PAYLOAD=$(RESOURCE_TITLE="$RESOURCE_TITLE" RESOURCE_TYPE="$RESOURCE_TYPE" RESOURCE_URL="$RESOURCE_URL" PROJECT_ID="$PROJECT_ID" python3 - <<'PY'
import json, os
print(json.dumps({
  "title": os.environ["RESOURCE_TITLE"],
  "type": os.environ["RESOURCE_TYPE"],
  "url": os.environ["RESOURCE_URL"],
  "preview": "Auto-logged from heartbeat progress",
  "projectId": os.environ["PROJECT_ID"]
}))
PY
)
  RES_JSON=$(mc_request POST "/api/resources" "$RES_PAYLOAD")
  RESOURCE_ID=$(printf '%s' "$RES_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(obj.get("id",""))')
fi

# Upsert task by title+owner to avoid duplicate task spam on every heartbeat.
EXISTING_ID=$(mc_request GET "/api/tasks?owner=OpenClaw" | TASK="$TASK" python3 -c 'import os,sys,json; rows=json.load(sys.stdin); t=os.environ["TASK"]; print(next((r.get("id","") for r in rows if r.get("title")==t and r.get("owner")=="OpenClaw"), ""))')

if [[ -n "$EXISTING_ID" ]]; then
  TASK_PAYLOAD=$(WHY="$WHY" TASK_STATUS="$TASK_STATUS" IMPACT_TYPE="$IMPACT_TYPE" IMPACT_SCORE="$IMPACT_SCORE" python3 - <<'PY'
import json, os
print(json.dumps({
  "description": os.environ["WHY"],
  "status": os.environ["TASK_STATUS"],
  "priority": "High",
  "impactType": os.environ["IMPACT_TYPE"],
  "impactScore": int(os.environ["IMPACT_SCORE"])
}))
PY
)
  TASK_JSON=$(mc_request PUT "/api/tasks/$EXISTING_ID" "$TASK_PAYLOAD")
  TASK_ID="$EXISTING_ID"
else
  TASK_PAYLOAD=$(TASK="$TASK" WHY="$WHY" TASK_STATUS="$TASK_STATUS" PROJECT_ID="$PROJECT_ID" IMPACT_TYPE="$IMPACT_TYPE" IMPACT_SCORE="$IMPACT_SCORE" python3 - <<'PY'
import json, os
print(json.dumps({
  "title": os.environ["TASK"],
  "description": os.environ["WHY"],
  "owner": "OpenClaw",
  "status": os.environ["TASK_STATUS"],
  "priority": "High",
  "impactType": os.environ["IMPACT_TYPE"],
  "impactScore": int(os.environ["IMPACT_SCORE"]),
  "projectId": os.environ["PROJECT_ID"]
}))
PY
)
  TASK_JSON=$(mc_request POST "/api/tasks" "$TASK_PAYLOAD")
  TASK_ID=$(printf '%s' "$TASK_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(obj.get("id",""))')
fi

if [[ -z "$NOTE_ID" || -z "$TASK_ID" ]]; then
  echo "Mission Control log failed: missing NOTE_ID or TASK_ID" >&2
  exit 1
fi

echo "NOTE_ID=${NOTE_ID}"
echo "RESOURCE_ID=${RESOURCE_ID}"
echo "TASK_ID=${TASK_ID}"
