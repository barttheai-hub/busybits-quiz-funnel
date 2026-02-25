# SEO — active punchlists

## calorieapi.com (highest impact)
Issue: domain inconsistency across canonical + robots.txt + sitemap.xml + on-page API base URL.
- robots.txt references foodapi.com sitemap
- sitemap.xml locs are foodapi.com
- demo curl uses api.foodapi.com
Impact: splits link equity, confuses users/Google, hurts ranking + conversion.
Ticket/spec: `tmp/calorieapi_fix_ticket.md`

## busybody.io
Issue: sitemap index bloat (system/low-value pages included): /404, /auth, /reset_pw, /help-center. /404 returns 200.
Impact: crawl budget + quality signals.
Punchlist: `tmp/busybody_seo_punchlist.md`
Ticket/spec: `tmp/busybody_sitemap_cleanup_ticket.md`
Tickets/specs:
- JSON-LD structured data: `tmp/busybody_jsonld_ticket.md`
- H1 cleanup: `tmp/busybody_h1_cleanup_ticket.md`
