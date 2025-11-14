"""
Report Components - Reusable visual components for PDF reports
Professional visual elements for executive-grade brand reports
"""

import logging
from pathlib import Path
from typing import List, Dict, Optional
from io import BytesIO

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import seaborn as sns
from reportlab.lib.units import inch
from reportlab.platypus import Image as RLImage
from reportlab.lib import colors
from PIL import Image as PILImage

logger = logging.getLogger(__name__)


class ReportComponents:
    """Reusable visual components for PDF reports"""

    def __init__(self):
        """Initialize report components"""
        # Set professional matplotlib style
        plt.style.use('seaborn-v0_8-darkgrid')
        sns.set_palette("husl")

    def create_color_swatches(
        self,
        brand_name: str,
        hex_colors: List[str],
        width: float = 6,
        height: float = 1.5
    ) -> Optional[RLImage]:
        """
        Generate visual color palette display

        Args:
            brand_name: Brand name for title
            hex_colors: List of hex color codes
            width: Width in inches
            height: Height in inches

        Returns:
            ReportLab Image object
        """
        if not hex_colors:
            logger.warning(f"No colors provided for {brand_name}")
            return None

        try:
            num_colors = len(hex_colors)
            fig, axes = plt.subplots(1, num_colors, figsize=(width * 1.33, height))

            if num_colors == 1:
                axes = [axes]

            fig.suptitle(f'{brand_name} Color Palette',
                        fontsize=14, fontweight='bold', y=0.98)

            for ax, color in zip(axes, hex_colors):
                # Create color rectangle
                ax.add_patch(plt.Rectangle((0, 0), 1, 1, facecolor=color, edgecolor='#333333', linewidth=2))
                # Add hex code label below
                ax.text(0.5, -0.35, color.upper(), ha='center', fontsize=9, fontfamily='monospace')
                ax.set_xlim(0, 1)
                ax.set_ylim(0, 1)
                ax.axis('off')

            plt.tight_layout()

            # Convert to ReportLab Image
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()

            return RLImage(buf, width=width*inch, height=height*inch)

        except Exception as e:
            logger.error(f"Failed to create color swatches: {e}")
            plt.close()
            return None

    def create_logo_gallery(
        self,
        logo_image_paths: List[str],
        width: float = 6,
        height: float = 4
    ) -> Optional[RLImage]:
        """
        Arrange logos in grid layout

        Args:
            logo_image_paths: List of paths to logo images
            width: Width in inches
            height: Height in inches

        Returns:
            ReportLab Image object
        """
        if not logo_image_paths:
            logger.warning("No logo paths provided")
            return None

        try:
            # Load images
            logos = []
            for path in logo_image_paths[:6]:  # Max 6 logos
                if Path(path).exists():
                    img = PILImage.open(path)
                    logos.append(img)

            if not logos:
                return None

            # Calculate grid dimensions
            num_logos = len(logos)
            if num_logos <= 2:
                grid_rows, grid_cols = 1, num_logos
            elif num_logos <= 4:
                grid_rows, grid_cols = 2, 2
            else:
                grid_rows, grid_cols = 2, 3

            # Resize logos to standard size
            max_size = (200, 200)
            for img in logos:
                img.thumbnail(max_size, PILImage.Resampling.LANCZOS)

            # Create composite grid
            cell_size = 220
            composite_width = cell_size * grid_cols
            composite_height = cell_size * grid_rows

            composite = PILImage.new('RGB', (composite_width, composite_height), 'white')

            for idx, img in enumerate(logos):
                row = idx // grid_cols
                col = idx % grid_cols
                x = col * cell_size + (cell_size - img.width) // 2
                y = row * cell_size + (cell_size - img.height) // 2
                composite.paste(img, (x, y))

            # Convert to ReportLab
            buf = BytesIO()
            composite.save(buf, format='PNG')
            buf.seek(0)

            return RLImage(buf, width=width*inch, height=height*inch)

        except Exception as e:
            logger.error(f"Failed to create logo gallery: {e}")
            return None

    def create_screenshot_gallery(
        self,
        screenshot_paths: List[str],
        title: str = "Ad Screenshots",
        width: float = 6.5,
        height: float = 8
    ) -> Optional[RLImage]:
        """
        Create grid of ad screenshots

        Args:
            screenshot_paths: Paths to screenshot images
            title: Gallery title
            width: Width in inches
            height: Height in inches

        Returns:
            ReportLab Image object
        """
        if not screenshot_paths:
            logger.warning("No screenshots provided")
            return None

        try:
            # Load screenshots (max 12)
            screenshots = []
            for path in screenshot_paths[:12]:
                if Path(path).exists():
                    img = PILImage.open(path)
                    screenshots.append(img)

            if not screenshots:
                return None

            # Grid layout: 3 columns
            grid_cols = 3
            grid_rows = (len(screenshots) + grid_cols - 1) // grid_cols

            # Create figure
            fig, axes = plt.subplots(grid_rows, grid_cols, figsize=(width * 1.33, height))
            fig.suptitle(title, fontsize=16, fontweight='bold')

            if grid_rows == 1:
                axes = axes.reshape(1, -1)

            for idx in range(grid_rows * grid_cols):
                row = idx // grid_cols
                col = idx % grid_cols
                ax = axes[row, col]

                if idx < len(screenshots):
                    ax.imshow(screenshots[idx])
                    ax.set_title(f'Ad {idx + 1}', fontsize=8)
                ax.axis('off')

            plt.tight_layout()

            # Convert to ReportLab
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=120, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()

            return RLImage(buf, width=width*inch, height=height*inch)

        except Exception as e:
            logger.error(f"Failed to create screenshot gallery: {e}")
            plt.close()
            return None

    def create_comparison_chart(
        self,
        metric_name: str,
        brand_data: Dict[str, float],
        width: float = 6,
        height: float = 4
    ) -> Optional[RLImage]:
        """
        Create horizontal bar chart comparing brands

        Args:
            metric_name: Name of metric being compared
            brand_data: Dict mapping brand names to values
            width: Width in inches
            height: Height in inches

        Returns:
            ReportLab Image object
        """
        if not brand_data:
            logger.warning(f"No data for {metric_name}")
            return None

        try:
            fig, ax = plt.subplots(figsize=(width, height))

            brands = list(brand_data.keys())
            values = list(brand_data.values())
            colors_map = plt.cm.Set3(range(len(brands)))

            ax.barh(brands, values, color=colors_map)
            ax.set_xlabel(metric_name, fontsize=12, fontweight='bold')
            ax.set_title(f'{metric_name} Comparison', fontsize=14, fontweight='bold')
            ax.grid(axis='x', alpha=0.3)

            plt.tight_layout()

            # Convert to ReportLab
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()

            return RLImage(buf, width=width*inch, height=height*inch)

        except Exception as e:
            logger.error(f"Failed to create comparison chart: {e}")
            plt.close()
            return None

    def create_competitive_matrix(
        self,
        brands: List[str],
        metrics: Dict[str, List[float]],
        width: float = 6.5,
        height: float = 5
    ) -> Optional[RLImage]:
        """
        Create heatmap matrix for competitive comparison

        Args:
            brands: List of brand names
            metrics: Dict of metric names to values list
            width: Width in inches
            height: Height in inches

        Returns:
            ReportLab Image object
        """
        if not brands or not metrics:
            logger.warning("No data for competitive matrix")
            return None

        try:
            import pandas as pd

            # Create DataFrame
            df = pd.DataFrame(metrics, index=brands)

            # Create heatmap
            fig, ax = plt.subplots(figsize=(width, height))
            sns.heatmap(df, annot=True, fmt='.1f', cmap='RdYlGn',
                       linewidths=0.5, ax=ax, cbar_kws={'label': 'Score'})

            ax.set_title('Competitive Performance Matrix', fontsize=14, fontweight='bold')
            plt.tight_layout()

            # Convert to ReportLab
            buf = BytesIO()
            plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
            buf.seek(0)
            plt.close()

            return RLImage(buf, width=width*inch, height=height*inch)

        except Exception as e:
            logger.error(f"Failed to create competitive matrix: {e}")
            plt.close()
            return None
