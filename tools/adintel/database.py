"""
Database module for storing and querying ad data
"""

import sqlite3
import json
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional

class AdDatabase:
    """SQLite database for ad storage and retrieval"""
    
    def __init__(self, db_path: str = "adintel.db"):
        self.db_path = db_path
        self._init_db()
    
    def _init_db(self):
        """Initialize database tables"""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS ads (
                    ad_id TEXT PRIMARY KEY,
                    platform TEXT NOT NULL,
                    niche TEXT,
                    page_name TEXT,
                    ad_creative_body TEXT,
                    ad_creative_link_title TEXT,
                    ad_creative_link_description TEXT,
                    ad_delivery_start_time TEXT,
                    ad_delivery_stop_time TEXT,
                    status TEXT,
                    call_to_action TEXT,
                    creative_url TEXT,
                    video_url TEXT,
                    cover_url TEXT,
                    engagement TEXT,
                    targeting TEXT,
                    spend TEXT,
                    impressions TEXT,
                    ctr REAL,
                    conversion_rate REAL,
                    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS patterns (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    pattern_type TEXT NOT NULL,
                    pattern_text TEXT NOT NULL,
                    niche TEXT,
                    frequency INTEGER DEFAULT 1,
                    engagement_score REAL,
                    first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)
            
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_ads_platform ON ads(platform)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_ads_niche ON ads(niche)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_ads_date ON ads(ad_delivery_start_time)
            """)
            conn.execute("""
                CREATE INDEX IF NOT EXISTS idx_patterns_type ON patterns(pattern_type)
            """)
            
            conn.commit()
    
    def store_ads(self, ads: List[Dict[str, Any]], niche: Optional[str] = None) -> int:
        """Store ads in database, return count of new ads"""
        stored = 0
        
        with sqlite3.connect(self.db_path) as conn:
            for ad in ads:
                ad_id = ad.get("ad_id") or ad.get("id")
                if not ad_id:
                    continue
                
                # Check if ad exists
                cursor = conn.execute("SELECT 1 FROM ads WHERE ad_id = ?", (ad_id,))
                if cursor.fetchone():
                    # Update existing
                    conn.execute("""
                        UPDATE ads SET
                            status = ?,
                            last_updated = CURRENT_TIMESTAMP,
                            engagement = ?
                        WHERE ad_id = ?
                    """, (
                        ad.get("status", "UNKNOWN"),
                        json.dumps(ad.get("engagement", {})),
                        ad_id
                    ))
                else:
                    # Insert new
                    conn.execute("""
                        INSERT INTO ads (
                            ad_id, platform, niche, page_name,
                            ad_creative_body, ad_creative_link_title,
                            ad_creative_link_description, ad_delivery_start_time,
                            ad_delivery_stop_time, status, call_to_action,
                            creative_url, video_url, cover_url, engagement,
                            targeting, spend, impressions, ctr, conversion_rate
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        ad_id,
                        ad.get("platform", "unknown"),
                        niche,
                        ad.get("page_name"),
                        ad.get("ad_creative_body"),
                        ad.get("ad_creative_link_title"),
                        ad.get("ad_creative_link_description"),
                        ad.get("ad_delivery_start_time"),
                        ad.get("ad_delivery_stop_time"),
                        ad.get("status", "UNKNOWN"),
                        ad.get("call_to_action"),
                        ad.get("creative_url"),
                        ad.get("video_url"),
                        ad.get("cover_url"),
                        json.dumps(ad.get("engagement", {})),
                        json.dumps(ad.get("targeting", {})),
                        json.dumps(ad.get("spend", {})),
                        json.dumps(ad.get("impressions", {})),
                        ad.get("ctr"),
                        ad.get("conversion_rate")
                    ))
                    stored += 1
            
            conn.commit()
        
        return stored
    
    def get_ads(self, filters: Optional[Dict[str, Any]] = None, 
                limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieve ads with optional filtering"""
        ads = []
        
        query = "SELECT * FROM ads WHERE 1=1"
        params = []
        
        if filters:
            if "platform" in filters:
                query += " AND platform = ?"
                params.append(filters["platform"])
            if "niche" in filters:
                query += " AND niche = ?"
                params.append(filters["niche"])
            if "status" in filters:
                query += " AND status = ?"
                params.append(filters["status"])
            if "min_date" in filters:
                query += " AND ad_delivery_start_time >= ?"
                params.append(filters["min_date"])
        
        query += " ORDER BY ad_delivery_start_time DESC LIMIT ?"
        params.append(limit)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(query, params)
            
            for row in cursor.fetchall():
                ad = dict(row)
                # Parse JSON fields
                for field in ["engagement", "targeting", "spend", "impressions"]:
                    if ad.get(field):
                        try:
                            ad[field] = json.loads(ad[field])
                        except:
                            pass
                ads.append(ad)
        
        return ads
    
    def get_ad_stats(self) -> Dict[str, Any]:
        """Get database statistics"""
        with sqlite3.connect(self.db_path) as conn:
            total = conn.execute("SELECT COUNT(*) FROM ads").fetchone()[0]
            
            by_platform = {}
            cursor = conn.execute("""
                SELECT platform, COUNT(*) FROM ads GROUP BY platform
            """)
            for row in cursor:
                by_platform[row[0]] = row[1]
            
            by_niche = {}
            cursor = conn.execute("""
                SELECT niche, COUNT(*) FROM ads 
                WHERE niche IS NOT NULL GROUP BY niche
            """)
            for row in cursor:
                by_niche[row[0]] = row[1]
            
            recent = conn.execute("""
                SELECT COUNT(*) FROM ads 
                WHERE date(first_seen) >= date('now', '-7 days')
            """).fetchone()[0]
            
            return {
                "total_ads": total,
                "by_platform": by_platform,
                "by_niche": by_niche,
                "last_7_days": recent
            }
    
    def search_ads(self, search_term: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Search ads by text content"""
        ads = []
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT * FROM ads 
                WHERE ad_creative_body LIKE ? 
                   OR ad_creative_link_title LIKE ?
                   OR page_name LIKE ?
                ORDER BY ad_delivery_start_time DESC
                LIMIT ?
            """, (f"%{search_term}%", f"%{search_term}%", f"%{search_term}%", limit))
            
            for row in cursor.fetchall():
                ad = dict(row)
                if ad.get("engagement"):
                    try:
                        ad["engagement"] = json.loads(ad["engagement"])
                    except:
                        pass
                ads.append(ad)
        
        return ads
    
    def store_pattern(self, pattern_type: str, pattern_text: str, 
                      niche: Optional[str] = None, engagement_score: Optional[float] = None):
        """Store a detected pattern"""
        with sqlite3.connect(self.db_path) as conn:
            # Check if pattern exists
            cursor = conn.execute(
                "SELECT id, frequency FROM patterns WHERE pattern_type = ? AND pattern_text = ?",
                (pattern_type, pattern_text)
            )
            row = cursor.fetchone()
            
            if row:
                # Update
                conn.execute("""
                    UPDATE patterns 
                    SET frequency = frequency + 1, last_seen = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (row[0],))
            else:
                # Insert
                conn.execute("""
                    INSERT INTO patterns (pattern_type, pattern_text, niche, engagement_score)
                    VALUES (?, ?, ?, ?)
                """, (pattern_type, pattern_text, niche, engagement_score))
            
            conn.commit()
    
    def get_patterns(self, pattern_type: Optional[str] = None, 
                     niche: Optional[str] = None,
                     min_frequency: int = 2,
                     limit: int = 50) -> List[Dict[str, Any]]:
        """Get detected patterns"""
        patterns = []
        
        query = "SELECT * FROM patterns WHERE frequency >= ?"
        params = [min_frequency]
        
        if pattern_type:
            query += " AND pattern_type = ?"
            params.append(pattern_type)
        if niche:
            query += " AND niche = ?"
            params.append(niche)
        
        query += " ORDER BY frequency DESC, engagement_score DESC LIMIT ?"
        params.append(limit)
        
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(query, params)
            
            for row in cursor.fetchall():
                patterns.append(dict(row))
        
        return patterns
