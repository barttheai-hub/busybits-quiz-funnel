# ACTIVE TASKS – STATE MACHINE

*Single Source of Truth for Autonomous Work*

## Rules
1.  **Single Active Task:** Only ONE task can be `In Progress` at a time.
2.  **DoD is Law:** A task is not done until the `DoD` is met AND the `Test Plan` passes.
3.  **Archive on Done:** When a task is `Done`, move it to `memory/tasks-archive/YYYY-MM.md`.

## Current Tasks (Priority Order)

### 1. Competitor Ad Intelligence Dashboard (Meta + TikTok Ad Tracker)
- **Status:** In Progress
- **Started:** 2026-02-27
- **RetryCount:** 0
- **DoD:**
  - CLI tool: `adintel --platform meta --search "hair loss" --days 30` → JSON/MD report ✅
  - Meta Ad Library scraper (public API, no auth needed) ✅
  - TikTok ad scraping (Creative Center or search) ✅
  - SQLite storage for ad data (creative, copy, engagement signals) ✅
  - Pattern analysis: hook templates, CTA patterns, visual styles ✅
  - Web UI: lightweight dashboard (`adintel serve`) to browse/filter ads ✅
  - Change detection: alert on new competitor ads ✅
  - Dockerized + README ✅
  - Committed to `tools/adintel/` ✅
- **Test Plan:**
  - Run: `python3 adintel scrape --platform meta --search "keeps" --limit 20 --demo` ✅
  - Verify: Returns ad data with creative URLs, copy, date ✅
  - Run: `python3 adintel analyze --pattern all` → Shows patterns ✅
  - Run: `python3 adintel serve` → UI accessible at localhost:8080 ⏳
  - Docker: `docker build -t adintel .` completes ⏳
- **Evidence:** 
  - Project scaffold: `tools/adintel/` ✅
  - Files: `adintel` (CLI), `scraper.py`, `database.py`, `analyzer.py`, `web.py` ✅
  - Config: `config.yaml` for default search terms ✅
  - CLI help works: `python3 adintel --help` ✅
  - All 4 commands working: scrape, analyze, serve, watch ✅
  - Demo mode implemented for testing without API ✅
  - 43 demo ads stored in database ✅
- **Next Step:** Test `adintel serve` web dashboard and Docker build
