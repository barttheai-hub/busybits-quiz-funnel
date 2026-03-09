# Lessons Learned

## 2026-03-01: AdIntel Dashboard - CLI Tool Architecture
- **Pattern:** Build CLI tools as modular components (scraper.py, database.py, analyzer.py, web.py) + thin CLI wrapper (adintel).
- **Why:** Enables testing individual components without the full stack. Demo mode (mock data) allows development without API keys/rate limits.
- **Decision:** SQLite for local storage (zero config), Python's built-in HTTPServer for web UI (no external deps), JSON/MD output for interoperability.

## 2026-02-26: BusyBody App - Lazy Registration Flow
- **Pattern:** "Give before you ask." Delaying account creation (email/password) until *after* the first core value action (logging a meal) significantly reduces friction.
- **Why:** Users have already invested cognitive effort ("Sunken Cost" / "Loss Aversion") and feel ownership of the data (the logged meal), making them more likely to convert to save it.
- **Metric:** Prioritize "Activation Rate" (Install -> First Action) over purely "Signups" initially, as activated users are higher quality LTV.
