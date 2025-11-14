"""
Brand DNA Analyzer - Configuration Management
Handles environment variables and application settings
"""

import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Config:
    """Application configuration"""

    # ── API KEYS ──
    APIFY_API_KEY = os.getenv('APIFY_API_KEY')
    ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY')
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')  # Optional

    # ── DIRECTORY PATHS ──
    BASE_DIR = Path(__file__).parent
    OUTPUT_DIR = BASE_DIR / os.getenv('OUTPUT_DIR', 'output')
    SCREENSHOTS_DIR = OUTPUT_DIR / 'screenshots'
    REPORTS_DIR = OUTPUT_DIR / 'reports'

    # ── APIFY ACTORS ──
    APIFY_LOGO_ACTOR = "coder_luffy/website-logo-finder"
    APIFY_FB_ADS_ACTOR = "scrapestorm/facebook-ads-library-scraper---fast-cheap"

    # ── ANALYSIS SETTINGS ──
    MAX_ADS_PER_BRAND = 50
    MAX_SCREENSHOTS_PER_BRAND = 12
    COLOR_PALETTE_SIZE = 6

    # ── CACHING ──
    CACHE_ENABLED = os.getenv('CACHE_ENABLED', 'true').lower() == 'true'
    CACHE_TTL_HOURS = int(os.getenv('CACHE_TTL_HOURS', 6))
    CACHE_DIR = OUTPUT_DIR / '.cache'

    # ── PERFORMANCE ──
    MAX_CONCURRENT_BRANDS = int(os.getenv('MAX_CONCURRENT_BRANDS', 3))
    SCREENSHOT_TIMEOUT = int(os.getenv('SCREENSHOT_TIMEOUT_SECONDS', 30))

    # ── AI MODEL SETTINGS ──
    CLAUDE_MODEL = "claude-3-5-sonnet-20241022"
    CLAUDE_MAX_TOKENS = 4096

    # ── PDF REPORT SETTINGS ──
    PDF_PAGE_SIZE = "letter"
    PDF_MARGINS = {
        'top': 0.75,
        'bottom': 0.75,
        'left': 0.75,
        'right': 0.75
    }

    @classmethod
    def validate(cls):
        """Validate required configuration"""
        errors = []

        if not cls.APIFY_API_KEY:
            errors.append("APIFY_API_KEY is required")

        if not cls.ANTHROPIC_API_KEY:
            errors.append("ANTHROPIC_API_KEY is required")

        if errors:
            raise ValueError(f"Configuration errors: {', '.join(errors)}")

    @classmethod
    def ensure_directories(cls):
        """Create necessary directories"""
        cls.OUTPUT_DIR.mkdir(exist_ok=True)
        cls.SCREENSHOTS_DIR.mkdir(exist_ok=True)
        cls.REPORTS_DIR.mkdir(exist_ok=True)
        if cls.CACHE_ENABLED:
            cls.CACHE_DIR.mkdir(exist_ok=True)

# Initialize configuration
config = Config()
