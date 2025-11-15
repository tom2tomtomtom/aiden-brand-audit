#!/usr/bin/env python3
"""
Brand DNA Analyzer - Main Orchestration Pipeline
Complete brand intelligence analysis with visual reporting
"""

import asyncio
import logging
from pathlib import Path
from typing import List, Dict
from datetime import datetime

from config import config
from collectors.logo_collector import LogoCollector
from collectors.ads_collector import AdsCollector
from collectors.screenshot_collector import ScreenshotCollector
from analyzers.color_analyzer import ColorAnalyzer
from analyzers.strategic_analyzer import StrategicAnalyzer
from report.visual_report import BrandDNAReport

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class BrandDNAAnalyzer:
    """Main orchestrator for brand DNA analysis"""

    def __init__(self):
        """Initialize analyzer with all services"""
        # Validate configuration
        try:
            config.validate()
            config.ensure_directories()
        except ValueError as e:
            logger.error(f"Configuration error: {e}")
            raise

        # Initialize collectors
        self.logo_collector = LogoCollector()
        self.ads_collector = AdsCollector()
        self.screenshot_collector = ScreenshotCollector()

        # Initialize analyzers
        self.color_analyzer = ColorAnalyzer()
        self.strategic_analyzer = StrategicAnalyzer()

        logger.info("✅ Brand DNA Analyzer initialized")

    async def analyze_brands(
        self,
        brand_configs: List[Dict],
        output_dir: Path = None
    ) -> Dict:
        """
        Complete brand DNA analysis workflow

        Args:
            brand_configs: List of brand configurations:
                [{
                    'name': 'Nike',
                    'website': 'https://nike.com',
                    'facebook_page': 'nike'  # Optional
                }]
            output_dir: Output directory (defaults to config)

        Returns:
            Dict containing:
                - report_path: Path to generated PDF report
                - brands_data: Collected brand data
                - strategic_insights: AI analysis results
        """
        output_dir = output_dir or config.OUTPUT_DIR
        start_time = datetime.now()

        logger.info(f"\n{'='*60}")
        logger.info(f"🚀 Starting Brand DNA Analysis")
        logger.info(f"{'='*60}")
        logger.info(f"Brands: {', '.join([b['name'] for b in brand_configs])}")
        logger.info(f"Output: {output_dir}\n")

        brands_data = []

        # ========================================
        # PHASE 1: DATA COLLECTION
        # ========================================
        logger.info("📊 PHASE 1: Data Collection")
        logger.info("-" * 60)

        for brand in brand_configs:
            brand_name = brand['name']
            logger.info(f"\n📦 Collecting data for {brand_name}...")

            brand_data = {'name': brand_name}

            # Collect logos
            logger.info("  → Collecting logos...")
            logos = self.logo_collector.collect_logos(brand['website'])
            brand_data['logos'] = logos

            # Collect Facebook ads
            logger.info("  → Collecting Facebook ads...")
            search_term = brand.get('facebook_page', brand_name)
            ads = self.ads_collector.collect_facebook_ads(search_term)
            brand_data['ads'] = ads

            # Capture ad screenshots
            logger.info("  → Capturing ad screenshots...")
            ad_urls = [ad['ad_url'] for ad in ads if ad.get('ad_url')]
            screenshots = await self.screenshot_collector.capture_ad_screenshots(
                ad_urls,
                brand_name
            )
            brand_data['screenshots'] = screenshots

            # Analyze colors
            logger.info("  → Analyzing color palette...")
            if logos.get('primary_logo'):
                colors = self.color_analyzer.extract_palette_from_url(
                    logos['primary_logo']
                )
                brand_data['colors'] = colors
            else:
                brand_data['colors'] = {}

            logger.info(f"  ✅ {brand_name} data collection complete")
            logger.info(f"     Logos: {len(logos.get('logo_variants', []))}")
            logger.info(f"     Ads: {len(ads)}")
            logger.info(f"     Screenshots: {len(screenshots)}")
            logger.info(f"     Colors: {len(brand_data['colors'].get('primary_colors', []))}")

            brands_data.append(brand_data)

        # ========================================
        # PHASE 2: STRATEGIC ANALYSIS
        # ========================================
        logger.info(f"\n\n🧠 PHASE 2: Strategic Analysis")
        logger.info("-" * 60)

        strategic_insights = self.strategic_analyzer.analyze_competitive_landscape(
            brands_data
        )

        if strategic_insights.get('error'):
            logger.warning(f"⚠️  Strategic analysis had errors: {strategic_insights['error']}")
        else:
            logger.info("✅ Strategic insights generated")

        # ========================================
        # PHASE 3: REPORT GENERATION
        # ========================================
        logger.info(f"\n\n📄 PHASE 3: Report Generation")
        logger.info("-" * 60)

        report = BrandDNAReport(brands_data, strategic_insights)
        report_path = report.generate()

        # ========================================
        # SUMMARY
        # ========================================
        duration = (datetime.now() - start_time).total_seconds()

        logger.info(f"\n\n{'='*60}")
        logger.info("✨ ANALYSIS COMPLETE")
        logger.info(f"{'='*60}")
        logger.info(f"📊 Brands Analyzed: {len(brands_data)}")
        logger.info(f"📸 Total Screenshots: {sum(len(b['screenshots']) for b in brands_data)}")
        logger.info(f"📱 Total Ads: {sum(len(b['ads']) for b in brands_data)}")
        logger.info(f"⏱️  Duration: {duration:.1f} seconds")
        logger.info(f"📄 Report: {report_path}")
        logger.info(f"{'='*60}\n")

        return {
            'report_path': report_path,
            'brands_data': brands_data,
            'strategic_insights': strategic_insights,
            'duration': duration
        }


async def main():
    """Example usage"""
    # Example brand configurations
    brand_configs = [
        {
            'name': 'Nike',
            'website': 'https://nike.com',
            'facebook_page': 'nike'
        },
        {
            'name': 'Adidas',
            'website': 'https://adidas.com',
            'facebook_page': 'adidas'
        },
        {
            'name': 'Under Armour',
            'website': 'https://underarmour.com',
            'facebook_page': 'UnderArmour'
        }
    ]

    # Run analysis
    analyzer = BrandDNAAnalyzer()
    result = await analyzer.analyze_brands(brand_configs)

    print(f"\n✅ Report generated: {result['report_path']}")


if __name__ == "__main__":
    asyncio.run(main())
