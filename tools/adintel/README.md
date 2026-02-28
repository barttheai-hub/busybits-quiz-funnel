# AdIntel - Competitor Ad Intelligence Dashboard

Track competitor ads across Meta (Facebook/Instagram) and TikTok to surface winning patterns.

## Quick Start

```bash
# Install dependencies
pip3 install -r requirements.txt
playwright install chromium

# Scrape ads (demo mode - no API needed)
python3 adintel scrape --platform meta --search "hair loss" --demo

# Scrape with live data (requires Meta Graph API token)
export META_AD_TOKEN="your_token_here"
python3 adintel scrape --platform meta --search "keeps" --limit 50

# Analyze patterns
python3 adintel analyze --pattern hooks
python3 adintel analyze --pattern ctas
python3 adintel analyze --pattern all

# Start web dashboard
python3 adintel serve --port 8080
```

## Commands

### scrape
Scrape ads from Meta Ad Library or TikTok.

```bash
python3 adintel scrape --platform meta --search "keyword" --days 30 --limit 100
```

Options:
- `--platform`: meta, tiktok, or all
- `--search`: Keyword or advertiser name
- `--days`: Lookback period (default: 30)
- `--limit`: Max ads to fetch (default: 100)
- `--country`: Country code (default: US)
- `--output`: json, md, or sqlite (default: sqlite)
- `--demo`: Use demo data for testing

### analyze
Analyze stored ads for patterns.

```bash
python3 adintel analyze --pattern hooks --niche "hair_loss"
```

Options:
- `--pattern`: hooks, ctas, visuals, or all
- `--niche`: Filter by niche/category
- `--min-views`: Minimum view threshold
- `--output`: json or md (default: md)

### serve
Start the web dashboard.

```bash
python3 adintel serve --host 127.0.0.1 --port 8080
```

### watch
Watch for new ads from specific advertisers.

```bash
python3 adintel watch --advertiser "Keeps" --interval 3600
```

## Getting a Meta Graph API Token

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create an app (Business type)
3. Add the Marketing API product
4. Generate an access token with `ads_read` permission
5. Export it: `export META_AD_TOKEN="your_token"`

## Configuration

Edit `config.yaml` to set default search terms and watch lists.

## Docker

```bash
docker build -t adintel .
docker run -p 8080:8080 adintel
```

## Project Structure

```
tools/adintel/
├── adintel          # CLI entry point
├── scraper.py       # Meta/TikTok scrapers
├── database.py      # SQLite storage
├── analyzer.py      # Pattern analysis
├── web.py           # Dashboard server
├── config.yaml      # Default settings
├── requirements.txt # Python deps
└── Dockerfile       # Container config
```

## Features

- ✅ CLI tool with 4 commands (scrape, analyze, serve, watch)
- ✅ Meta Ad Library scraping (Graph API + browser fallback)
- ✅ TikTok Creative Center scraping
- ✅ SQLite storage for ad data
- ✅ Pattern analysis (hooks, CTAs, visual styles)
- ✅ Web dashboard (localhost:8080)
- ✅ Change detection for competitor monitoring
- ✅ Dockerized deployment
- ✅ Demo mode for testing

## TODO

- [ ] Full browser automation with Playwright
- [ ] TikTok authentication for private data
- [ ] YouTube ad scraping
- [ ] Email/Slack alerts for new ads
- [ ] Scheduled scraping via cron
