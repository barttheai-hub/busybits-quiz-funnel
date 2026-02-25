# Overnight work log — 2026-02-04 (America/Denver)

Cadence target: ~every 30 min. Each entry: timestamp + what changed + next step.

## 14:59
- Started overnight proactive block. Created Central Brain board: "Bart - Work Log" and logged overnight tasks (SEO audit framework, app growth experiments, newsletter growth experiments, AI UGC production best practices).
- Created cron reminder to send 8-hour brief.
Next: research SEO best practices + app/newsletter growth experiments; compile into actionable checklists + experiments.

## 15:08
- Got URLs from Ziga:
  - https://busybody.io
  - https://fasting.busybody.io/hairloss/ (blocked by Cloudflare 403 via web_fetch; will audit via browser later)
  - https://busybits-news.beehiiv.com/
  - https://www.calorieapi.com
- Quick SEO/metadata checks via browser:
  - busybody.io: title OK; meta description present; canonical present; **NO structured data**; **multiple H1s** detected (likely not ideal for SEO).
  - calorieapi.com: meta description present; **canonical points to https://busybody.com (likely wrong)**; has JSON-LD schema.
Next: deeper audits (CWV, indexability, sitemap/robots, internal links) + prioritized fix list; compile app/newsletter growth experiments.

## 22:10
- Gap identified: I did NOT keep the 30-min cadence updates overnight as requested.
- Fix applied: added a cron job to force a wake every 30 minutes with instructions to (1) do proactive marketing work, (2) log to Central Brain "Bart - Work Log", (3) append here, (4) post the timestamped update to Discord.
Immediate next: continue deeper SEO audit + create prioritized fix list, starting with (a) calorieapi.com canonical mismatch, (b) busybody.io H1 cleanup + JSON-LD schema.

## 22:13
SEO audit progress (indexability + technical SEO):
- busybody.io
  - robots.txt exists and references sitemap ✅
    - Disallow rules present for dashboards/credit (fine)
    - Sitemap: https://busybody.io/sitemap.xml ✅
  - sitemap.xml is a sitemap index ✅ (multiple child sitemaps incl. blog, resources, help-center)
- calorieapi.com
  - robots.txt exists but references the WRONG sitemap domain ❌
    - robots.txt: `Sitemap: https://foodapi.com/sitemap.xml`
  - sitemap.xml content also uses the WRONG domain ❌
    - URLs are `https://foodapi.com/...` (not calorieapi.com)
  - Impact: Google may index/attribute pages under the wrong canonical host and/or ignore calorieapi.com pages.
Next: fix calorieapi.com canonical + robots/sitemap host consistency (biggest SEO leak), then add minimal JSON-LD org/product/faq to busybody.io.

## 22:42
Deeper calorieapi.com SEO findings + quick fix checklist:
- Confirmed: `https://www.calorieapi.com/sitemap.xml` is serving URLs for `https://foodapi.com/...` ❌
- Confirmed: `https://www.calorieapi.com/robots.txt` also references `https://foodapi.com/sitemap.xml` ❌
- Content/copy also references the wrong domain in key conversion spots:
  - Demo curl uses `https://api.foodapi.com/...`
  - Page title is "Busybody - Comprehensive Food & Nutrition Database API" (brand mismatch)
  - This is a *ranking + conversion* issue (confuses users + splits link equity across domains)
Actionable fix checklist (high leverage):
1) Decide canonical domain: calorieapi.com vs foodapi.com (pick ONE)
2) Update HTML head canonical to chosen domain
3) Update robots.txt `Sitemap:` to chosen domain
4) Regenerate sitemap.xml with chosen domain URLs
5) Update all on-page mentions (curl examples, docs links, API base URL) to the same domain
Next: skim busybody.io child sitemaps for index bloat (e.g., /404, /auth) and recommend pruning/noindex where appropriate.

## 23:42
busybody.io index-bloat check:
- `https://busybody.io/sitemap-404.xml` exists and includes `https://busybody.io/404` ❌
  - That /404 URL returns 200 with title "Bubble | No-code apps" (not a true 404).
  - This is index bloat + a quality signal risk (thin/irrelevant page in sitemap).
- Blog post URLs load (at least title extracts fine) ✅, but many appear to be very thin AI-ish content (likely needs depth/EEAT if SEO is a goal).
Recommendation:
1) Remove /404 from sitemap entirely.
2) Make /404 return HTTP 404 status (or 410) and add `noindex`.
3) Consider removing low-value system pages (auth/reset_pw/help-center?) from sitemap or noindex them if they don’t drive acquisition.
Next: check `sitemap-auth.xml` + `sitemap-reset_pw.xml` contents; compile a “keep vs noindex” list.

## 00:12
busybody.io sitemap keep-vs-noindex (system pages):
- `sitemap-auth.xml` contains only: `https://busybody.io/auth` ❌ (likely not an acquisition page)
- `sitemap-reset_pw.xml` contains only: `https://busybody.io/reset_pw` ❌ (not acquisition)
Both return 200 and appear thin.
Recommendation:
- Remove these from sitemap and set `noindex,follow` on auth/reset password pages.
- If you need them indexable for some reason (rare), at least exclude from sitemap and ensure content/headers don’t look like thin doorway pages.
Next: sample `sitemap-help-center.xml` size/quality; then draft a consolidated “SEO fix punchlist” (priority order, ~30 min engineering work items).

## 02:42
- Checked `sitemap-help-center.xml`: it contains only `https://busybody.io/help-center` (also likely not an acquisition page).
- Drafted a 1-page prioritized SEO punchlist (saved to `tmp/busybody_seo_punchlist.md`).
Next: convert punchlist into small engineering tickets + identify who owns each (Bubble vs other), then start on newsletter growth experiment list.

## 03:12
Newsletter growth work (BusyBits):
- Drafted a prioritized experiment list for open-rate lift + engagement + reactivation + growth loops + paid acquisition.
- Saved to `tmp/newsletter_growth_experiments_busybits.md`.
Next: turn this into (a) a 14-day test plan (pick 3 experiments), and (b) ready-to-send copy blocks (subject line sets, reactivation emails, referral CTA modules).

## 03:42
- Wrote ready-to-send 3-email cold-subscriber reactivation ladder copy (saved to `tmp/busybits_reactivation_sequence.md`).
Next: write subject-line “bank” for next 5 sends + propose top 3 experiments for the next 14 days based on effort/impact.

## 04:42
Central Brain ops:
- Started `central-brain` dev server locally (Next.js) at http://localhost:3000.
- Confirmed API is live but requires auth (GET /api/tasks → 401 Unauthorized when not logged in).
- Next step to log into “Bart - Work Log”: open the app in a browser and complete Supabase magic-link login.

Proactive marketing work (queued to log into Work Log once authenticated):
- SEO (highest impact): calorieapi.com has domain inconsistency across canonical + robots.txt + sitemap.xml + on-page API base URL (foodapi.com vs calorieapi.com).
- SEO: busybody.io sitemap includes /404, /auth, /reset_pw, /help-center (index bloat); /404 returns HTTP 200.
- Newsletter: experiments + reactivation ladder already drafted in tmp/.

## 05:11
Newsletter growth (BusyBits):
- Created a subject-line bank for the next 5 sends (with preheader ideas) → `tmp/subject_line_bank_busybits_5_sends.md`.
Next:
- Convert the subject-line bank + reactivation ladder into a 14-day test plan (pick 3 experiments) + ready-to-paste Beehiiv modules.
Blocker:
- Still can’t log into Central Brain “Bart - Work Log” without pasting the 8-digit email code or the magic-link URL.

## 09:41
Newsletter growth (BusyBits):
- Turned the experiment list into a tight 14-day sprint plan (3 experiments) → `tmp/busybits_14_day_plan.md`.
Next:
- Convert the plan into Beehiiv-ready assets: exact A/B/C subject lines per send + 3 reactivation emails formatted for Beehiiv.
Blocker:
- Central Brain logging still blocked on email OTP/magic-link (no inbox access from here).

## 10:11
Newsletter growth (BusyBits):
- Created Beehiiv-ready version of the 3-email cold-subscriber reactivation ladder (with Subject A/B/C + preheaders + placeholders) → `tmp/busybits_reactivation_sequence_beehiiv_ready.md`.
Next:
- Produce Beehiiv-ready “next 5 sends” blocks (the One Big Idea template) with matching A/B/C subject lines.
Blocker:
- Still blocked on Central Brain login (need OTP/magic-link pasted).

## 11:28
Newsletter growth (BusyBits):
- Wrote Beehiiv-ready copy for the next 5 regular sends using the “One Big Idea” template + A/B/C subject lines + placeholders for links → `tmp/busybits_next5_sends_one_big_idea.md`.
Next:
- Package all BusyBits assets into a single “send kit” (what to send + when + segmentation + success metrics), then log into Central Brain Work Log once OTP is provided.
Blocker:
- Central Brain login still blocked on OTP/magic-link (no inbox access here).

## 13:11
SEO ticketization:
- Drafted engineering-ready tickets/specs for:
  - calorieapi.com domain consistency (canonical/robots/sitemap/on-page) → `tmp/calorieapi_fix_ticket.md`
  - busybody.io sitemap index-bloat cleanup + /404 returning 200 → `tmp/busybody_sitemap_cleanup_ticket.md`
Next:
- Get these logged into Central Brain “Bart - Work Log” once authenticated; then move to structured data (JSON-LD) + H1 cleanup ticket for busybody.io.
Blocker:
- Still blocked on Central Brain login (need OTP/magic-link pasted).

## 14:11
SEO ticketization:
- Drafted 2 more engineering-ready tickets for busybody.io:
  - JSON-LD structured data → `tmp/busybody_jsonld_ticket.md`
  - H1 cleanup (single H1 per page) → `tmp/busybody_h1_cleanup_ticket.md`
Next:
- Log all SEO tickets into Central Brain “Bart - Work Log” once authenticated; then start AI UGC process checklist (production SOP).
Blocker:
- Central Brain login still blocked (need OTP/magic-link pasted; no inbox access here).

## 14:41
AI UGC processes:
- Drafted a Meta-native AI UGC production SOP (angles + script template + variation system + testing plan) → `tmp/ai_ugc_production_sop.md`.
Next:
- Tailor SOP to hair-loss + $7 AI UGC pack: 10 hook bank + 3 scripts + testing matrix.
Blocker:
- Central Brain logging still blocked on OTP/magic-link.

## 23:41
AI UGC (hair-loss):
- Drafted hair-loss AI UGC assets: 10-hook bank + 3 Meta-native scripts + testing matrix → `tmp/hairloss_aiugc_hooks_and_scripts.md`.
Next:
- Turn scripts into shotlists (scene-by-scene), caption overlays, and a test spreadsheet layout (9 ads = 3 hooks x 3 angles).
Blocker:
- Still blocked on Central Brain 'Bart - Work Log' login (OTP/magic-link).

## 00:11
AI UGC (hair-loss):
- Converted the 3 scripts into scene-by-scene shotlists + caption overlays + 9-ad testing pack guidance → `tmp/hairloss_aiugc_shotlists_and_captions.md`.
Next:
- Build a reusable testing spreadsheet template + compliance/claim checklist.
Blocker:
- Central Brain Work Log still auth-blocked (OTP/magic-link).

## 01:41
AI UGC testing ops:
- Drafted a reusable ad testing sheet template → `tmp/aiugc_testing_sheet_template.md`.
- Drafted a hair-loss claims/compliance preflight checklist → `tmp/hairloss_claims_compliance_checklist.md`.
Next:
- Merge all hair-loss AI UGC assets into a single pack + prefill 9 ads (3 hooks x 3 angles) as rows for easy paste.
Blocker:
- Central Brain Work Log still auth-blocked (OTP/magic-link).
