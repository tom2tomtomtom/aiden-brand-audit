"""
Ads Collector - Facebook advertising intelligence using Apify
Collects brand advertising campaigns, creatives, and messaging
"""

import logging
from typing import Dict, List, Optional
from apify_client import ApifyClient
from config import config

logger = logging.getLogger(__name__)


class AdsCollector:
    """Collect brand advertising data from Facebook Ad Library via Apify"""

    def __init__(self, apify_token: str = None):
        """
        Initialize ads collector

        Args:
            apify_token: Apify API token (defaults to config)
        """
        self.token = apify_token or config.APIFY_API_KEY
        if not self.token:
            raise ValueError("APIFY_API_KEY is required")

        self.client = ApifyClient(self.token)
        self.actor_id = config.APIFY_FB_ADS_ACTOR

    def collect_facebook_ads(
        self,
        brand_name: str,
        max_ads: int = None,
        country: str = "US"
    ) -> List[Dict]:
        """
        Collect Facebook ads for a brand

        Args:
            brand_name: Brand name to search (e.g., 'Nike')
            max_ads: Maximum ads to collect (defaults to config)
            country: Country code for ad library (default: US)

        Returns:
            List[{
                'ad_id': str,
                'ad_text': str,           # Ad copy/message
                'ad_image_url': str,      # Ad creative image
                'ad_video_url': str,      # Ad video (if available)
                'platforms': List[str],   # ['facebook', 'instagram', etc.]
                'cta': str,               # Call-to-action button
                'start_date': str,        # When ad started running
                'page_name': str,         # Facebook page name
                'ad_url': str             # Link to ad in Ad Library
            }]
        """
        max_ads = max_ads or config.MAX_ADS_PER_BRAND
        logger.info(f"Collecting up to {max_ads} Facebook ads for: {brand_name}")

        try:
            # Run Apify actor
            run = self.client.actor(self.actor_id).call(
                run_input={
                    "keyword": brand_name,
                    "country": country,
                    "max_items": max_ads
                }
            )

            # Get results from dataset
            dataset = self.client.dataset(run["defaultDatasetId"])
            items = list(dataset.iterate_items())

            if not items:
                logger.warning(f"No ads found for {brand_name}")
                return []

            # Process ads data
            ads = []
            for item in items:
                ad_data = {
                    'ad_id': item.get('id') or item.get('ad_id'),
                    'ad_text': item.get('adText') or item.get('ad_creative_bodies', [''])[0],
                    'ad_image_url': self._extract_image_url(item),
                    'ad_video_url': self._extract_video_url(item),
                    'platforms': self._extract_platforms(item),
                    'cta': item.get('callToAction') or item.get('cta_text'),
                    'start_date': item.get('startDate') or item.get('ad_delivery_start_time'),
                    'page_name': item.get('pageName') or item.get('page_name'),
                    'ad_url': item.get('adArchiveURL') or item.get('ad_snapshot_url'),
                    'raw_data': item  # Keep raw data for debugging
                }
                ads.append(ad_data)

            logger.info(f"✅ Collected {len(ads)} ads for {brand_name}")
            return ads

        except Exception as e:
            logger.error(f"Failed to collect ads for {brand_name}: {e}")
            return []

    def _extract_image_url(self, item: Dict) -> Optional[str]:
        """Extract image URL from ad data"""
        # Try multiple possible field names
        return (
            item.get('adImageUrl') or
            item.get('ad_creative_link_captions', [{}])[0].get('url') or
            item.get('snapshot', {}).get('images', [{}])[0].get('url')
        )

    def _extract_video_url(self, item: Dict) -> Optional[str]:
        """Extract video URL from ad data"""
        return (
            item.get('videoUrl') or
            item.get('snapshot', {}).get('videos', [{}])[0].get('url')
        )

    def _extract_platforms(self, item: Dict) -> List[str]:
        """Extract platform list from ad data"""
        platforms = item.get('publisherPlatforms') or item.get('platforms', [])
        if isinstance(platforms, str):
            platforms = [platforms]
        return [p.lower() for p in platforms] if platforms else ['facebook']
