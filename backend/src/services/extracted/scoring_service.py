#!/usr/bin/env python3
"""
Scoring Service - Extracted from SimpleAnalyzer
Handles all brand health scoring, metrics calculation, and competitive positioning
"""
import logging
from typing import Dict, Any, Optional, List

# Configure logging
logger = logging.getLogger(__name__)

class ScoringService:
    """
    Service for calculating brand health scores, metrics, and competitive positioning.
    Provides consistent scoring algorithms across different analysis dimensions.
    """
    
    def __init__(self):
        """Initialize the Scoring Service."""
        logger.info("Scoring service initialized")
    
    def calculate_brand_health_score(
        self, 
        llm_content: str, 
        news_articles: int, 
        sentiment: Dict[str, Any], 
        brand_info: Dict[str, Any], 
        visual_data: Optional[Dict[str, Any]] = None
    ) -> int:
        """
        Calculate comprehensive brand health score (0-100).
        
        Args:
            llm_content: LLM analysis content for depth scoring
            news_articles: Number of news articles found
            sentiment: Sentiment analysis results
            brand_info: Brand information from APIs
            visual_data: Optional visual analysis data
            
        Returns:
            Brand health score from 0-100
        """
        try:
            score = 0
            
            # LLM analysis contribution (0-40 points)
            if llm_content and isinstance(llm_content, str):
                word_count = len(llm_content.split())
                if word_count > 1000:
                    score += 40  # Comprehensive analysis
                elif word_count > 500:
                    score += 30  # Good analysis
                elif word_count > 100:
                    score += 20  # Basic analysis
                else:
                    score += 10  # Minimal analysis
            
            # News and sentiment contribution (0-30 points)
            if news_articles > 0:
                # News volume (0-15 points)
                if news_articles >= 50:
                    score += 15
                elif news_articles >= 20:
                    score += 12
                elif news_articles >= 10:
                    score += 8
                else:
                    score += 5
                    
                # Sentiment analysis (0-15 points)
                sentiment_score = sentiment.get('compound', 0)
                if isinstance(sentiment_score, (int, float)):
                    if sentiment_score >= 0.5:
                        score += 15  # Very positive
                    elif sentiment_score >= 0.1:
                        score += 12  # Positive
                    elif sentiment_score >= -0.1:
                        score += 8   # Neutral
                    else:
                        score += 3   # Negative
            
            # Brand data contribution (0-20 points)
            if brand_info and isinstance(brand_info, dict):
                # Basic brand info available
                if brand_info.get('domain') or brand_info.get('name'):
                    score += 10
                
                # Social media presence
                if brand_info.get('social_media') or brand_info.get('links'):
                    score += 5
                    
                # Logo/visual identity available
                if brand_info.get('logo') or brand_info.get('logos'):
                    score += 5
            
            # Visual data contribution (0-10 points)
            if visual_data and isinstance(visual_data, dict):
                colors_found = len(visual_data.get('color_palette', {}).get('primary_colors', []))
                logos_found = len(visual_data.get('logos', []))
                
                if colors_found > 0 and logos_found > 0:
                    score += 10  # Complete visual profile
                elif colors_found > 0 or logos_found > 0:
                    score += 5   # Partial visual profile
            
            # Ensure score is within bounds
            score = max(0, min(100, score))
            
            logger.info(f"Calculated brand health score: {score}/100")
            return score
            
        except Exception as e:
            logger.error(f"Error calculating brand health score: {e}")
            return 50  # Return neutral score on error

    def calculate_competitive_positioning_score(self, llm_analysis: str) -> int:
        """
        Calculate competitive positioning score from LLM analysis depth.
        
        Args:
            llm_analysis: LLM analysis text to evaluate
            
        Returns:
            Competitive positioning score (0-100)
        """
        if not llm_analysis or not isinstance(llm_analysis, str):
            return 0
            
        score = 0
        word_count = len(llm_analysis.split())
        
        # Base score from content length
        if word_count > 1500:
            score += 30
        elif word_count > 1000:
            score += 25
        elif word_count > 500:
            score += 20
        else:
            score += 10
            
        # Bonus for competitive keywords
        competitive_keywords = [
            'competitor', 'competition', 'market share', 'positioning',
            'differentiation', 'advantage', 'threat', 'opportunity'
        ]
        
        found_keywords = sum(1 for keyword in competitive_keywords 
                           if keyword.lower() in llm_analysis.lower())
        score += min(found_keywords * 5, 30)  # Max 30 bonus points
        
        # Bonus for strategic depth indicators
        strategy_indicators = [
            'strategic', 'market', 'growth', 'innovation', 'brand equity',
            'customer', 'revenue', 'investment', 'partnership'
        ]
        
        found_indicators = sum(1 for indicator in strategy_indicators 
                             if indicator.lower() in llm_analysis.lower())
        score += min(found_indicators * 2, 20)  # Max 20 bonus points
        
        # Quality multiplier based on comprehensive sections
        if 'executive summary' in llm_analysis.lower():
            score = int(score * 1.1)
        if 'recommendations' in llm_analysis.lower():
            score = int(score * 1.1)
            
        return max(0, min(100, score))

    def calculate_visual_score(self, brand_data: Dict[str, Any], primary_colors: List[str]) -> int:
        """
        Calculate visual brand consistency score.
        
        Args:
            brand_data: Brand data containing visual elements
            primary_colors: List of primary brand colors
            
        Returns:
            Visual consistency score (0-100)
        """
        score = 0
        
        # Logo availability (0-40 points)
        logos = brand_data.get('logos', [])
        if logos:
            if len(logos) >= 3:
                score += 40  # Multiple logo variants
            elif len(logos) >= 2:
                score += 30  # Some variants
            else:
                score += 20  # Basic logo
                
        # Color palette (0-30 points)
        if primary_colors:
            if len(primary_colors) >= 3:
                score += 30  # Full color palette
            elif len(primary_colors) >= 2:
                score += 20  # Limited palette
            else:
                score += 10  # Minimal colors
                
        # Brand consistency indicators (0-30 points)
        if brand_data.get('icon'):
            score += 10
        if brand_data.get('claimed'):
            score += 10  # Verified brand
        if brand_data.get('description'):
            score += 10  # Brand description available
            
        return max(0, min(100, score))

    def calculate_market_presence_score(self, total_articles: int, sentiment_score: float) -> int:
        """
        Calculate market presence score based on media coverage and sentiment.
        
        Args:
            total_articles: Number of news articles found
            sentiment_score: Average sentiment score (-1 to 1)
            
        Returns:
            Market presence score (0-100)
        """
        score = 0
        
        # Media coverage volume (0-60 points)
        if total_articles >= 100:
            score += 60  # Excellent coverage
        elif total_articles >= 50:
            score += 45  # Good coverage
        elif total_articles >= 20:
            score += 30  # Moderate coverage
        elif total_articles >= 5:
            score += 15  # Limited coverage
        else:
            score += 5   # Minimal coverage
            
        # Sentiment quality (0-40 points)
        if sentiment_score >= 0.5:
            score += 40  # Very positive sentiment
        elif sentiment_score >= 0.2:
            score += 30  # Positive sentiment
        elif sentiment_score >= -0.1:
            score += 20  # Neutral sentiment
        elif sentiment_score >= -0.3:
            score += 10  # Negative sentiment
        else:
            score += 0   # Very negative sentiment
            
        return max(0, min(100, score))

    def aggregate_metrics(
        self, 
        overall_score: int, 
        sentiment: Dict[str, Any], 
        brand_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Aggregate various metrics for dashboard display.
        
        Args:
            overall_score: Overall brand health score
            sentiment: Sentiment analysis results
            brand_info: Brand information data
            
        Returns:
            Dict containing aggregated metrics
        """
        try:
            metrics = {
                "brand_health_score": overall_score,
                "health_rating": self._get_health_rating(overall_score),
                "market_sentiment": self._format_sentiment(sentiment),
                "brand_visibility": self._calculate_visibility(brand_info),
                "competitive_strength": self._estimate_competitive_strength(overall_score),
                "growth_potential": self._estimate_growth_potential(overall_score, sentiment),
                "risk_factors": self._identify_risk_factors(overall_score, sentiment)
            }
            
            return metrics
            
        except Exception as e:
            logger.error(f"Error aggregating metrics: {e}")
            return {
                "brand_health_score": overall_score,
                "health_rating": "Unknown",
                "error": str(e)
            }

    def _get_health_rating(self, score: int) -> str:
        """Convert numeric score to health rating."""
        if score >= 85:
            return "Excellent"
        elif score >= 70:
            return "Good"
        elif score >= 55:
            return "Moderate"
        elif score >= 40:
            return "Fair"
        else:
            return "Needs Improvement"

    def _format_sentiment(self, sentiment: Dict[str, Any]) -> Dict[str, Any]:
        """Format sentiment data for display."""
        if not sentiment:
            return {"status": "Unknown", "score": 0}
            
        compound = sentiment.get('compound', 0)
        if compound >= 0.5:
            status = "Very Positive"
        elif compound >= 0.1:
            status = "Positive"
        elif compound >= -0.1:
            status = "Neutral"
        elif compound >= -0.5:
            status = "Negative"
        else:
            status = "Very Negative"
            
        return {
            "status": status,
            "score": round(compound, 2),
            "positive": sentiment.get('pos', 0),
            "neutral": sentiment.get('neu', 0),
            "negative": sentiment.get('neg', 0)
        }

    def _calculate_visibility(self, brand_info: Dict[str, Any]) -> str:
        """Calculate brand visibility level."""
        if not brand_info:
            return "Low"
            
        visibility_indicators = 0
        
        if brand_info.get('claimed'):
            visibility_indicators += 2
        if brand_info.get('logo'):
            visibility_indicators += 1
        if brand_info.get('social_media'):
            visibility_indicators += 1
        if brand_info.get('description'):
            visibility_indicators += 1
            
        if visibility_indicators >= 4:
            return "High"
        elif visibility_indicators >= 2:
            return "Medium"
        else:
            return "Low"

    def _estimate_competitive_strength(self, overall_score: int) -> str:
        """Estimate competitive strength based on overall score."""
        if overall_score >= 75:
            return "Strong"
        elif overall_score >= 50:
            return "Moderate"
        else:
            return "Weak"

    def _estimate_growth_potential(self, overall_score: int, sentiment: Dict[str, Any]) -> str:
        """Estimate growth potential based on score and sentiment."""
        sentiment_score = sentiment.get('compound', 0) if sentiment else 0
        
        combined_indicator = (overall_score / 100) + sentiment_score
        
        if combined_indicator >= 1.2:
            return "High"
        elif combined_indicator >= 0.8:
            return "Medium"
        else:
            return "Limited"

    def _identify_risk_factors(self, overall_score: int, sentiment: Dict[str, Any]) -> List[str]:
        """Identify potential risk factors."""
        risks = []
        
        if overall_score < 40:
            risks.append("Low brand health score")
            
        sentiment_score = sentiment.get('compound', 0) if sentiment else 0
        if sentiment_score < -0.2:
            risks.append("Negative sentiment trend")
            
        if overall_score < 60 and sentiment_score < 0:
            risks.append("Combined low performance and negative perception")
            
        return risks if risks else ["No significant risks identified"]