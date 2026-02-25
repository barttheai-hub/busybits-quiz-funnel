# Topic: CalorieAPI / Food API

## Property
- https://www.calorieapi.com

## Core issue (ranking + conversion)
- Domain inconsistency across canonical + robots + sitemap + on-page curl examples.
  - robots.txt sitemap points to `foodapi.com`
  - sitemap.xml uses `foodapi.com` URLs
  - on-page copy uses `api.foodapi.com`

## Fix
- Choose ONE canonical domain (calorieapi.com or foodapi.com) and align:
  - `<link rel="canonical">`
  - robots.txt `Sitemap:`
  - sitemap.xml `<loc>`
  - on-page links + curl examples + API base URL

## Why
- Prevent split link equity / wrong indexing; improves trust + conversion clarity.
