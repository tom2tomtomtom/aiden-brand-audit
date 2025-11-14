"""
Logo Collector - Brand visual asset discovery using Apify
Collects brand logos, favicons, and visual identifiers
"""

import logging
from typing import Dict, List, Optional
from apify_client import ApifyClient
from config import config

logger = logging.getLogger(__name__)


class LogoCollector:
    """Collect brand logos using Apify website-logo-finder actor"""

    def __init__(self, apify_token: str = None):
        """
        Initialize logo collector

        Args:
            apify_token: Apify API token (defaults to config)
        """
        self.token = apify_token or config.APIFY_API_KEY
        if not self.token:
            raise ValueError("APIFY_API_KEY is required")

        self.client = ApifyClient(self.token)
        self.actor_id = config.APIFY_LOGO_ACTOR

    def collect_logos(self, brand_website: str) -> Dict:
        """
        Collect brand logos from website

        Args:
            brand_website: Brand website URL (e.g., 'https://nike.com')

        Returns:
            {
                'primary_logo': str,           # Main logo URL
                'logo_variants': List[str],    # Additional logo variations
                'favicon': str,                # Favicon URL
                'brand_name': str,             # Detected brand name
                'success': bool
            }
        """
        logger.info(f"Collecting logos for: {brand_website}")

        try:
            # Run Apify actor
            run = self.client.actor(self.actor_id).call(
                run_input={"input_url": brand_website}
            )

            # Get results from dataset
            dataset = self.client.dataset(run["defaultDatasetId"])
            items = list(dataset.iterate_items())

            if not items:
                logger.warning(f"No logos found for {brand_website}")
                return self._empty_result()

            # Process results
            primary_logo = items[0].get('logo_url') or items[0].get('logoUrl')
            favicon = items[0].get('favicon_url') or items[0].get('faviconUrl')
            brand_name = items[0].get('brand_name') or items[0].get('title', '')

            # Collect variants (up to 6 logos)
            logo_variants = []
            for item in items[:6]:
                logo_url = item.get('logo_url') or item.get('logoUrl')
                if logo_url and logo_url not in logo_variants:
                    logo_variants.append(logo_url)

            result = {
                'primary_logo': primary_logo,
                'logo_variants': logo_variants,
                'favicon': favicon,
                'brand_name': brand_name,
                'success': True,
                'total_found': len(items)
            }

            logger.info(f"✅ Found {len(logo_variants)} logos for {brand_name}")
            return result

        except Exception as e:
            logger.error(f"Failed to collect logos for {brand_website}: {e}")
            return self._empty_result(error=str(e))

    def _empty_result(self, error: str = None) -> Dict:
        """Return empty result structure"""
        return {
            'primary_logo': None,
            'logo_variants': [],
            'favicon': None,
            'brand_name': None,
            'success': False,
            'error': error,
            'total_found': 0
        }
