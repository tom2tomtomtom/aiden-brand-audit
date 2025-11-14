"""
Visual Report Generator - Executive-grade PDF reports
Creates comprehensive 30-40 page brand DNA analysis reports
"""

import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Any

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    KeepTogether, Table, TableStyle
)
from reportlab.lib import colors

from report.components import ReportComponents
from config import config

logger = logging.getLogger(__name__)


class BrandDNAReport:
    """Complete PDF report generator for brand DNA analysis"""

    def __init__(self, brands_data: List[Dict], analysis: Dict, output_path: Path = None):
        """
        Initialize report generator

        Args:
            brands_data: List of brand data dictionaries
            analysis: Strategic analysis from Claude
            output_path: Output file path (auto-generated if None)
        """
        self.brands_data = brands_data
        self.analysis = analysis

        # Generate output path if not provided
        if output_path is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            brand_names = "_".join([b['name'] for b in brands_data[:2]])
            filename = f"Brand_DNA_Report_{brand_names}_{timestamp}.pdf"
            output_path = config.REPORTS_DIR / filename

        self.output_path = output_path
        self.doc = SimpleDocTemplate(
            str(output_path),
            pagesize=letter,
            topMargin=config.PDF_MARGINS['top'] * inch,
            bottomMargin=config.PDF_MARGINS['bottom'] * inch,
            leftMargin=config.PDF_MARGINS['left'] * inch,
            rightMargin=config.PDF_MARGINS['right'] * inch
        )

        self.story = []
        self.styles = getSampleStyleSheet()
        self.components = ReportComponents()

        # Custom styles
        self._setup_custom_styles()

    def _setup_custom_styles(self):
        """Create custom paragraph styles"""
        # Title style
        self.styles.add(ParagraphStyle(
            name='CustomTitle',
            parent=self.styles['Title'],
            fontSize=24,
            textColor=colors.HexColor('#1a1a1a'),
            spaceAfter=30,
            alignment=TA_CENTER
        ))

        # Section header
        self.styles.add(ParagraphStyle(
            name='SectionHeader',
            parent=self.styles['Heading1'],
            fontSize=18,
            textColor=colors.HexColor('#2c3e50'),
            spaceAfter=12,
            spaceBefore=20,
            borderWidth=2,
            borderColor=colors.HexColor('#3498db'),
            borderPadding=5
        ))

        # Subsection header
        self.styles.add(ParagraphStyle(
            name='SubsectionHeader',
            parent=self.styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#34495e'),
            spaceAfter=8,
            spaceBefore=12
        ))

        # Body justified
        self.styles.add(ParagraphStyle(
            name='BodyJustified',
            parent=self.styles['BodyText'],
            fontSize=11,
            alignment=TA_JUSTIFY,
            spaceAfter=12
        ))

    def generate(self) -> str:
        """
        Build complete PDF report

        Returns:
            Path to generated PDF file
        """
        logger.info(f"Generating PDF report for {len(self.brands_data)} brands")

        try:
            # Build report sections
            self._add_cover_page()
            self._add_table_of_contents()
            self._add_executive_summary()
            self._add_visual_dna_section()
            self._add_creative_dna_section()
            self._add_strategic_synthesis()
            self._add_appendix()

            # Build PDF
            self.doc.build(self.story)

            logger.info(f"✅ Report generated: {self.output_path}")
            return str(self.output_path)

        except Exception as e:
            logger.error(f"Failed to generate report: {e}")
            raise

    def _add_cover_page(self):
        """Create professional cover page"""
        brand_names = " vs ".join([b['name'] for b in self.brands_data])

        # Title
        title = Paragraph(
            f"<b>BRAND DNA ANALYSIS</b>",
            self.styles['CustomTitle']
        )
        self.story.append(title)
        self.story.append(Spacer(1, 0.3*inch))

        # Subtitle
        subtitle = Paragraph(
            f"<b>{brand_names}</b><br/>Competitive Brand Intelligence Report",
            self.styles['Heading2']
        )
        self.story.append(subtitle)
        self.story.append(Spacer(1, 0.5*inch))

        # Date
        date_para = Paragraph(
            f"Generated: {datetime.now().strftime('%B %d, %Y')}",
            self.styles['Normal']
        )
        self.story.append(date_para)
        self.story.append(Spacer(1, 0.3*inch))

        # Key metrics summary
        metrics_data = [
            ['Brands Analyzed', str(len(self.brands_data))],
            ['Total Ads Reviewed', str(sum(len(b.get('ads', [])) for b in self.brands_data))],
            ['Screenshots Captured', str(sum(len(b.get('screenshots', [])) for b in self.brands_data))],
            ['Color Palettes Extracted', str(len(self.brands_data))]
        ]

        metrics_table = Table(metrics_data, colWidths=[3*inch, 2*inch])
        metrics_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#ecf0f1')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#2c3e50')),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.white)
        ]))

        self.story.append(metrics_table)
        self.story.append(PageBreak())

    def _add_table_of_contents(self):
        """Add table of contents"""
        self.story.append(Paragraph("TABLE OF CONTENTS", self.styles['SectionHeader']))
        self.story.append(Spacer(1, 0.2*inch))

        toc_items = [
            "1. Executive Summary",
            "2. Visual DNA Comparison",
            "3. Creative DNA Analysis",
            "4. Strategic Synthesis",
            "5. Appendix: Data Sources"
        ]

        for item in toc_items:
            self.story.append(Paragraph(item, self.styles['Normal']))
            self.story.append(Spacer(1, 0.1*inch))

        self.story.append(PageBreak())

    def _add_executive_summary(self):
        """Add executive summary section"""
        self.story.append(Paragraph("1. EXECUTIVE SUMMARY", self.styles['SectionHeader']))
        self.story.append(Spacer(1, 0.2*inch))

        summary = self.analysis.get('executive_summary', {})

        # Overview
        if summary.get('overview'):
            self.story.append(Paragraph(
                summary['overview'],
                self.styles['BodyJustified']
            ))
            self.story.append(Spacer(1, 0.2*inch))

        # Key Findings
        self.story.append(Paragraph("Key Findings", self.styles['SubsectionHeader']))

        findings = summary.get('key_findings', [])
        for idx, finding in enumerate(findings, 1):
            bullet = f"<b>{idx}.</b> {finding}"
            self.story.append(Paragraph(bullet, self.styles['BodyText']))
            self.story.append(Spacer(1, 0.1*inch))

        # Strategic Implications
        if summary.get('strategic_implications'):
            self.story.append(Spacer(1, 0.2*inch))
            self.story.append(Paragraph("Strategic Implications", self.styles['SubsectionHeader']))
            self.story.append(Paragraph(
                summary['strategic_implications'],
                self.styles['BodyJustified']
            ))

        self.story.append(PageBreak())

    def _add_visual_dna_section(self):
        """Add visual DNA comparison section"""
        self.story.append(Paragraph("2. VISUAL DNA COMPARISON", self.styles['SectionHeader']))
        self.story.append(Spacer(1, 0.3*inch))

        for brand in self.brands_data:
            # Brand header
            self.story.append(Paragraph(
                f"<b>{brand['name']}</b>",
                self.styles['SubsectionHeader']
            ))
            self.story.append(Spacer(1, 0.2*inch))

            # Logo gallery
            logos = brand.get('logos', {})
            if logos.get('logo_variants'):
                # For now, use primary logo URL (in production, download first)
                pass

            # Color swatches
            colors_data = brand.get('colors', {})
            primary_colors = colors_data.get('primary_colors', [])
            if primary_colors:
                color_swatches = self.components.create_color_swatches(
                    brand['name'],
                    primary_colors
                )
                if color_swatches:
                    self.story.append(color_swatches)
                    self.story.append(Spacer(1, 0.3*inch))

            # Screenshot gallery
            screenshots = brand.get('screenshots', [])
            if screenshots:
                screenshot_gallery = self.components.create_screenshot_gallery(
                    screenshots,
                    title=f"{brand['name']} Ad Creatives"
                )
                if screenshot_gallery:
                    self.story.append(screenshot_gallery)

            self.story.append(Spacer(1, 0.4*inch))

        self.story.append(PageBreak())

    def _add_creative_dna_section(self):
        """Add creative DNA analysis section"""
        self.story.append(Paragraph("3. CREATIVE DNA ANALYSIS", self.styles['SectionHeader']))
        self.story.append(Spacer(1, 0.2*inch))

        creative_analysis = self.analysis.get('creative_dna_comparison', {})

        # Messaging themes
        themes = creative_analysis.get('messaging_themes', {})
        if themes:
            self.story.append(Paragraph("Messaging Themes", self.styles['SubsectionHeader']))
            for brand, brand_themes in themes.items():
                self.story.append(Paragraph(f"<b>{brand}:</b>", self.styles['BodyText']))
                for theme in brand_themes:
                    self.story.append(Paragraph(f"• {theme}", self.styles['BodyText']))
                self.story.append(Spacer(1, 0.1*inch))

        self.story.append(PageBreak())

    def _add_strategic_synthesis(self):
        """Add strategic synthesis section"""
        self.story.append(Paragraph("4. STRATEGIC SYNTHESIS", self.styles['SectionHeader']))
        self.story.append(Spacer(1, 0.2*inch))

        synthesis = self.analysis.get('strategic_synthesis', {})

        # White space opportunities
        opportunities = synthesis.get('white_space_opportunities', [])
        if opportunities:
            self.story.append(Paragraph("Market Opportunities", self.styles['SubsectionHeader']))
            for idx, opp in enumerate(opportunities, 1):
                self.story.append(Paragraph(f"<b>{idx}.</b> {opp}", self.styles['BodyText']))
                self.story.append(Spacer(1, 0.1*inch))

        self.story.append(PageBreak())

    def _add_appendix(self):
        """Add appendix with data sources"""
        self.story.append(Paragraph("5. APPENDIX: DATA SOURCES", self.styles['SectionHeader']))
        self.story.append(Spacer(1, 0.2*inch))

        sources = [
            "• Apify Website Logo Finder",
            "• Facebook Ad Library (via Apify)",
            "• Playwright Screenshot Automation",
            "• ColorThief Color Extraction",
            "• Claude AI Strategic Analysis"
        ]

        for source in sources:
            self.story.append(Paragraph(source, self.styles['BodyText']))
            self.story.append(Spacer(1, 0.05*inch))
