#!/usr/bin/env bash
set -euo pipefail
BASE="${1:-http://localhost:8787}"
TOK="${2:-change-me}"

curl -sf "$BASE/health" >/dev/null
curl -sf -H "x-api-token: $TOK" "$BASE/api/auth/me" >/dev/null

NID=$(curl -sf -X POST -H "x-api-token: $TOK" -H 'content-type: application/json' "$BASE/api/notes" -d '{"title":"Smoke Note","content":"ok"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
curl -sf -X PUT -H "x-api-token: $TOK" -H 'content-type: application/json' "$BASE/api/notes/$NID" -d '{"title":"Smoke Note Updated"}' >/dev/null

PID=$(curl -sf -X POST -H "x-api-token: $TOK" -H 'content-type: application/json' "$BASE/api/projects" -d '{"name":"Smoke Project"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
TID=$(curl -sf -X POST -H "x-api-token: $TOK" -H 'content-type: application/json' "$BASE/api/tasks" -d "{\"title\":\"Smoke Task\",\"owner\":\"Me\",\"priority\":\"Medium\",\"projectId\":\"$PID\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')
RID=$(curl -sf -X POST -H "x-api-token: $TOK" -H 'content-type: application/json' "$BASE/api/resources" -d "{\"title\":\"Smoke Resource\",\"type\":\"doc\",\"projectId\":\"$PID\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["id"])')

curl -sf -H "x-api-token: $TOK" "$BASE/api/dashboard" >/dev/null
curl -sf -H "x-api-token: $TOK" "$BASE/api/activity?limit=10" >/dev/null

curl -sf -X DELETE -H "x-api-token: $TOK" "$BASE/api/resources/$RID" >/dev/null
curl -sf -X DELETE -H "x-api-token: $TOK" "$BASE/api/tasks/$TID" >/dev/null
curl -sf -X DELETE -H "x-api-token: $TOK" "$BASE/api/projects/$PID" >/dev/null
curl -sf -X DELETE -H "x-api-token: $TOK" "$BASE/api/notes/$NID" >/dev/null

echo "SMOKE_OK"
