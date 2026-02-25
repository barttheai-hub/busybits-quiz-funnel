# busybody.io — add minimal structured data (JSON-LD)

## Problem
busybody.io appears to have no structured data. This misses rich-result eligibility and weakens entity clarity.

## Acceptance criteria
- Homepage includes valid JSON-LD for:
  1) Organization
  2) WebSite (optionally SearchAction if there’s a site search)
  3) SoftwareApplication or Product (pick whichever matches positioning)
- Optional: FAQPage schema on top 1–2 landing pages with real FAQs.
- Google Rich Results Test shows no critical errors.

## Implementation checklist
- Add a JSON-LD block in the global layout/head for Organization + WebSite.
- Add per-page JSON-LD for Product/SoftwareApplication on key landing pages.
- Ensure:
  - `url`, `name`, `logo`, `sameAs` (if relevant)
  - app category (e.g., Health & Fitness)
  - `offers` if pricing exists

## Example (skeleton)
```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Busybody",
  "url": "https://busybody.io",
  "logo": "https://busybody.io/<logo-path>"
}
```

## Verification
- Run Rich Results Test on homepage.
- Ensure the JSON-LD matches brand + canonical domain.
