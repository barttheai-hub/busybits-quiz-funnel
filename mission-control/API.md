# Mission Control API v1

Auth: include `x-api-token: <token>` on all `/api/*` calls.
Supports token map via `API_TOKENS_JSON` in `.env` for role-based identities.

## Auth
- `GET /api/auth/me`

## Health
- `GET /health`

## Dashboard
- `GET /api/dashboard`

## Focus (Autonomous Prioritization)
- `GET /api/focus` → returns top recommended task + ranked queue (uses task priority/status/due date and linked project health)
- Query params:
  - `owner=<name>` (optional): only rank tasks for a specific owner (e.g., `OpenClaw`)
  - `includeDone=true|false` (optional, default false)
  - `limit=1..50` (optional, default 10)

## Notes
- `GET /api/notes?q=&projectId=`
- `POST /api/notes` `{ title, content, tags?, projectId? }`
- `PUT /api/notes/:id` `{ ...fields }`
- `DELETE /api/notes/:id`

## Tasks
- `GET /api/tasks?owner=&status=`
- `POST /api/tasks` `{ title, description?, owner?, status?, priority?, dueDate?, projectId? }`
- `PUT /api/tasks/:id` `{ ...fields }`
- `DELETE /api/tasks/:id`

## Projects
- `GET /api/projects`
- `POST /api/projects` `{ name, status?, health?, description? }`
- `PUT /api/projects/:id` `{ ...fields }`
- `DELETE /api/projects/:id`

## Resources
- `GET /api/resources?q=`
- `POST /api/resources` `{ title, type?, preview?, url?, projectId? }`
- `PUT /api/resources/:id` `{ ...fields }`
- `DELETE /api/resources/:id`

## Activity
- `GET /api/activity?limit=50`
