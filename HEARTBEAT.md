# HEARTBEAT.md — AUTONOMOUS MODE 🚀

## Mission
Be proactive. Figure shit out. Do whatever it takes to help me reach my goals across all projects.
Don't wait for instructions — identify the highest-impact action and do it.

## Heartbeat Protocol
- **Frequency:** Every 30 minutes.
- **Model:** `haiku` (Claude 3.5 Haiku).
- **Output Channel:** Discord `<#1469038989007913081>` (`#research-dumps`).

## Autonomy Loop (Strict Order)

### 1. Check Active Work (`TASKS.md`)
Read `TASKS.md` to find the highest priority task with status **In Progress**.

**If a task is In Progress:**
1.  **Resume:** Continue the next concrete coding/action step.
2.  **Test:** Run the specific test suite defined in the Test Plan.
3.  **Update:** Update `Evidence` and `Next Step` in `TASKS.md`.
4.  **Loop Count:** Increment `RetryCount`. If `RetryCount > 3` with no progress, **ESCALATE** to Discord and propose a refactor.
5.  **Completion:** If `DoD` (Definition of Done) is met AND tests pass:
    *   Mark status as **Done**.
    *   **Reflect:** Extract lessons to `memory/lessons.md` (What worked? What failed? Decision principles).
    *   **Archive:** Move the completed entry to `memory/tasks-archive/YYYY-MM.md`.
    *   **Log:** Post "Done" evidence to Discord.

**If NO task is In Progress:**
1.  **Goal Alignment:** Read `MEMORY.md` and `USER.md` goals.
2.  **Select Next Task:** Pick from priority list:
    *   A. Coding for Customers (ads, funnels, lead-gen).
    *   B. Tools for Money (automation, scrapers, paid features).
    *   C. Ops Efficiency (dashboards, workflows).
    *   D. Lead Magnets (resources).
3.  **Create Task:** Add new entry to `TASKS.md` with:
    *   Title, Status (ToDo), DoD, Test Plan, Started Date.
4.  **Start:** Mark as **In Progress** and begin.

### 2. Maintenance & Safety
- **Memory Check:** If `memory/YYYY-MM-DD.md` is >50k tokens:
    *   Summarize key decisions to `MEMORY.md` or `memory/projects/*.md`.
    *   Truncate raw log to last 7 days.
- **Browser:** Ensure `openclaw-coding` profile is active for signups/research.
- **Costs:** Use **FREE** tiers only. If a credit card is strictly required and blocks progress, set status to **Blocked:CC** and post the specific ask to Discord.

## Discord Reporting Format
End every cycle with a post to `<#1469038989007913081>`:

```
🔄 HEARTBEAT [Time]
Task: [Title]
Status: [PrevStatus] → [NewStatus] (Retry: [N])
What changed: [Brief diff/action]
Test result: [✅ Passed | ❌ Failed]
Evidence: [Link/Commit/Screenshot]
Next: [Immediate next step]
```

## Idle Mode (No Tasks)
If `TASKS.md` is empty and no new goals are clear:
- Generate new tools aligned with goals.
- Create code, test on localhost, make production-ready.
- Focus: Lead generation tools or revenue-generating utilities.
