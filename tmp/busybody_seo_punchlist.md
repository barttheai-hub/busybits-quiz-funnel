# Busybody SEO punchlist (quick wins)

## Highest impact (fix these first)

### 1) calorieapi.com domain consistency (ranking + conversion)
**Problem:** calorieapi.com is serving robots/sitemap URLs for `foodapi.com` and on-page copy references `api.foodapi.com`.
- `https://www.calorieapi.com/robots.txt` → `Sitemap: https://foodapi.com/sitemap.xml`
- `https://www.calorieapi.com/sitemap.xml` → `<loc>https://foodapi.com/...` everywhere
- Demo curl uses `https://api.foodapi.com/...`

**Fix:** Pick ONE canonical domain (either calorieapi.com or foodapi.com) and align everything:
- `<link rel="canonical" ...>`
- robots.txt `Sitemap:`
- sitemap.xml `<loc>` URLs
- on-page links/curl examples/API base URL

**Why it matters:** avoids splitting link equity + prevents Google indexing the “wrong site”; improves trust + conversion clarity.

---

### 2) Remove low-value / system pages from busybody.io sitemap + noindex
**Problem:** sitemap includes non-acquisition pages that add index bloat / low quality signals.
- `https://busybody.io/sitemap-404.xml` includes `/404` (and `/404` returns HTTP 200 with title "Bubble | No-code apps")
- `https://busybody.io/sitemap-auth.xml` includes `/auth`
- `https://busybody.io/sitemap-reset_pw.xml` includes `/reset_pw`
- `https://busybody.io/sitemap-help-center.xml` includes `/help-center`

**Fix:**
- Remove these URLs from sitemap.
- Ensure `/404` actually returns 404/410.
- Add `noindex,follow` to auth/reset/help-center pages (unless you intentionally want them indexed).

**Why it matters:** better crawl budget + avoids thin/irrelevant pages getting indexed.

---

## Medium impact

### 3) busybody.io structured data (JSON-LD)
**Problem:** busybody.io appears to have no structured data.
**Fix:** add minimal JSON-LD:
- Organization
- WebSite (with SearchAction if you have a site search)
- SoftwareApplication or Product (depending on positioning)
- FAQPage on key landing pages

---

### 4) busybody.io multiple H1s
**Problem:** multiple H1s detected.
**Fix:** keep one primary H1 per page; convert others to H2/H3.

---

## Notes
- Blog posts appear thin (titles load but content may be shallow). If SEO becomes a priority, consider upgrading top 10 posts with real EEAT: author bio, references, unique insights, internal links, and clearer intent matching.
