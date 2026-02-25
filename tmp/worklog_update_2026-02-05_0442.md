## 04:42 (2026-02-05)
Central Brain ops:
- Started `central-brain` dev server locally (Next.js) at http://localhost:3000.
- Confirmed API is running but requires auth (GET /api/tasks → 401 Unauthorized when not logged in).
Next:
- To log into 'Bart - Work Log' and append tasks/notes, need a valid Supabase session (magic link login) in the browser.
Marketing work (ready to convert into work-log entries):
- SEO: calorieapi.com has domain inconsistency across canonical + robots.txt + sitemap.xml + on-page API base URL (foodapi.com vs calorieapi.com). This is the #1 ranking+conversion leak.
- SEO: busybody.io sitemap includes /404, /auth, /reset_pw, /help-center → index bloat; /404 returns 200.
- Newsletter: reactivation ladder + experiment list drafted (tmp/busybits_reactivation_sequence.md + tmp/newsletter_growth_experiments_busybits.md).
