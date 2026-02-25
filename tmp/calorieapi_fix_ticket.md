# calorieapi.com — SEO + conversion fix ticket (domain consistency)

## Problem
calorieapi.com is inconsistent about its canonical domain and API base URL. Multiple places reference `foodapi.com`.
- `https://www.calorieapi.com/robots.txt` references `Sitemap: https://foodapi.com/sitemap.xml`
- `https://www.calorieapi.com/sitemap.xml` contains `<loc>https://foodapi.com/...`
- On-page examples reference `https://api.foodapi.com/...`
- Page title/branding mismatch (“Busybody - Comprehensive Food & Nutrition Database API”) suggests copy drift

This splits link equity, confuses Google + users, and likely hurts conversion.

## Decision required (pick ONE)
- Option A: canonical = **calorieapi.com** (recommended if that’s the brand you want)
- Option B: canonical = **foodapi.com**

## Acceptance criteria (after decision)
1) HTML `<link rel="canonical">` points to chosen domain on all pages.
2) `robots.txt` `Sitemap:` points to chosen domain.
3) `sitemap.xml` `<loc>` URLs are all chosen domain.
4) On-page copy and docs use ONE API base URL consistently.
5) Demo curl snippet uses the correct domain.

## Implementation checklist
- Update canonical tags in the site template/layout.
- Regenerate sitemap.xml using chosen base URL.
- Update robots.txt sitemap line.
- Find/replace on-page domain mentions:
  - `api.foodapi.com` → `api.<chosen-domain>` (or your actual API hostname)
  - `foodapi.com` → `<chosen-domain>`
- Update title/brand copy to match chosen domain.

## Quick verification steps
- Visit /robots.txt and ensure Sitemap points to chosen domain.
- Fetch /sitemap.xml and spot-check 10 URLs.
- View source on homepage and verify canonical.
- Run a site: query after reindexing (later).
