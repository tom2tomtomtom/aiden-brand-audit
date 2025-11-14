"""
Color Analyzer - Brand color palette extraction and analysis
Extracts dominant colors from brand assets and visual materials
"""

import logging
import requests
from typing import Dict, List, Optional, Tuple
from pathlib import Path
from PIL import Image
from colorthief import ColorThief
from io import BytesIO
from config import config

logger = logging.getLogger(__name__)


class ColorAnalyzer:
    """Extract and analyze brand color palettes from visual assets"""

    def __init__(self, color_count: int = None):
        """
        Initialize color analyzer

        Args:
            color_count: Number of colors to extract (defaults to config)
        """
        self.color_count = color_count or config.COLOR_PALETTE_SIZE

    def extract_palette_from_url(self, image_url: str) -> Dict:
        """
        Extract color palette from image URL

        Args:
            image_url: URL of the image

        Returns:
            {
                'primary_colors': List[str],      # Top 3 colors (hex)
                'secondary_colors': List[str],    # Additional colors (hex)
                'dominant_color': str,            # Most dominant color (hex)
                'rgb_values': List[Tuple],        # RGB tuples
                'success': bool
            }
        """
        logger.debug(f"Extracting colors from URL: {image_url[:50]}...")

        try:
            # Download image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()

            img = Image.open(BytesIO(response.content))

            # Save temporarily for ColorThief
            temp_path = Path('/tmp/temp_color_analysis.jpg')
            img.convert('RGB').save(temp_path, format='JPEG')

            # Extract palette
            return self._extract_from_file(temp_path)

        except Exception as e:
            logger.error(f"Failed to extract colors from URL: {e}")
            return self._empty_result(error=str(e))

    def extract_palette_from_file(self, file_path: Path) -> Dict:
        """
        Extract color palette from local file

        Args:
            file_path: Path to image file

        Returns:
            Same as extract_palette_from_url
        """
        logger.debug(f"Extracting colors from file: {file_path}")

        try:
            return self._extract_from_file(file_path)
        except Exception as e:
            logger.error(f"Failed to extract colors from file: {e}")
            return self._empty_result(error=str(e))

    def _extract_from_file(self, file_path: Path) -> Dict:
        """Internal method to extract colors from file"""
        # Extract palette using ColorThief
        color_thief = ColorThief(str(file_path))

        # Get dominant color
        dominant_rgb = color_thief.get_color(quality=1)

        # Get color palette
        palette_rgb = color_thief.get_palette(
            color_count=self.color_count,
            quality=1
        )

        # Convert RGB to hex
        hex_colors = [self._rgb_to_hex(rgb) for rgb in palette_rgb]

        result = {
            'primary_colors': hex_colors[:3],
            'secondary_colors': hex_colors[3:] if len(hex_colors) > 3 else [],
            'dominant_color': self._rgb_to_hex(dominant_rgb),
            'rgb_values': palette_rgb,
            'total_colors': len(hex_colors),
            'success': True
        }

        logger.debug(f"✅ Extracted {len(hex_colors)} colors")
        return result

    def analyze_multiple_images(
        self,
        image_sources: List[str],
        source_type: str = 'url'
    ) -> Dict:
        """
        Analyze multiple images and aggregate color palette

        Args:
            image_sources: List of URLs or file paths
            source_type: 'url' or 'file'

        Returns:
            {
                'aggregated_palette': List[str],  # Most common colors
                'color_frequency': Dict[str, int], # Color occurrence count
                'individual_results': List[Dict],  # Per-image results
                'total_unique_colors': int
            }
        """
        logger.info(f"Analyzing {len(image_sources)} images for color aggregation")

        individual_results = []
        all_colors = []

        for source in image_sources:
            if source_type == 'url':
                result = self.extract_palette_from_url(source)
            else:
                result = self.extract_palette_from_file(Path(source))

            if result['success']:
                individual_results.append(result)
                all_colors.extend(result['primary_colors'])
                all_colors.extend(result['secondary_colors'])

        # Count color frequency
        color_frequency = {}
        for color in all_colors:
            color_frequency[color] = color_frequency.get(color, 0) + 1

        # Sort by frequency
        sorted_colors = sorted(
            color_frequency.items(),
            key=lambda x: x[1],
            reverse=True
        )

        # Get top colors
        aggregated_palette = [color for color, _ in sorted_colors[:self.color_count]]

        return {
            'aggregated_palette': aggregated_palette,
            'color_frequency': dict(sorted_colors),
            'individual_results': individual_results,
            'total_unique_colors': len(color_frequency),
            'total_images_analyzed': len(individual_results)
        }

    @staticmethod
    def _rgb_to_hex(rgb: Tuple[int, int, int]) -> str:
        """Convert RGB tuple to hex color code"""
        return '#{:02x}{:02x}{:02x}'.format(rgb[0], rgb[1], rgb[2])

    @staticmethod
    def _hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
        """Convert hex color code to RGB tuple"""
        hex_color = hex_color.lstrip('#')
        return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

    def get_color_name(self, hex_color: str) -> str:
        """
        Get approximate color name from hex code

        Args:
            hex_color: Hex color code (e.g., '#FF0000')

        Returns:
            Color name (e.g., 'Red')
        """
        # Simple color name mapping
        rgb = self._hex_to_rgb(hex_color)
        r, g, b = rgb

        # Basic color categorization
        if r > 200 and g < 100 and b < 100:
            return "Red"
        elif r < 100 and g > 200 and b < 100:
            return "Green"
        elif r < 100 and g < 100 and b > 200:
            return "Blue"
        elif r > 200 and g > 200 and b < 100:
            return "Yellow"
        elif r > 200 and g < 100 and b > 200:
            return "Magenta"
        elif r < 100 and g > 200 and b > 200:
            return "Cyan"
        elif r > 200 and g > 200 and b > 200:
            return "White"
        elif r < 100 and g < 100 and b < 100:
            return "Black"
        elif r > 150 and g > 100 and b < 100:
            return "Orange"
        elif r > 150 and g < 100 and b > 100:
            return "Purple"
        else:
            return "Gray"

    def _empty_result(self, error: str = None) -> Dict:
        """Return empty result structure"""
        return {
            'primary_colors': [],
            'secondary_colors': [],
            'dominant_color': None,
            'rgb_values': [],
            'total_colors': 0,
            'success': False,
            'error': error
        }
