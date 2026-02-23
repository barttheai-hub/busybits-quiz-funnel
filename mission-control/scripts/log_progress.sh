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
#     [--resource-title "Doc"] [--resource-type "doc"] [--resource-url "file://..."]

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
    *) echo "Unknown arg: $1" >&2; exit 1;;
  esac
done

if [[ -z "$TASK" || -z "$WHAT" || -z "$WHY" || -z "$NEXT" ]]; then
  echo "Missing required flags: --task --what --why --next" >&2
  exit 1
fi

if [[ -z "$TOKEN" ]]; then
  if [[ -f "$ENV_FILE" ]]; then
    TOKEN="$(grep '^API_TOKEN=' "$ENV_FILE" | head -n1 | cut -d= -f2-)"
  fi
fi

if [[ -z "$TOKEN" ]]; then
  echo "Missing API token. Set MISSION_CONTROL_API_TOKEN or provide .env with API_TOKEN." >&2
  exit 1
fi

CONTENT="Task: ${TASK}\nChanged files: ${FILES:-n/a}\nWhat changed: ${WHAT}\nWhy it helps: ${WHY}\nNext: ${NEXT}"

NOTE_PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "title": f"Progress — {"""$TASK"""}",
  "content": """$CONTENT""",
  "projectId": """$PROJECT_ID""",
  "tags": ["heartbeat", "autonomous", "progress"]
}))
PY
)

NOTE_JSON=$(curl -sS -X POST \
  -H "x-api-token: $TOKEN" \
  -H 'content-type: application/json' \
  "$BASE_URL/api/notes" \
  -d "$NOTE_PAYLOAD")

NOTE_ID=$(printf '%s' "$NOTE_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(obj.get("id",""))')

RESOURCE_ID=""
if [[ -n "$RESOURCE_TITLE" ]]; then
  RES_PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "title": """$RESOURCE_TITLE""",
  "type": """$RESOURCE_TYPE""",
  "url": """$RESOURCE_URL""",
  "preview": "Auto-logged from heartbeat progress",
  "projectId": """$PROJECT_ID"""
}))
PY
)
  RES_JSON=$(curl -sS -X POST \
    -H "x-api-token: $TOKEN" \
    -H 'content-type: application/json' \
    "$BASE_URL/api/resources" \
    -d "$RES_PAYLOAD")
  RESOURCE_ID=$(printf '%s' "$RES_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(obj.get("id",""))')
fi

TASK_PAYLOAD=$(python3 - <<PY
import json
print(json.dumps({
  "title": """$TASK""",
  "description": """$WHY""",
  "owner": "OpenClaw",
  "status": "In Progress",
  "priority": "High",
  "projectId": """$PROJECT_ID"""
}))
PY
)

TASK_JSON=$(curl -sS -X POST \
  -H "x-api-token: $TOKEN" \
  -H 'content-type: application/json' \
  "$BASE_URL/api/tasks" \
  -d "$TASK_PAYLOAD")

TASK_ID=$(printf '%s' "$TASK_JSON" | python3 -c 'import sys,json; obj=json.load(sys.stdin); print(obj.get("id",""))')

echo "NOTE_ID=${NOTE_ID}"
echo "RESOURCE_ID=${RESOURCE_ID}"
echo "TASK_ID=${TASK_ID}"
