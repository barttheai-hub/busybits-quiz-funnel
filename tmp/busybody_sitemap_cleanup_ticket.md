# busybody.io — sitemap cleanup ticket (index bloat)

## Problem
busybody.io sitemap index includes system/low-value pages that shouldn’t be indexed. This creates index bloat and can be a quality signal risk.

Observed sitemaps:
- `https://busybody.io/sitemap-404.xml` includes `/404` (and `/404` returns HTTP 200, title shows “Bubble | No-code apps”)
- `https://busybody.io/sitemap-auth.xml` includes `/auth`
- `https://busybody.io/sitemap-reset_pw.xml` includes `/reset_pw`
- `https://busybody.io/sitemap-help-center.xml` includes `/help-center`

## Acceptance criteria
1) `/404` returns a **true 404** (or 410) status code.
2) `/404` is **not** in any sitemap.
3) `/auth`, `/reset_pw`, `/help-center` are **not** in any sitemap.
4) `/auth`, `/reset_pw`, `/help-center` have `noindex,follow` (unless explicitly desired otherwise).
5) Google Search Console: coverage errors reduce and indexed pages are only acquisition/content pages.

## Implementation checklist
- Identify sitemap generator (Bubble / plugin / custom).
- Exclude the following paths from sitemap generation:
  - `/404`
  - `/auth`
  - `/reset_pw`
  - `/help-center`
- Fix `/404` route:
  - Ensure it returns HTTP 404 (or 410) and is not cache-served as 200.
  - Add `<meta name="robots" content="noindex,follow">`.
- For `/auth`, `/reset_pw`, `/help-center`:
  - Add `<meta name="robots" content="noindex,follow">`.

## Verification
- `curl -I https://busybody.io/404` returns 404.
- `curl https://busybody.io/sitemap.xml` and child sitemaps do not include excluded URLs.
- Spot-check page source for robots meta.
