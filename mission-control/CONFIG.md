# Mission Control Config (Phase-locked)

## Active Phase
- Phase 1: Mission Control build only.

## Priority
- Single priority: build the Second Brain Mission Control to production quality.

## Allowed Work
- Code + copy for Mission Control only:
  - Notes module
  - Tasks module
  - Resources library
  - Projects overview
  - Executive dashboard
  - Activity feed
  - API + auth + docs

## Forbidden During Phase 1
- Any proactive loops unrelated to Mission Control
- Image/audio/video generation
- Outreach/leadgen/account-creation tasks
- Status updates on non-Mission-Control projects

## Heartbeat Contract
- If no concrete Mission Control progress: `HEARTBEAT_OK`
- If progress exists, format exactly:
  - Task:
  - Changed files:
  - What changed:
  - Why it helps:
  - Next:

## Quality Gate
Done only when:
1. UX is Notion-quality and responsive on desktop + mobile.
2. Notes/tasks/resources/projects are usable and clear.
3. OpenClaw can fully operate via API (no errors).
4. Executive dashboard shows real operational state.
5. API has auth + docs.
6. Codebase is clean and organized.
