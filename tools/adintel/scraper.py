"""
Scraper modules for Meta Ad Library and TikTok
Uses Playwright for browser automation to extract public ad data
"""

import requests
import json
import re
import subprocess
import tempfile
import os
from datetime import datetime, timedelta
from urllib.parse import quote, urlencode
from typing import List, Dict, Any, Optional

class MetaAdLibraryScraper:
    """Scraper for Meta Ad Library (Facebook/Instagram ads)"""
    
    GRAPH_API_URL = "https://graph.facebook.com/v18.0"
    AD_LIBRARY_URL = "https://www.facebook.com/ads/library"
    
    def __init__(self, access_token: Optional[str] = None, use_browser: bool = True):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
            "Accept-Encoding": "gzip, deflate, br",
            "DNT": "1",
            "Connection": "keep-alive",
        })
        self.access_token = access_token
        self.use_browser = use_browser
        self._dtsg_token = None
        self._session_cookies = None
    
    def search(self, query: str, days_back: int = 30, limit: int = 100, 
               country: str = "US", demo: bool = False) -> List[Dict[str, Any]]:
        """
        Search Meta Ad Library by keyword
        
        Args:
            query: Search term or advertiser name
            days_back: Days to look back
            limit: Max ads to fetch
            country: Country code
            demo: If True, return demo data (for testing)
        """
        ads = []
        
        # Return demo data if requested (for testing without API)
        if demo:
            return self.generate_demo_data(query, min(limit, 20))
        
        try:
            # Try official Graph API if token available
            if self.access_token:
                ads = self._search_graph_api(query, days_back, limit, country)
            elif self.use_browser:
                # Use browser automation for reliable extraction
                ads = self._scrape_with_browser(query, days_back, limit, country)
            else:
                # Fallback to requests-based scraping
                ads = self._scrape_public_library(query, days_back, limit, country)
            
            # If no results, offer demo mode
            if not ads:
                print(f"  Note: No live data retrieved. Use --demo flag for sample data.")
            
        except Exception as e:
            print(f"  Warning: Meta scrape error - {e}")
        
        return ads
    
    def _scrape_with_browser(self, query: str, days_back: int, limit: int,
                              country: str) -> List[Dict[str, Any]]:
        """
        Scrape Meta Ad Library using Playwright browser automation
        """
        ads = []
        
        try:
            # Build the search URL
            search_params = {
                'active_status': 'active',
                'ad_type': 'all',
                'country': country,
                'q': query,
            }
            search_url = f"{self.AD_LIBRARY_URL}?{urlencode(search_params)}"
            
            # Create a Python script for Playwright to execute
            script_content = f'''
import asyncio
from playwright.async_api import async_playwright
import json
import re

async def scrape_ads():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={{'width': 1920, 'height': 1080}},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        page = await context.new_page()
        
        # Navigate to ad library
        await page.goto("{search_url}", wait_until="networkidle")
        
        # Wait for ad results to load
        await page.wait_for_timeout(5000)
        
        # Scroll to load more ads
        for _ in range(3):
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(2000)
        
        # Extract ad data from page
        ads_data = await page.evaluate("""
            () => {{
                const ads = [];
                const adCards = document.querySelectorAll('[data-testid="ad_library_ad"]');
                
                adCards.forEach(card => {{
                    const ad = {{}};
                    
                    // Page/Advertiser name
                    const pageNameEl = card.querySelector('a[href*="facebook.com/"] h2, a[href*="facebook.com/"] span');
                    ad.page_name = pageNameEl ? pageNameEl.textContent.trim() : '';
                    
                    // Ad body/copy
                    const bodyEl = card.querySelector('[data-testid="ad_text"] span, [data-testid="ad_text"] div, div[data-ad-comet-preview="true"] span');
                    ad.ad_creative_body = bodyEl ? bodyEl.textContent.trim() : '';
                    
                    // Ad title
                    const titleEl = card.querySelector('a[role="link"] span');
                    ad.ad_creative_link_title = titleEl ? titleEl.textContent.trim() : '';
                    
                    // CTA button
                    const ctaEl = card.querySelector('div[role="button"] span, button span');
                    ad.call_to_action = ctaEl ? ctaEl.textContent.trim() : '';
                    
                    // Start date
                    const dateEl = card.querySelector('span');
                    ad.ad_delivery_start_time = dateEl ? dateEl.textContent.trim() : '';
                    
                    // Status
                    ad.status = 'ACTIVE';
                    
                    ads.push(ad);
                }});
                
                return ads;
            }}
        """)
        
        # Also try to get raw page content for additional parsing
        page_content = await page.content()
        
        await browser.close()
        
        # Output results as JSON
        result = {{
            "ads": ads_data,
            "html_sample": page_content[:5000]  # First 5k chars for debugging
        }}
        print(json.dumps(result))

asyncio.run(scrape_ads())
'''
            
            # Write script to temp file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
                f.write(script_content)
                script_path = f.name
            
            # Run the Playwright script
            result = subprocess.run(
                ['python3', script_path],
                capture_output=True,
                text=True,
                timeout=60
            )
            
            # Clean up temp file
            os.unlink(script_path)
            
            if result.returncode == 0 and result.stdout:
                try:
                    data = json.loads(result.stdout.strip().split('\n')[-1])
                    raw_ads = data.get('ads', [])
                    
                    for i, raw_ad in enumerate(raw_ads[:limit]):
                        ad = self._normalize_ad_data({
                            'id': f"meta_{{query.replace(' ', '_')}}_{{i}}",
                            'page_name': raw_ad.get('page_name'),
                            'ad_creative_body': raw_ad.get('ad_creative_body'),
                            'ad_creative_link_title': raw_ad.get('ad_creative_link_title'),
                            'call_to_action': raw_ad.get('call_to_action'),
                            'ad_delivery_start_time': raw_ad.get('ad_delivery_start_time'),
                            'status': raw_ad.get('status', 'ACTIVE'),
                        }, query, country)
                        
                        if ad and ad.get('ad_creative_body'):
                            ads.append(ad)
                    
                except json.JSONDecodeError:
                    pass
            
        except Exception as e:
            print(f"    Browser scrape failed: {{e}}")
        
        return ads
    
    def search_by_advertiser(self, advertiser: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Search ads by advertiser/page name"""
        return self.search(advertiser, days_back=365, limit=limit)
    
    def _get_session_tokens(self) -> bool:
        """Extract dtsg token and cookies from public ad library page"""
        try:
            # Visit the ad library to get session tokens
            response = self.session.get(
                "https://www.facebook.com/ads/library",
                timeout=30
            )
            
            if response.status_code == 200:
                # Extract dtsg token
                dtsg_match = re.search(r'"DTSGInitialData",\[\],{"token":"([^"]+)"}', response.text)
                if dtsg_match:
                    self._dtsg_token = dtsg_match.group(1)
                
                # Alternative pattern
                if not self._dtsg_token:
                    dtsg_match = re.search(r'"token":"([^"]+)"', response.text)
                    if dtsg_match:
                        self._dtsg_token = dtsg_match.group(1)
                
                self._session_cookies = response.cookies
                return True
            
            return False
        except Exception as e:
            print(f"    Session init failed: {e}")
            return False
    
    def _scrape_public_library(self, query: str, days_back: int, limit: int, 
                               country: str) -> List[Dict[str, Any]]:
        """
        Scrape Meta Ad Library using public web interface
        Uses the public Graph API endpoint that doesn't require authentication
        """
        ads = []
        
        try:
            # Meta Ad Library has a public API endpoint
            # This uses the same endpoint the web UI uses
            
            url = "https://www.facebook.com/ads/library/api/search"
            
            params = {
                'query': query,
                'active_status': 'active',
                'ad_type': 'all',
                'country': country,
                'limit': min(limit, 100),
            }
            
            headers = {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
            }
            
            response = self.session.get(url, params=params, headers=headers, timeout=30)
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    for item in data.get('results', []):
                        ad = self._normalize_ad_data(item, query, country)
                        if ad:
                            ads.append(ad)
                except:
                    pass
            
            # Also try alternative endpoint
            if not ads:
                ads = self._scrape_via_html(query, days_back, limit, country)
                
        except Exception as e:
            print(f"    Public library scrape failed: {e}")
        
        return ads[:limit]
    
    def _scrape_via_html(self, query: str, days_back: int, limit: int,
                         country: str) -> List[Dict[str, Any]]:
        """Fallback: Parse ad data from HTML"""
        ads = []
        
        try:
            search_params = {
                'active_status': 'active',
                'ad_type': 'all',
                'country': country,
                'q': query,
            }
            
            search_url = f"{self.AD_LIBRARY_URL}?{urlencode(search_params)}"
            
            response = self.session.get(search_url, timeout=30)
            
            if response.status_code == 200:
                html = response.text
                
                # Look for JSON data in the page
                # Meta embeds data in various script tags
                patterns = [
                    r'"adLibrary\w*?":(\{.*?\})',
                    r'window\._\w+?\s*=\s*(\{.*?\});',
                ]
                
                for pattern in patterns:
                    matches = re.findall(pattern, html, re.DOTALL)
                    for match in matches[:3]:
                        try:
                            data = json.loads(match)
                            if isinstance(data, dict):
                                ad_list = data.get('ads') or data.get('ad_archives') or data.get('data', [])
                                if isinstance(ad_list, list):
                                    for item in ad_list:
                                        ad = self._normalize_ad_data(item, query, country)
                                        if ad:
                                            ads.append(ad)
                        except:
                            continue
                
                # If still no ads, generate sample/demo data for testing
                if not ads and limit > 0:
                    # For development/testing, return mock data structure
                    # This helps validate the pipeline works
                    pass
                        
        except Exception as e:
            print(f"    HTML scrape failed: {e}")
        
        return ads[:limit]
    
    def _parse_ads_from_html(self, html: str, query: str, country: str) -> List[Dict[str, Any]]:
        """Extract ad data from HTML response"""
        ads = []
        
        try:
            # Look for JSON data embedded in the page
            # Meta stores ad data in various script tags
            patterns = [
                r'"adLibrary\w*?":(\{.*?\})',
                r'"ads":(\[.*?\])',
                r'"ad_archives":(\[.*?\])',
            ]
            
            for pattern in patterns:
                matches = re.findall(pattern, html, re.DOTALL)
                for match in matches:
                    try:
                        data = json.loads(match)
                        if isinstance(data, list):
                            for item in data:
                                ad = self._normalize_ad_data(item, query, country)
                                if ad:
                                    ads.append(ad)
                        elif isinstance(data, dict) and 'ads' in data:
                            for item in data['ads']:
                                ad = self._normalize_ad_data(item, query, country)
                                if ad:
                                    ads.append(ad)
                    except json.JSONDecodeError:
                        continue
            
            # If no JSON data found, return empty list (fallback)
            # In production, would use more robust parsing
            
        except Exception as e:
            print(f"    Parse error: {e}")
        
        return ads
    
    def _normalize_ad_data(self, raw_ad: Dict, query: str, country: str) -> Optional[Dict[str, Any]]:
        """Normalize raw ad data to standard format"""
        try:
            ad = {
                "ad_id": raw_ad.get("ad_archive_id") or raw_ad.get("id") or raw_ad.get("ad_id"),
                "platform": "meta",
                "niche": query,
                "page_name": raw_ad.get("page_name") or raw_ad.get("advertiser_name"),
                "ad_creative_body": raw_ad.get("ad_creative_body") or raw_ad.get("body") or raw_ad.get("creative", {}).get("body"),
                "ad_creative_link_title": raw_ad.get("ad_creative_link_title") or raw_ad.get("title"),
                "ad_creative_link_description": raw_ad.get("ad_creative_link_description") or raw_ad.get("description"),
                "ad_delivery_start_time": raw_ad.get("ad_delivery_start_time") or raw_ad.get("start_date"),
                "ad_delivery_stop_time": raw_ad.get("ad_delivery_stop_time") or raw_ad.get("end_date"),
                "status": raw_ad.get("status") or "ACTIVE",
                "call_to_action": raw_ad.get("call_to_action") or raw_ad.get("cta"),
                "creative_url": raw_ad.get("ad_snapshot_url") or raw_ad.get("snapshot_url"),
                "video_url": raw_ad.get("video_url"),
                "cover_url": raw_ad.get("thumbnail_url") or raw_ad.get("image_url"),
                "engagement": {
                    "likes": raw_ad.get("likes", 0),
                    "shares": raw_ad.get("shares", 0),
                    "comments": raw_ad.get("comments", 0),
                },
                "targeting": raw_ad.get("targeting"),
                "spend": raw_ad.get("spend"),
                "impressions": raw_ad.get("impressions"),
                "ctr": raw_ad.get("ctr"),
            }
            
            # Ensure we have at least an ad_id
            if not ad["ad_id"]:
                return None
            
            return ad
            
        except Exception as e:
            return None
    
    def generate_demo_data(self, query: str, count: int = 10) -> List[Dict[str, Any]]:
        """Generate demo data for testing when scraping fails"""
        import hashlib
        from datetime import datetime, timedelta
        
        demo_ads = []
        
        sample_advertisers = {
            "hair loss": ["Keeps", "Hims", "Roman", "Nutrafol", "Viviscal"],
            "keeps": ["Keeps", "Hims", "Roman"],
            "hims": ["Hims", "Keeps"],
            "fitness": ["Peloton", "Nike Training", "MyFitnessPal", "Noom"],
            "supplement": ["Onnit", "Thorne", "Ritual", "Care/of"],
        }
        
        sample_hooks = [
            "Stop losing hair. Start seeing results in 3 months.",
            "The #1 hair loss treatment men are switching to in 2025",
            "Doctors hate this hair growth secret",
            "I reversed my hair loss in 6 months. Here's how.",
            "The truth about minoxidil they don't tell you",
            "Finally, a hair loss treatment that actually works",
            "Before & After: 90 days of transformation",
        ]
        
        sample_ctas = ["Shop Now", "Get Started", "Claim Offer", "See Results", "Learn More"]
        
        advertisers = sample_advertisers.get(query.lower(), ["Brand A", "Brand B", "Brand C"])
        
        for i in range(count):
            # Generate consistent ID from query + index
            ad_id = hashlib.md5(f"{query}_{i}".encode()).hexdigest()[:16]
            
            days_ago = (i * 3) % 30
            start_date = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            
            ad = {
                "ad_id": f"demo_{ad_id}",
                "platform": "meta",
                "niche": query,
                "page_name": advertisers[i % len(advertisers)],
                "ad_creative_body": sample_hooks[i % len(sample_hooks)],
                "ad_creative_link_title": f"{query.title()} Solution - Clinically Proven",
                "ad_creative_link_description": "Join 100,000+ men who've transformed their look",
                "ad_delivery_start_time": start_date,
                "ad_delivery_stop_time": None,
                "status": "ACTIVE",
                "call_to_action": sample_ctas[i % len(sample_ctas)],
                "creative_url": f"https://facebook.com/ads/library/?id={ad_id}",
                "video_url": None,
                "cover_url": None,
                "engagement": {
                    "likes": 1000 + (i * 500),
                    "shares": 100 + (i * 50),
                    "comments": 50 + (i * 25),
                },
                "targeting": None,
                "spend": None,
                "impressions": None,
                "ctr": 1.5 + (i * 0.2),
            }
            demo_ads.append(ad)
        
        return demo_ads
    
    def _search_graph_api(self, query: str, days_back: int, limit: int, 
                          country: str) -> List[Dict[str, Any]]:
        """
        Search using official Graph API (requires access token)
        """
        ads = []
        
        try:
            params = {
                'access_token': self.access_token,
                'ad_reached_countries': country,
                'ad_active_status': 'ACTIVE',
                'search_terms': query,
                'fields': 'ad_archive_id,page_name,ad_creative_body,ad_creative_link_title,ad_delivery_start_time,ad_snapshot_url',
                'limit': limit,
            }
            
            response = self.session.get(
                f"{self.GRAPH_API_URL}/ads_archive",
                params=params,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                for item in data.get('data', []):
                    ad = self._normalize_ad_data(item, query, country)
                    if ad:
                        ads.append(ad)
                        
        except Exception as e:
            print(f"    Graph API search failed: {e}")
        
        return ads

class TikTokScraper:
    """Scraper for TikTok ads"""
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
        })
    
    def search(self, query: str, days_back: int = 30, limit: int = 100) -> List[Dict[str, Any]]:
        """
        Search TikTok Creative Center / ads
        """
        ads = []
        
        try:
            # TikTok Creative Center has a public API for top ads
            url = "https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en"
            
            # The actual API endpoint requires authentication
            # Public access is available through the creative center
            
            ads = self._fetch_from_creative_center(query, days_back, limit)
            
        except Exception as e:
            print(f"  Warning: TikTok scrape error - {e}")
        
        return ads
    
    def _fetch_from_creative_center(self, query: str, days_back: int, 
                                     limit: int) -> List[Dict[str, Any]]:
        """Fetch from TikTok Creative Center API"""
        ads = []
        
        try:
            # TikTok Creative Center API
            # Endpoint: https://ads.tiktok.com/creativecenter-api/v1/top_ads
            
            url = "https://ads.tiktok.com/creativecenter-api/v1/top_ads"
            
            params = {
                "period": days_back,
                "keyword": query,
                "limit": limit
            }
            
            response = self.session.get(url, params=params, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                if data.get("data"):
                    for item in data["data"].get("list", []):
                        ad = {
                            "ad_id": item.get("ad_id"),
                            "platform": "tiktok",
                            "page_name": item.get("brand_name"),
                            "ad_creative_body": item.get("caption", ""),
                            "ad_creative_link_title": item.get("title", ""),
                            "ad_delivery_start_time": item.get("create_time"),
                            "status": "ACTIVE",
                            "engagement": {
                                "likes": item.get("like", 0),
                                "shares": item.get("share", 0),
                                "comments": item.get("comment", 0)
                            },
                            "video_url": item.get("video_url"),
                            "cover_url": item.get("cover_url"),
                            "ctr": item.get("ctr"),
                            "conversion_rate": item.get("conversion_rate")
                        }
                        ads.append(ad)
                        
        except Exception as e:
            print(f"    TikTok API fetch failed: {e}")
        
        return ads

class YouTubeScraper:
    """Scraper for YouTube ads (optional extension)"""
    
    def __init__(self):
        self.session = requests.Session()
    
    def search(self, query: str, days_back: int = 30, limit: int = 100) -> List[Dict[str, Any]]:
        """Search YouTube ads (limited public data)"""
        # YouTube doesn't have a public ad library like Meta
        # Would need to use Google Ads API or scrape
        return []
