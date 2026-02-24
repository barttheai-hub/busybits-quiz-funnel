# Mission Control (Second Brain)

Mission Control is a practical executive workspace for Ziga + OpenClaw.

## Includes
- Executive Dashboard
- Notes
- Tasks (Me/OpenClaw ownership)
- Resources Library
- Projects Overview
- Activity Feed
- Focus endpoint for autonomous prioritization (`GET /api/focus`)
- REST API with token auth

## Run
1. Copy env:
   - `cp .env.example .env`
2. Install deps:
   - `npm install`
3. Start:
   - Dev: `npm run dev`
   - Normal: `npm start`
   - Background (survives tool session SIGKILL): `npm run start:bg`
4. Open:
   - `http://localhost:8787`

Background control:
- `npm run status:bg`
- `npm run stop:bg`
- `npm run restart:bg`

Heartbeat logging helper:
- `./scripts/log_progress.sh --task "..." --what "..." --why "..." --next "..." --files "a,b"`
- Optional: `--resource-title`, `--resource-type`, `--resource-url`
- Uses `API_TOKEN` from `mission-control/.env` automatically (or `MISSION_CONTROL_API_TOKEN`).

Focus scoring tip (Phase 2): set task impact metadata so autonomous ranking prefers money-making work first.
Example task payload:
- `{ "title":"Launch paid quiz ads", "owner":"OpenClaw", "priority":"High", "impactType":"Revenue", "impactScore":9 }`

Use a token from `.env` in the web UI top bar.

Recommended auth config:
- `API_TOKENS_JSON={"your-owner-token":{"name":"Ziga","role":"owner"},"your-agent-token":{"name":"OpenClaw","role":"agent"}}`

## API
See `API.md`.

## Autonomous loop helper
- `scripts/autonomous_tick.sh` fetches the top ranked task from `/api/focus` and emits heartbeat-format output.
- Add `--log` to auto-log the summary back into Mission Control via `scripts/log_progress.sh`.

## File Structure
- `src/server.js` - API + static web host
- `src/routes/*` - route modules
- `src/lib/db.js` - SQLite connection + migrations
- `src/lib/store.js` - helpers (ids, row parsing, activity)
- `data/mission-control.db` - local SQLite datastore
- `web/*` - UI

## Notes
This is Phase 1 foundation optimized for fast iteration and clear UX.
