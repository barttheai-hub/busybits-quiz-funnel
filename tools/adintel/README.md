# AdIntel - Competitor Ad Intelligence Dashboard

Track competitor ads across Meta and TikTok. Surface winning patterns. Stay ahead.

## Features

- 🔍 **Multi-Platform Scraping**: Meta Ad Library + TikTok Creative Center
- 📊 **Pattern Analysis**: Detect hooks, CTAs, and visual styles that work
- 🌐 **Web Dashboard**: Browse and filter ads in a clean UI
- 🔔 **Change Detection**: Watch competitors and get alerted to new ads
- 💾 **SQLite Storage**: Local-first, queryable database
- 🐳 **Dockerized**: Run anywhere

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Scrape Meta ads for a keyword
python3 adintel scrape --platform meta --search "hair loss" --days 30 --limit 100

# Scrape TikTok ads
python3 adintel scrape --platform tiktok --search "fitness" --limit 50

# Analyze patterns
python3 adintel analyze --pattern hooks --niche "hair_loss"

# Start web dashboard
python3 adintel serve --port 8080
```

## Commands

### scrape
```bash
adintel scrape --platform meta --search "keyword" --days 30 --limit 100 --country US
```

Options:
- `--platform`: meta, tiktok, or all
- `--search`: Keyword or advertiser name
- `--days`: Lookback period (default: 30)
- `--limit`: Max ads to fetch (default: 100)
- `--country`: Country code (default: US)
- `--output`: json, md, or sqlite (default: sqlite)

### analyze
```bash
adintel analyze --pattern hooks --niche "hair_loss" --output md
```

Pattern types:
- `hooks`: Opening phrases and attention grabbers
- `ctas`: Call-to-action patterns
- `visuals`: Visual style indicators
- `all`: Run all analyses

### serve
```bash
adintel serve --host 127.0.0.1 --port 8080
```

Starts a web dashboard at `http://localhost:8080`

### watch
```bash
adintel watch --advertiser "Keeps" --interval 3600
```

Monitors an advertiser for new ads.

## Docker

```bash
docker build -t adintel .

# Scrape
docker run -v $(pwd):/app adintel scrape --platform meta --search "hair loss"

# Serve dashboard
docker run -p 8080:8080 -v $(pwd):/app adintel serve --host 0.0.0.0
```

## Database Schema

**ads table:**
- `ad_id`: Primary key
- `platform`: meta, tiktok, etc.
- `niche`: Category/tag
- `page_name`: Advertiser name
- `ad_creative_body`: Ad copy
- `ad_creative_link_title`: Headline
- `ad_delivery_start_time`: First seen
- `status`: ACTIVE/INACTIVE
- `engagement`: JSON (likes, shares, comments)
- `ctr`: Click-through rate (if available)

**patterns table:**
- Detected hooks, CTAs, visual styles
- Frequency tracking
- Engagement scores

## Configuration

Edit `config.yaml` to set:
- Default search presets
- Watch list
- Analysis thresholds

## Use Cases

1. **Creative Research**: See what's working in your niche
2. **Competitor Monitoring**: Track specific advertisers
3. **Hook Inspiration**: Discover high-performing opening lines
4. **Trend Detection**: Spot emerging patterns early
5. **CRO Insights**: Analyze CTAs and urgency triggers

## Notes

- Meta Ad Library: Uses public API (no auth required for basic search)
- TikTok: Uses Creative Center API
- For heavy scraping, consider API rate limits
- Data is stored locally in SQLite (`adintel.db`)

## License

MIT
