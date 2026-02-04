# HEARTBEAT.md

Every heartbeat (~10m):

1) Check chat (Discord):
   - scan recent messages in active channels
   - respond to direct questions / @mentions
   - look for blockers, failing deploys, or "do X" requests

2) Check engineering state ("kanban" = what to ship next):
   - check GitHub PRs/CI for this repo; if anything is failing, post the error + the next fix step
   - check repo status for the next shippable item (STATUS.md + open PRs)

3) Check memory files (workspace):
   - skim recent memory/*.md + MEMORY.md for any explicit todos or reminders
   - if a todo is actionable, start it; if it needs a decision, ask a tight question

4) Check tasks (project):
   - look for any obvious improvements we can ship without permission (small fixes, tests, docs, refactors)
   - if nothing is immediately actionable, pick the next roadmap feature and start a PR

5) If nothing needs attention:
   - There is ALWAYS something actionable: pick the highest-leverage next step that advances Ziga’s goals (prefer lead gen / marketing).
   - Start it immediately and post progress.
   - Log every task you work on in Central Brain Tasks (your own work log) and set status to doing/done.
   - Never reply HEARTBEAT_OK; instead, create/advance a task and report what you did.
