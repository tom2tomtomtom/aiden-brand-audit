"""
Strategic Analyzer - AI-powered brand intelligence using Claude
Generates executive-grade competitive analysis and strategic insights
"""

import logging
import json
from typing import Dict, List, Any
from anthropic import Anthropic
from config import config

logger = logging.getLogger(__name__)


class StrategicAnalyzer:
    """Generate strategic brand analysis using Claude AI"""

    def __init__(self, api_key: str = None):
        """
        Initialize strategic analyzer

        Args:
            api_key: Anthropic API key (defaults to config)
        """
        self.api_key = api_key or config.ANTHROPIC_API_KEY
        if not self.api_key:
            raise ValueError("ANTHROPIC_API_KEY is required")

        self.client = Anthropic(api_key=self.api_key)
        self.model = config.CLAUDE_MODEL
        self.max_tokens = config.CLAUDE_MAX_TOKENS

    def analyze_competitive_landscape(self, brands_data: List[Dict]) -> Dict:
        """
        Analyze competitive landscape across multiple brands

        Args:
            brands_data: List of brand data dictionaries containing:
                - name: Brand name
                - logos: Logo data
                - colors: Color palette data
                - ads: Advertising data
                - screenshots: Screenshot file paths

        Returns:
            {
                'executive_summary': {...},
                'visual_dna_comparison': {...},
                'creative_dna_comparison': {...},
                'strategic_synthesis': {...}
            }
        """
        logger.info(f"Analyzing competitive landscape for {len(brands_data)} brands")

        # Prepare data summary for Claude
        data_summary = self._prepare_data_summary(brands_data)

        # Build prompt
        prompt = self._build_analysis_prompt(brands_data, data_summary)

        try:
            # Call Claude API
            response = self.client.messages.create(
                model=self.model,
                max_tokens=self.max_tokens,
                messages=[{
                    "role": "user",
                    "content": prompt
                }]
            )

            # Parse JSON response
            analysis_text = response.content[0].text

            # Extract JSON from response (Claude might wrap it in markdown)
            analysis = self._extract_json(analysis_text)

            logger.info("✅ Strategic analysis complete")
            return analysis

        except Exception as e:
            logger.error(f"Failed to generate strategic analysis: {e}")
            return self._empty_result(error=str(e))

    def _prepare_data_summary(self, brands_data: List[Dict]) -> Dict:
        """Prepare concise data summary for Claude"""
        summary = {
            'total_brands': len(brands_data),
            'brands': []
        }

        for brand in brands_data:
            brand_summary = {
                'name': brand['name'],
                'logo_count': len(brand.get('logos', {}).get('logo_variants', [])),
                'color_count': len(brand.get('colors', {}).get('primary_colors', [])),
                'ad_count': len(brand.get('ads', [])),
                'screenshot_count': len(brand.get('screenshots', [])),
                'primary_colors': brand.get('colors', {}).get('primary_colors', []),
                'ad_themes': self._extract_ad_themes(brand.get('ads', []))
            }
            summary['brands'].append(brand_summary)

        return summary

    def _extract_ad_themes(self, ads: List[Dict]) -> List[str]:
        """Extract themes from ad copy"""
        themes = []
        for ad in ads[:10]:  # Sample first 10 ads
            ad_text = ad.get('ad_text', '')
            if ad_text:
                themes.append(ad_text[:200])  # First 200 chars
        return themes

    def _build_analysis_prompt(self, brands_data: List[Dict], summary: Dict) -> str:
        """Build comprehensive analysis prompt for Claude"""
        brand_names = [b['name'] for b in brands_data]

        prompt = f"""You are analyzing comprehensive brand intelligence for {summary['total_brands']} brands: {', '.join(brand_names)}.

DATA AVAILABLE:
{json.dumps(summary, indent=2)}

TASK: Create strategic competitive analysis in JSON format.

REQUIREMENTS:
1. **Executive Summary**: 2-3 paragraphs of strategic insights with key findings and recommendations
2. **Visual DNA Comparison**: Analyze color strategies, visual differentiation, shared patterns
3. **Creative DNA Comparison**: Analyze campaign themes, messaging strategies, platform preferences
4. **Strategic Synthesis**: Competitive advantages, vulnerabilities, white space opportunities

Return ONLY valid JSON in this exact structure:

{{
  "executive_summary": {{
    "overview": "2-3 paragraph strategic overview with key insights",
    "key_findings": [
      "Finding 1 with specific evidence",
      "Finding 2 with specific evidence",
      "Finding 3 with specific evidence"
    ],
    "strategic_implications": "1-2 paragraphs on market implications"
  }},

  "visual_dna_comparison": {{
    "color_strategies": {{
      "{brand_names[0]}": "Analysis of color strategy with specific colors mentioned",
      {', '.join([f'"{name}": "Analysis for {name}"' for name in brand_names[1:]])}
    }},
    "visual_differentiation": "How brands differentiate visually",
    "shared_patterns": ["Pattern 1", "Pattern 2"],
    "unique_elements": {{
      "{brand_names[0]}": ["Unique element 1", "Unique element 2"],
      {', '.join([f'"{name}": ["Element 1", "Element 2"]' for name in brand_names[1:]])}
    }}
  }},

  "creative_dna_comparison": {{
    "messaging_themes": {{
      "{brand_names[0]}": ["Theme 1", "Theme 2", "Theme 3"],
      {', '.join([f'"{name}": ["Theme 1", "Theme 2"]' for name in brand_names[1:]])}
    }},
    "tone_and_voice": {{
      "{brand_names[0]}": "Description of brand voice",
      {', '.join([f'"{name}": "Description"' for name in brand_names[1:]])}
    }},
    "creative_territories": {{
      "{brand_names[0]}": "What creative space they own",
      {', '.join([f'"{name}": "Creative territory"' for name in brand_names[1:]])}
    }}
  }},

  "strategic_synthesis": {{
    "competitive_positioning": {{
      "{brand_names[0]}": {{
        "strengths": ["Strength 1", "Strength 2"],
        "weaknesses": ["Weakness 1", "Weakness 2"],
        "market_position": "Description of market position"
      }},
      {', '.join([f'"{name}": {{"strengths": ["S1"], "weaknesses": ["W1"], "market_position": "Position"}}' for name in brand_names[1:]])}
    }},
    "white_space_opportunities": [
      "Opportunity 1 with reasoning",
      "Opportunity 2 with reasoning",
      "Opportunity 3 with reasoning"
    ],
    "recommended_actions": [
      {{
        "action": "Specific action recommendation",
        "rationale": "Why this matters",
        "expected_impact": "Projected outcome"
      }}
    ]
  }}
}}

CRITICAL:
- Return ONLY valid JSON (no markdown, no explanations)
- Back every insight with specific evidence from the data
- Be brutally honest about competitive dynamics
- Focus on actionable strategic insights
"""
        return prompt

    def _extract_json(self, text: str) -> Dict:
        """Extract JSON from Claude response (handles markdown wrapping)"""
        # Remove markdown code blocks if present
        text = text.strip()
        if text.startswith('```json'):
            text = text[7:]
        if text.startswith('```'):
            text = text[3:]
        if text.endswith('```'):
            text = text[:-3]

        text = text.strip()

        try:
            return json.loads(text)
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {e}")
            logger.error(f"Response text: {text[:500]}")
            return self._empty_result(error="Failed to parse Claude response")

    def _empty_result(self, error: str = None) -> Dict:
        """Return empty result structure"""
        return {
            'executive_summary': {
                'overview': 'Analysis failed',
                'key_findings': [],
                'strategic_implications': ''
            },
            'visual_dna_comparison': {},
            'creative_dna_comparison': {},
            'strategic_synthesis': {},
            'error': error
        }
