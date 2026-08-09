import httpx
import feedparser
import logging
from typing import List, Dict, Any
from datetime import datetime, timedelta

logger = logging.getLogger("news_service")

RSS_FEEDS = {
    "Economic Times": "https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms",
    "Moneycontrol": "https://www.moneycontrol.com/rss/MCtopnews.xml"
}

class NewsService:
    def __init__(self):
        self.headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        self.rss_cache = {}  # url -> {"time": datetime, "entries": [...]}
        self.reddit_cache = {"time": None, "posts": []}

    async def _fetch_rss_feed(self, client: httpx.AsyncClient, source_name: str, url: str) -> List[Dict[str, Any]]:
        # Check cache
        now = datetime.now()
        if url in self.rss_cache:
            cache_entry = self.rss_cache[url]
            if now - cache_entry["time"] < timedelta(minutes=5):
                return cache_entry["entries"]

        try:
            logger.info(f"Fetching RSS feed from {source_name}...")
            response = await client.get(url, headers=self.headers)
            if response.status_code == 200:
                feed = feedparser.parse(response.text)
                entries = []
                for entry in feed.entries[:30]:  # Get top 30 from each
                    title = entry.get("title", "")
                    summary = entry.get("summary", "") or entry.get("description", "")
                    link = entry.get("link", "")
                    published = entry.get("published", "")
                    entries.append({
                        "title": title,
                        "summary": summary[:250] + "..." if len(summary) > 250 else summary,
                        "link": link,
                        "published": published,
                        "source": source_name
                    })
                self.rss_cache[url] = {"time": now, "entries": entries}
                return entries
        except Exception as e:
            logger.error(f"Failed to fetch RSS news from {source_name}: {e}")
            if url in self.rss_cache:
                return self.rss_cache[url]["entries"]
        return []

    async def fetch_news(self, ticker: str = "") -> List[Dict[str, Any]]:
        """Fetch market news from RSS feeds, optionally filtering by ticker."""
        news_items = []
        
        async with httpx.AsyncClient(timeout=1.5) as client:
            for source_name, url in RSS_FEEDS.items():
                entries = await self._fetch_rss_feed(client, source_name, url)
                for entry in entries:
                    if ticker:
                        search_term = ticker.lower()
                        if search_term not in entry["title"].lower() and search_term not in entry["summary"].lower():
                            continue
                    news_items.append(entry)
                    
        # If we got no specific news for a ticker, return general market news
        if ticker and not news_items:
            return await self.fetch_news("")
            
        return news_items[:15]

    async def scrape_reddit(self, ticker: str = "") -> List[Dict[str, Any]]:
        """Fetch popular posts from r/IndiaInvestments."""
        now = datetime.now()
        if self.reddit_cache["time"] and now - self.reddit_cache["time"] < timedelta(minutes=5):
            posts = self.reddit_cache["posts"]
        else:
            posts = []
            url = "https://www.reddit.com/r/IndiaInvestments/new.json?limit=25"
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0"
            }
            try:
                async with httpx.AsyncClient(timeout=1.5) as client:
                    response = await client.get(url, headers=headers)
                    if response.status_code == 200:
                        data = response.json()
                        children = data.get("data", {}).get("children", [])
                        for post in children:
                            post_data = post.get("data", {})
                            title = post_data.get("title", "")
                            content = post_data.get("selftext", "")
                            permalink = post_data.get("permalink", "")
                            posts.append({
                                "title": title,
                                "summary": content[:250] + "..." if len(content) > 250 else content,
                                "link": f"https://www.reddit.com{permalink}",
                                "published": post_data.get("created_utc", ""),
                                "source": "r/IndiaInvestments"
                            })
                        self.reddit_cache = {"time": now, "posts": posts}
            except Exception as e:
                logger.error(f"Failed to scrape Reddit r/IndiaInvestments: {e}")
                if self.reddit_cache["posts"]:
                    posts = self.reddit_cache["posts"]

        if ticker:
            search_term = ticker.lower()
            return [p for p in posts if search_term in p["title"].lower() or search_term in p["summary"].lower()]
        return posts

# Global news service
news_service = NewsService()

