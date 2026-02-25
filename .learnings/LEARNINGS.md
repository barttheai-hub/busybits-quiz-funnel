# LEARNINGS.md

## [LRN-20260205-001] correction

**Logged**: 2026-02-05T05:16:48Z
**Priority**: critical
**Status**: pending
**Area**: config

### Summary
Autonomy failed when relying on heartbeats/user prompts; must schedule proactive wake+work loop and always log work to Central Brain. Default work focus must cover full growth stack (funnels/CRO/copy/offers/email/social lead gen), not just SEO.

### Details
Ziga expected overnight proactive work with 30-min cadence updates. I did some initial setup but went silent for hours because I relied on passive triggers (heartbeats / user prompts). This violates the requirement: always be working on lead-gen/marketing tasks without prompts, always post progress updates, and always log tasks in Central Brain.

Additionally, I overly narrowed "proactive" to SEO. Ziga clarified proactive scope includes: marketing email sequences, funnels, conversion optimization, copy, offer, social media lead gen, and social growth—SEO is only one small piece.

### Suggested Action
- Use cron-based wake loop for cadence (e.g., every 30 min) with explicit instructions to:
  1) do proactive work across the *full growth stack* (funnel/CRO/copy/offer/email/social lead gen + SEO)
  2) log task progress in Central Brain (Doing/Done)
  3) append timestamp to an overnight log file
  4) post timestamped update to Discord
- Keep HEARTBEAT.md aligned: "never reply HEARTBEAT_OK" and "always ship something".
- Maintain a rotating checklist so each 2–4 hour block covers multiple growth levers (not just one).

### Metadata
- Source: user_feedback
- Related Files: HEARTBEAT.md, memory/overnight-2026-02-04.md
- Tags: autonomy, cadence, cron, accountability, logging

---

## [LRN-20260220-002] correction

**Logged**: 2026-02-20T00:00:00Z
**Priority**: high
**Status**: pending
**Area**: workflow

### Summary
When a content operation is blocked by format or tool friction, I must autonomously solve it end-to-end without asking the user, except for payment-gated blockers.

### Details
During Instagram posting, upload failed due to unsupported WEBP format. I asked the user to provide JPG/PNG or approve conversion instead of immediately finding and executing multiple self-service fallback methods. User clarified expectation: solve these issues independently every time, and only escalate blockers related to payment.

### Suggested Action
- On upload failures, run automatic fallback chain without asking:
  1) local conversion pipeline (webp -> jpg/png)
  2) alternate converter methods/tools
  3) re-upload with validated format and dimensions
- Keep asking user only for true external blockers (payments, account billing, unavailable credentials that cannot be recovered).
- Add this as a standing operating rule for social posting workflows.

### Metadata
- Source: user_feedback
- Related Files: builds/milamoves/day1/day1_asset_pack.md
- Tags: autonomy, execution, social, posting, fallback

---
