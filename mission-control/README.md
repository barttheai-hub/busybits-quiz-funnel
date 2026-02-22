# Mission Control (Second Brain)

Mission Control is a practical executive workspace for Ziga + OpenClaw.

## Includes
- Executive Dashboard
- Notes
- Tasks (Me/OpenClaw ownership)
- Resources Library
- Projects Overview
- Activity Feed
- REST API with token auth

## Run
1. Copy env:
   - `cp .env.example .env`
2. Install deps:
   - `npm install`
3. Start:
   - `npm run dev`
4. Open:
   - `http://localhost:8787`

Use a token from `.env` in the web UI top bar.

Recommended auth config:
- `API_TOKENS_JSON={"your-owner-token":{"name":"Ziga","role":"owner"},"your-agent-token":{"name":"OpenClaw","role":"agent"}}`

## API
See `API.md`.

## File Structure
- `src/server.js` - API + static web host
- `src/routes/*` - route modules
- `src/lib/db.js` - SQLite connection + migrations
- `src/lib/store.js` - helpers (ids, row parsing, activity)
- `data/mission-control.db` - local SQLite datastore
- `web/*` - UI

## Notes
This is Phase 1 foundation optimized for fast iteration and clear UX.
