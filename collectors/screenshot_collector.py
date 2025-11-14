"""
Screenshot Collector - High-quality ad screenshot automation
Uses Playwright to capture visual ad creatives from Facebook Ad Library
"""

import logging
import asyncio
from pathlib import Path
from typing import List, Optional
from PIL import Image
from io import BytesIO
from playwright.async_api import async_playwright, TimeoutError as PlaywrightTimeout
from config import config

logger = logging.getLogger(__name__)


class ScreenshotCollector:
    """Capture high-quality screenshots of advertising creatives"""

    def __init__(self, output_dir: Path = None):
        """
        Initialize screenshot collector

        Args:
            output_dir: Directory to save screenshots (defaults to config)
        """
        self.output_dir = output_dir or config.SCREENSHOTS_DIR
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.timeout = config.SCREENSHOT_TIMEOUT * 1000  # Convert to ms

    async def capture_ad_screenshots(
        self,
        ad_urls: List[str],
        brand_name: str,
        max_screenshots: int = None
    ) -> List[str]:
        """
        Capture screenshots of ads from Facebook Ad Library

        Args:
            ad_urls: List of Facebook Ad Library URLs
            brand_name: Brand name for file organization
            max_screenshots: Maximum screenshots to capture

        Returns:
            List of file paths to saved screenshots
        """
        max_screenshots = max_screenshots or config.MAX_SCREENSHOTS_PER_BRAND
        urls_to_capture = ad_urls[:max_screenshots]

        logger.info(f"Capturing {len(urls_to_capture)} screenshots for {brand_name}")

        screenshot_paths = []

        async with async_playwright() as p:
            # Launch browser
            browser = await p.chromium.launch(headless=True)
            context = await browser.new_context(
                viewport={'width': 1200, 'height': 800},
                user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
            )
            page = await context.new_page()

            # Create brand-specific directory
            brand_dir = self.output_dir / self._sanitize_filename(brand_name)
            brand_dir.mkdir(exist_ok=True)

            for idx, url in enumerate(urls_to_capture):
                try:
                    screenshot_path = await self._capture_single_ad(
                        page=page,
                        url=url,
                        output_path=brand_dir / f"ad_{idx + 1}.png",
                        index=idx
                    )

                    if screenshot_path:
                        screenshot_paths.append(str(screenshot_path))

                except Exception as e:
                    logger.warning(f"Failed to capture screenshot {idx + 1}: {e}")
                    continue

            await browser.close()

        logger.info(f"✅ Captured {len(screenshot_paths)} screenshots for {brand_name}")
        return screenshot_paths

    async def _capture_single_ad(
        self,
        page,
        url: str,
        output_path: Path,
        index: int
    ) -> Optional[Path]:
        """
        Capture a single ad screenshot

        Args:
            page: Playwright page object
            url: Ad Library URL
            output_path: Where to save screenshot
            index: Ad index for logging

        Returns:
            Path to saved screenshot or None if failed
        """
        try:
            # Navigate to ad
            await page.goto(url, wait_until='networkidle', timeout=self.timeout)

            # Wait for ad content to load
            await page.wait_for_timeout(2000)

            # Try to find ad creative element (multiple selectors)
            selectors = [
                '[role="main"]',  # Main content area
                '[data-testid="ad-preview"]',
                '.ad-creative-area',
                'img[alt*="ad"]',
                'video'
            ]

            screenshot_bytes = None
            for selector in selectors:
                try:
                    element = page.locator(selector).first
                    if await element.count() > 0:
                        screenshot_bytes = await element.screenshot(timeout=5000)
                        break
                except:
                    continue

            # Fallback to full page screenshot
            if not screenshot_bytes:
                screenshot_bytes = await page.screenshot(full_page=False)

            # Optimize and save
            img = Image.open(BytesIO(screenshot_bytes))
            img.thumbnail((800, 800), Image.Resampling.LANCZOS)
            img.save(output_path, optimize=True, quality=85, format='PNG')

            logger.debug(f"Screenshot {index + 1} saved: {output_path.name}")
            return output_path

        except PlaywrightTimeout:
            logger.warning(f"Timeout capturing screenshot {index + 1}")
            return None
        except Exception as e:
            logger.warning(f"Error capturing screenshot {index + 1}: {e}")
            return None

    def capture_website_screenshot(
        self,
        url: str,
        brand_name: str,
        filename: str = "homepage.png"
    ) -> Optional[str]:
        """
        Capture a single website screenshot (synchronous wrapper)

        Args:
            url: Website URL
            brand_name: Brand name
            filename: Output filename

        Returns:
            Path to screenshot or None
        """
        return asyncio.run(self._capture_website_async(url, brand_name, filename))

    async def _capture_website_async(
        self,
        url: str,
        brand_name: str,
        filename: str
    ) -> Optional[str]:
        """Async implementation of website screenshot"""
        brand_dir = self.output_dir / self._sanitize_filename(brand_name)
        brand_dir.mkdir(exist_ok=True)
        output_path = brand_dir / filename

        async with async_playwright() as p:
            browser = await p.chromium.launch(headless=True)
            page = await browser.new_page(viewport={'width': 1200, 'height': 800})

            try:
                await page.goto(url, wait_until='networkidle', timeout=self.timeout)
                await page.wait_for_timeout(2000)

                screenshot_bytes = await page.screenshot(full_page=False)

                img = Image.open(BytesIO(screenshot_bytes))
                img.thumbnail((800, 800), Image.Resampling.LANCZOS)
                img.save(output_path, optimize=True, quality=85, format='PNG')

                await browser.close()
                return str(output_path)

            except Exception as e:
                logger.error(f"Failed to capture website screenshot: {e}")
                await browser.close()
                return None

    @staticmethod
    def _sanitize_filename(name: str) -> str:
        """Sanitize brand name for use in filesystem"""
        return "".join(c for c in name if c.isalnum() or c in (' ', '-', '_')).strip()
