"""
Web dashboard for browsing and filtering ads
"""

import json
import sqlite3
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse
from pathlib import Path

# Simple HTML template for the dashboard
DASHBOARD_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>AdIntel Dashboard</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0f0f0f;
            color: #e0e0e0;
            line-height: 1.6;
        }
        .header {
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            padding: 2rem;
            border-bottom: 1px solid #2a2a4a;
        }
        .header h1 {
            font-size: 1.8rem;
            background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .stats {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
            gap: 1rem;
            margin-top: 1rem;
        }
        .stat-card {
            background: rgba(255,255,255,0.05);
            padding: 1rem;
            border-radius: 8px;
            border: 1px solid rgba(255,255,255,0.1);
        }
        .stat-value {
            font-size: 1.5rem;
            font-weight: bold;
            color: #667eea;
        }
        .stat-label {
            font-size: 0.85rem;
            color: #888;
        }
        .container {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .filters {
            background: #1a1a1a;
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
            display: flex;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .filter-group {
            flex: 1;
            min-width: 200px;
        }
        .filter-group label {
            display: block;
            margin-bottom: 0.5rem;
            color: #888;
            font-size: 0.9rem;
        }
        input, select {
            width: 100%;
            padding: 0.75rem;
            background: #0f0f0f;
            border: 1px solid #333;
            border-radius: 6px;
            color: #e0e0e0;
            font-size: 0.95rem;
        }
        button {
            padding: 0.75rem 1.5rem;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border: none;
            border-radius: 6px;
            color: white;
            font-weight: 500;
            cursor: pointer;
            align-self: flex-end;
        }
        button:hover {
            opacity: 0.9;
        }
        .ads-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        .ad-card {
            background: #1a1a1a;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #2a2a2a;
            transition: transform 0.2s, border-color 0.2s;
        }
        .ad-card:hover {
            transform: translateY(-2px);
            border-color: #667eea;
        }
        .ad-header {
            padding: 1rem;
            border-bottom: 1px solid #2a2a2a;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .ad-platform {
            background: rgba(102, 126, 234, 0.2);
            color: #667eea;
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.75rem;
            font-weight: 500;
        }
        .ad-date {
            color: #666;
            font-size: 0.85rem;
        }
        .ad-content {
            padding: 1rem;
        }
        .ad-page {
            font-weight: 600;
            color: #fff;
            margin-bottom: 0.5rem;
        }
        .ad-title {
            color: #667eea;
            font-size: 0.95rem;
            margin-bottom: 0.75rem;
        }
        .ad-body {
            color: #aaa;
            font-size: 0.9rem;
            line-height: 1.5;
            max-height: 150px;
            overflow: hidden;
        }
        .ad-footer {
            padding: 1rem;
            border-top: 1px solid #2a2a2a;
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
        }
        .ad-status {
            color: #4caf50;
        }
        .ad-status.inactive {
            color: #888;
        }
        .patterns-section {
            background: #1a1a1a;
            padding: 1.5rem;
            border-radius: 12px;
            margin-top: 2rem;
        }
        .patterns-section h2 {
            margin-bottom: 1rem;
            color: #fff;
        }
        .pattern-tag {
            display: inline-block;
            background: rgba(102, 126, 234, 0.1);
            border: 1px solid rgba(102, 126, 234, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 20px;
            margin: 0.25rem;
            font-size: 0.85rem;
        }
        .pattern-tag .count {
            color: #667eea;
            font-weight: 600;
        }
        .empty-state {
            text-align: center;
            padding: 4rem 2rem;
            color: #666;
        }
        .empty-state h3 {
            color: #888;
            margin-bottom: 0.5rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 AdIntel Dashboard</h1>
        <div class="stats" id="stats">
            <!-- Stats loaded dynamically -->
        </div>
    </div>
    
    <div class="container">
        <div class="filters">
            <div class="filter-group">
                <label>Search</label>
                <input type="text" id="search" placeholder="Keyword, advertiser, or phrase...">
            </div>
            <div class="filter-group">
                <label>Platform</label>
                <select id="platform">
                    <option value="">All Platforms</option>
                    <option value="meta">Meta (FB/IG)</option>
                    <option value="tiktok">TikTok</option>
                </select>
            </div>
            <div class="filter-group">
                <label>Niche</label>
                <input type="text" id="niche" placeholder="e.g., hair loss, fitness">
            </div>
            <button onclick="loadAds()">Filter</button>
        </div>
        
        <div class="ads-grid" id="ads">
            <!-- Ads loaded dynamically -->
        </div>
        
        <div class="patterns-section">
            <h2>📊 Detected Patterns</h2>
            <div id="patterns">
                <p style="color: #666;">Run analysis to see patterns</p>
            </div>
        </div>
    </div>
    
    <script>
        // Load stats on page load
        async function loadStats() {
            const res = await fetch('/api/stats');
            const stats = await res.json();
            
            document.getElementById('stats').innerHTML = `
                <div class="stat-card">
                    <div class="stat-value">${stats.total_ads.toLocaleString()}</div>
                    <div class="stat-label">Total Ads</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${stats.last_7_days.toLocaleString()}</div>
                    <div class="stat-label">New (7 days)</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Object.keys(stats.by_platform).length}</div>
                    <div class="stat-label">Platforms</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value">${Object.keys(stats.by_niche).length}</div>
                    <div class="stat-label">Niches</div>
                </div>
            `;
        }
        
        // Load ads
        async function loadAds() {
            const search = document.getElementById('search').value;
            const platform = document.getElementById('platform').value;
            const niche = document.getElementById('niche').value;
            
            const params = new URLSearchParams();
            if (search) params.append('search', search);
            if (platform) params.append('platform', platform);
            if (niche) params.append('niche', niche);
            
            const res = await fetch('/api/ads?' + params.toString());
            const ads = await res.json();
            
            const container = document.getElementById('ads');
            
            if (ads.length === 0) {
                container.innerHTML = `
                    <div class="empty-state" style="grid-column: 1 / -1;">
                        <h3>No ads found</h3>
                        <p>Try adjusting your filters or run a scrape first</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = ads.map(ad => `
                <div class="ad-card">
                    <div class="ad-header">
                        <span class="ad-platform">${ad.platform.toUpperCase()}</span>
                        <span class="ad-date">${ad.ad_delivery_start_time || 'Unknown date'}</span>
                    </div>
                    <div class="ad-content">
                        <div class="ad-page">${ad.page_name || 'Unknown'}</div>
                        <div class="ad-title">${ad.ad_creative_link_title || ''}</div>
                        <div class="ad-body">${ad.ad_creative_body || ''}</div>
                    </div>
                    <div class="ad-footer">
                        <span class="ad-status ${ad.status === 'ACTIVE' ? '' : 'inactive'}">
                            ${ad.status || 'Unknown'}
                        </span>
                        <span>${ad.niche || ''}</span>
                    </div>
                </div>
            `).join('');
        }
        
        // Initialize
        loadStats();
        loadAds();
    </script>
</body>
</html>
"""

class DashboardHandler(BaseHTTPRequestHandler):
    """HTTP request handler for the dashboard"""
    
    db_path = "adintel.db"
    
    def log_message(self, format, *args):
        # Suppress default logging
        pass
    
    def do_GET(self):
        parsed = urlparse(self.path)
        path = parsed.path
        query = parse_qs(parsed.query)
        
        if path == "/":
            self.send_html(DASHBOARD_HTML)
        elif path == "/api/stats":
            self.send_json(self.get_stats())
        elif path == "/api/ads":
            self.send_json(self.get_ads(query))
        else:
            self.send_error(404)
    
    def send_html(self, content):
        self.send_response(200)
        self.send_header("Content-Type", "text/html")
        self.send_header("Content-Length", str(len(content.encode())))
        self.end_headers()
        self.wfile.write(content.encode())
    
    def send_json(self, data):
        content = json.dumps(data, default=str)
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(content.encode())))
        self.end_headers()
        self.wfile.write(content.encode())
    
    def get_stats(self):
        """Get database statistics"""
        from database import AdDatabase
        db = AdDatabase(self.db_path)
        return db.get_ad_stats()
    
    def get_ads(self, query):
        """Get ads with filtering"""
        from database import AdDatabase
        db = AdDatabase(self.db_path)
        
        filters = {}
        if query.get("platform"):
            filters["platform"] = query["platform"][0]
        if query.get("niche"):
            filters["niche"] = query["niche"][0]
        
        if query.get("search"):
            return db.search_ads(query["search"][0], limit=50)
        
        return db.get_ads(filters, limit=50)

def run_dashboard(host: str = "127.0.0.1", port: int = 8080, db_path: str = "adintel.db"):
    """Run the web dashboard"""
    DashboardHandler.db_path = db_path
    
    server = HTTPServer((host, port), DashboardHandler)
    print(f"🌐 Dashboard running at http://{host}:{port}")
    print("Press Ctrl+C to stop")
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped")
        server.shutdown()

if __name__ == "__main__":
    run_dashboard()
