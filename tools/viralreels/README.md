# ViralReels Analyzer CLI

Scrape and analyze viral TikTok/Instagram Reels content. Token-free, rule-based scoring.

## Installation

```bash
# Clone/navigate to the tool directory
cd tools/viralreels

# Install dependencies
pip install -r requirements.txt

# Make executable
chmod +x viralreels

# Optional: Add to PATH
ln -s $(pwd)/viralreels /usr/local/bin/viralreels
```

## Usage

```bash
# Analyze fitness content on TikTok
./viralreels --niche "fitness" --platform tiktok --analyze hooks --top 50

# Full analysis of hair loss content
./viralreels --niche "hair loss" --platform instagram --analyze all --top 100

# Focus on conversion analysis
./viralreels --niche "productivity" --platform both --analyze conversions --output report.json

# Markdown output
./viralreels --niche "skincare" --platform tiktok --format md --top 30
```

## Command Options

| Option | Description |
|--------|-------------|
| `--niche, -n` | Topic to search (required) |
| `--platform, -p` | tiktok, instagram, or both |
| `--analyze, -a` | hooks, visuals, ideas, format, conversions, or all |
| `--top, -t` | Number of videos to analyze (default: 50) |
| `--output, -o` | Output file path |
| `--format, -f` | json or md output format |
| `--config, -c` | Custom config.yaml path |

## Analysis Modes

### Hooks
Detects caption patterns that drive engagement:
- Questions ("What if...", "Why does...")
- Number lists ("5 ways to...", "3 tips for...")
- Story hooks ("POV:", "Story time")
- Controversy ("Unpopular opinion...")
- Tutorials ("How to...")

### Format
Analyzes video characteristics:
- Duration categorization (short/medium/long)
- Optimal length detection (15-30s typically performs best)
- Format recommendations

### Conversions
Identifies monetization signals:
- Shop links and bio links
- Product mentions
- Price mentions
- Discount codes
- Urgency language

### Ideas
Extracts content structure:
- Main topics from hashtags
- Content type classification (educational, lifestyle, review, etc.)
- Hashtag strategy analysis

### Visuals
Detects visual patterns (text-based heuristics):
- Text overlays
- Close-up shots
- Transformation content
- Process videos
- Reaction formats

## Output

Results are saved to `output/` directory with auto-generated filenames:
- JSON format: `viralreels_{niche}_{timestamp}.json`
- Markdown format: `viralreels_{niche}_{timestamp}.md`

## Scoring System

Each video receives a **Virality Score** (0-100) based on:
- Engagement rate (2x weight)
- Hook effectiveness (5x weight)
- Format optimization (5x weight)
- Conversion signals (3x weight)
- Content ideas (2x weight)
- Visual elements (3x weight)

## Docker Usage

```bash
# Build image
docker build -t viralreels .

# Run analysis
docker run -v $(pwd)/output:/app/output viralreels --niche fitness --top 20
```

## Configuration

Create `config.yaml` to customize behavior:

```yaml
platforms:
  tiktok:
    enabled: true
    max_results: 50
  instagram:
    enabled: true
    max_results: 50

analysis:
  hooks: true
  visuals: true
  ideas: true
  format: true
  conversions: true

output:
  format: json
  directory: ./output
```

## Rate Limiting & Ethics

- Respect platform rate limits
- Use responsibly for research purposes
- Comply with platform ToS
- Consider using with VPN for repeated scraping

## Dependencies

- yt-dlp (TikTok scraping)
- instaloader (Instagram scraping)
- pyyaml (configuration)

## License

MIT
