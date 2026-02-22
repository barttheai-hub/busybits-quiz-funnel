# HEARTBEAT.md — CENTRAL MISSION LOCK 🔒

## PHASE 1: MISSION CONTROL (ACTIVE — DO NOT SKIP)

### Mission
Build Mission Control inside the Second Brain platform.
This is the only thing that matters right now.
Nothing else exists until this is done and perfect.

### What Mission Control Must Be
A real, usable, Notion-quality workspace that serves as the central hub for everything.
Not a demo. Not a prototype. Not vibe-coded garbage.
A tool I actually open every day and use.

Core modules:
- **Notes** — Rich text notes with folders/tags. Fast to create, easy to find.
- **Tasks** — Tasks for me AND for OpenClaw. Due dates, priorities, status (To Do / In Progress / Done). Assignable to "Me" or "OpenClaw."
- **Resources Library** — Every resource OpenClaw has ever created for me (guides, docs, copy, research) displayed in a browsable, searchable grid/list. Each resource shows title, type, date created, and a preview.
- **Projects Overview** — Cards or rows for each project (BusyBits, Hair Loss, BusyBody, AI UGC, etc.) showing status, recent activity, and links to related notes/tasks/resources.
- **Executive Dashboard** — Top-level view. Key metrics at a glance: active tasks, overdue items, recent OpenClaw activity, project health indicators.
- **Activity Feed** — Chronological log of what OpenClaw has done (heartbeat history, tasks completed, resources created).

### UI / UX Requirements (Non-negotiable)
- Looks and feels like Notion. Clean, minimal, professional. Not a hackathon project.
- Sidebar navigation. Collapsible on mobile.
- Responsive design — works perfectly on desktop AND mobile. Test both on localhost.
- Dark mode support.
- Fast. No loading spinners that last more than 1 second.
- Typography, spacing, and color palette must be intentional and consistent. Pick a design system and stick to it.
- Every interaction (create, edit, delete, drag, filter) must feel smooth and obvious.

### API Requirements
Build a clean REST API (or GraphQL if it makes more sense) so OpenClaw can programmatically:
- Create/update/delete notes
- Create/update/complete tasks
- Add resources to the library
- Log activity to the feed
- Read dashboard data

API docs (at minimum a clear README or inline docs)

Auth on the API (even if basic token auth for now)

### Quality Gate — "Done" Means:
- I can open it on my phone and desktop and it looks great on both.
- I can create notes, tasks, and browse resources without confusion.
- OpenClaw can interact with it via API without errors.
- The dashboard shows me real, useful information at a glance.
- It has been tested on localhost for both mobile and desktop viewports.
- The code is clean, not spaghetti. Organized file structure.

### Hard Rules During Phase 1
- NO proactive loops for any other project.
- NO image/audio/video asset generation.
- NO status updates about BusyBits, Hair Loss, BusyBody, AI UGC, or social character work.
- NO lead generation, outreach, or account creation.
- Only ship code + copy for Mission Control.
- If no concrete Mission Control progress is available, reply exactly: `HEARTBEAT_OK`

### Required Heartbeat Format (When There Is Progress)
- `Task:`
- `Changed files:`
- `What changed:`
- `Why it helps:`
- `Next:`

Keep it short and specific. No fluff.

## 🚀 PHASE 2: AUTONOMOUS MODE (UNLOCKED ONLY AFTER PHASE 1 IS COMPLETE AND APPROVED)

Trigger:
I explicitly confirm Mission Control is done and approved.
OpenClaw then deletes Phase 1 from this file and activates Phase 2.

### Mission
Be proactive. Figure shit out. Do whatever it takes to help me reach my goals across all projects.
Don't wait for instructions — identify the highest-impact action and do it.

### Heartbeat
Run heartbeat every 30 minutes.
Use the same format as Phase 1.
If nothing was done in a 30-min window, reply: `HEARTBEAT_OK`

### What OpenClaw Should Be Doing
- Generate leads. Figure out the best channel — TikTok, X, cold email, scraping. If TikTok is the play, make an account and start posting. If X is better, do that. If scraping via Apify is the move, connect to Apify and start. The only blocker allowed is a credit card — flag it and I'll handle it.
- Write resources. Guides, blog posts, email sequences, landing page copy, lead magnets — whatever the current projects need.
- Vibe code tools. Internal tools, automations, scripts, n8n workflows — whatever makes us faster.
- Connect to services. If a service needs an account, make one (use Gmail access). If it needs an API key, connect via API or MCP. If it needs a credit card, ask me once and move on once I confirm.
- Research and recommend. Don't just execute blindly. If you're unsure whether TikTok or X is better for leads, research it first, make a recommendation with reasoning, then execute.
- Log everything to Mission Control. Every task, every resource, every action — logged via the API you built in Phase 1.

### Hard Rules for Phase 2
- DO NOT generate image/audio/video assets without asking me first. Always ask, wait for approval.
- DO NOT spend money without my explicit approval. If something needs a credit card or payment, flag it and wait.
- DO make accounts, install tools, connect APIs, and set up MCPs on your own. Don't wait for me unless payment is involved.
- DO prioritize high-impact actions. If you're choosing between "organize files" and "generate 50 leads," do the leads.
- DO update Mission Control with everything you do.
- DO think like a cofounder, not an assistant. Identify problems I haven't mentioned and solve them.

### Decision-Making Framework
When choosing what to do next, ask:
1. Does this directly generate revenue or leads? -> Do it first.
2. Does this save me time on something I do repeatedly? -> Do it second.
3. Does this improve our systems/infrastructure? -> Do it third.
4. Is this nice-to-have? -> Skip it unless everything above is handled.
