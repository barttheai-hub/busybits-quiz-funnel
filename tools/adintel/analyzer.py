"""
Analyzer module for detecting patterns in ad data
"""

import re
from collections import Counter
from typing import Dict, List, Any, Optional
from database import AdDatabase

class AdAnalyzer:
    """Analyze ad data to detect patterns and winning strategies"""
    
    # Common hook patterns
    HOOK_PATTERNS = [
        r"^(stop|wait|hold on|listen|look)",
        r"^(did you know|what if|imagine)",
        r"^(the \d+|\d+ (things?|ways?|reasons?|secrets?))",
        r"^(how to|why you|what (you're|your))",
        r"^(never|always|stop|avoid)",
        r"^(this is|here'?s? the|the (truth|secret|reality))",
        r"^(i spent|after \d+|in \d+ (days?|weeks?|months?|years?))",
        r"^( doctors?|science|research|stud(y|ies))",
    ]
    
    # Common CTA patterns
    CTA_PATTERNS = [
        "shop now", "learn more", "sign up", "get started", 
        "buy now", "order now", "subscribe", "join now",
        "click here", "tap here", "swipe up", "link in bio",
        "limited time", "while supplies last", "offer ends",
        "free shipping", "money back guarantee"
    ]
    
    def __init__(self, db: AdDatabase):
        self.db = db
    
    def analyze_hooks(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze ad copy for hook patterns"""
        ads = self.db.get_ads(filters, limit=500)
        
        hook_counts = Counter()
        hook_examples = {}
        
        for ad in ads:
            body = ad.get("ad_creative_body", "") or ""
            title = ad.get("ad_creative_link_title", "") or ""
            text = (title + " " + body).lower()
            
            for pattern in self.HOOK_PATTERNS:
                matches = re.findall(pattern, text, re.IGNORECASE)
                for match in matches:
                    hook_counts[match] += 1
                    if match not in hook_examples:
                        hook_examples[match] = {
                            "example": body[:200],
                            "title": title,
                            "page": ad.get("page_name")
                        }
        
        # Store patterns
        for hook, count in hook_counts.most_common(20):
            self.db.store_pattern("hook", hook, 
                                  filters.get("niche") if filters else None)
        
        return {
            "total_analyzed": len(ads),
            "top_hooks": [
                {"pattern": hook, "count": count, "example": hook_examples.get(hook)}
                for hook, count in hook_counts.most_common(20)
            ]
        }
    
    def analyze_ctas(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze CTAs and urgency triggers"""
        ads = self.db.get_ads(filters, limit=500)
        
        cta_counts = Counter()
        cta_fields = Counter()
        
        for ad in ads:
            body = (ad.get("ad_creative_body", "") or "").lower()
            cta_field = (ad.get("call_to_action", "") or "").lower()
            
            # Count explicit CTA field
            if cta_field:
                cta_fields[cta_field] += 1
            
            # Count patterns in body
            for cta in self.CTA_PATTERNS:
                if cta in body:
                    cta_counts[cta] += 1
        
        # Store patterns
        for cta, count in cta_counts.most_common(15):
            self.db.store_pattern("cta", cta,
                                  filters.get("niche") if filters else None)
        
        return {
            "total_analyzed": len(ads),
            "cta_fields": dict(cta_fields.most_common(10)),
            "cta_in_copy": [
                {"pattern": cta, "count": count}
                for cta, count in cta_counts.most_common(15)
            ]
        }
    
    def analyze_visuals(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze visual patterns (based on available metadata)"""
        ads = self.db.get_ads(filters, limit=500)
        
        # Since we don't have direct image analysis, infer from copy
        visual_indicators = Counter()
        
        indicators = [
            ("before/after", ["before", "after", "then", "now"]),
            ("testimonial", ["review", "testimonial", "customer", "user"]),
            ("demo", ["demo", "how it works", "see it", "watch"]),
            ("ugc style", ["real", "honest", "my", "i tried", "i used"]),
            ("problem/solution", ["problem", "solution", "fix", "solve"]),
            ("transformation", ["transform", "changed", "results", "progress"]),
        ]
        
        for ad in ads:
            body = (ad.get("ad_creative_body", "") or "").lower()
            
            for visual_type, keywords in indicators:
                if any(kw in body for kw in keywords):
                    visual_indicators[visual_type] += 1
        
        # Store patterns
        for visual, count in visual_indicators.most_common():
            self.db.store_pattern("visual", visual,
                                  filters.get("niche") if filters else None)
        
        return {
            "total_analyzed": len(ads),
            "visual_types": [
                {"type": vt, "count": count}
                for vt, count in visual_indicators.most_common()
            ],
            "video_vs_image": self._estimate_video_ratio(ads)
        }
    
    def _estimate_video_ratio(self, ads: List[Dict]) -> Dict[str, int]:
        """Estimate video vs image split based on available data"""
        video = 0
        image = 0
        
        for ad in ads:
            if ad.get("video_url"):
                video += 1
            else:
                image += 1
        
        return {"video": video, "image": image}
    
    def analyze_all(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Run all analyses"""
        return {
            "hooks": self.analyze_hooks(filters),
            "ctas": self.analyze_ctas(filters),
            "visuals": self.analyze_visuals(filters),
            "top_advertisers": self._top_advertisers(filters),
            "performance_signals": self._analyze_performance(filters)
        }
    
    def _top_advertisers(self, filters: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """Identify top advertisers by ad volume"""
        ads = self.db.get_ads(filters, limit=1000)
        
        advertiser_counts = Counter(ad.get("page_name") for ad in ads if ad.get("page_name"))
        
        return [
            {"name": name, "ad_count": count}
            for name, count in advertiser_counts.most_common(20)
        ]
    
    def _analyze_performance(self, filters: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Analyze performance indicators"""
        ads = self.db.get_ads(filters, limit=500)
        
        # Count ads with engagement data
        with_engagement = [ad for ad in ads if ad.get("engagement")]
        
        if not with_engagement:
            return {"note": "No engagement data available"}
        
        total_likes = sum(ad["engagement"].get("likes", 0) for ad in with_engagement)
        total_shares = sum(ad["engagement"].get("shares", 0) for ad in with_engagement)
        total_comments = sum(ad["engagement"].get("comments", 0) for ad in with_engagement)
        
        return {
            "ads_with_data": len(with_engagement),
            "total_likes": total_likes,
            "total_shares": total_shares,
            "total_comments": total_comments,
            "avg_engagement": {
                "likes": total_likes // len(with_engagement) if with_engagement else 0,
                "shares": total_shares // len(with_engagement) if with_engagement else 0,
                "comments": total_comments // len(with_engagement) if with_engagement else 0
            }
        }
    
    def detect_new_trends(self, days: int = 7) -> List[Dict[str, Any]]:
        """Detect emerging trends in recent ads"""
        from datetime import datetime, timedelta
        
        cutoff = (datetime.now() - timedelta(days=days)).isoformat()
        
        recent_filters = {"min_date": cutoff}
        recent_ads = self.db.get_ads(recent_filters, limit=200)
        
        # Extract common phrases (3-4 words)
        phrase_counts = Counter()
        
        for ad in recent_ads:
            body = ad.get("ad_creative_body", "") or ""
            words = body.lower().split()
            
            # Extract 3-grams
            for i in range(len(words) - 2):
                phrase = " ".join(words[i:i+3])
                if len(phrase) > 15:  # Skip short phrases
                    phrase_counts[phrase] += 1
        
        # Return phrases that appear multiple times
        return [
            {"phrase": phrase, "frequency": count}
            for phrase, count in phrase_counts.most_common(15)
            if count >= 2
        ]
