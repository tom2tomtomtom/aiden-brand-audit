"""
Content Quality Validation Service

This service validates analysis content to prevent fake, placeholder, 
or low-quality content from reaching brand audit reports.
"""

import logging
import re
from typing import Dict, Any, List, Tuple, Optional
from datetime import datetime


class ContentQualityService:
    """Service for validating content quality before report generation"""
    
    def __init__(self):
        self.logger = logging.getLogger(__name__)
        
        # Patterns that indicate fake or placeholder content
        self.fake_content_patterns = [
            r'brand analysis will show',
            r'analysis will reveal',
            r'will be generated when',
            r'placeholder content',
            r'generic template',
            r'sample analysis',
            r'example content',
            r'to be determined',
            r'\[insert.*\]',
            r'TBD',
            r'coming soon',
            r'under development',
            r'will be available',
            r'analysis pending'
        ]
        
        # Patterns that indicate generic content
        self.generic_content_patterns = [
            r'strong brand foundation',
            r'opportunities for growth',
            r'competitive landscape presents',
            r'customer engagement metrics show',
            r'digital transformation initiatives',
            r'market expansion potential',
            r'brand consistency across channels'
        ]
        
        # Minimum content quality thresholds
        self.min_content_length = 100
        self.min_brand_mentions = 2
        self.max_generic_score = 0.3
        
    def validate_analysis_data(self, brand_name: str, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """Validate complete analysis data for quality and authenticity"""
        
        validation_result = {
            "is_valid": True,
            "quality_score": 1.0,
            "issues": [],
            "recommendations": [],
            "validated_at": datetime.utcnow().isoformat()
        }
        
        # Validate LLM analysis content
        llm_analysis = analysis_data.get('llm_analysis', {})
        if llm_analysis:
            llm_validation = self.validate_llm_content(brand_name, llm_analysis)
            if not llm_validation["is_valid"]:
                validation_result["is_valid"] = False
                validation_result["issues"].extend(llm_validation["issues"])
                validation_result["quality_score"] *= 0.5
        
        # Validate metrics for fake scores
        key_metrics = analysis_data.get('key_metrics', {})
        if key_metrics:
            metrics_validation = self.validate_metrics(key_metrics)
            if not metrics_validation["is_valid"]:
                validation_result["issues"].extend(metrics_validation["issues"])
                validation_result["quality_score"] *= 0.7
        
        # Validate actionable insights
        insights = analysis_data.get('actionable_insights', [])
        if insights:
            insights_validation = self.validate_insights(brand_name, insights)
            if not insights_validation["is_valid"]:
                validation_result["issues"].extend(insights_validation["issues"])
                validation_result["quality_score"] *= 0.8
        
        # Validate data sources
        data_sources = analysis_data.get('data_sources', {})
        sources_validation = self.validate_data_sources(data_sources)
        if not sources_validation["is_valid"]:
            validation_result["issues"].extend(sources_validation["issues"])
            validation_result["quality_score"] *= 0.6
        
        # Generate recommendations based on validation results
        if not validation_result["is_valid"] or validation_result["quality_score"] < 0.7:
            validation_result["recommendations"] = self.generate_quality_recommendations(
                brand_name, validation_result["issues"]
            )
        
        self.logger.info(f"Content validation for {brand_name}: Quality score {validation_result['quality_score']:.2f}")
        
        return validation_result
    
    def validate_llm_content(self, brand_name: str, llm_content: Dict[str, Any]) -> Dict[str, Any]:
        """Validate LLM-generated content for quality and authenticity"""
        
        validation = {
            "is_valid": True,
            "issues": [],
            "content_quality": "high"
        }
        
        # Extract text content from various LLM response formats
        text_content = ""
        if isinstance(llm_content, dict):
            if 'insights' in llm_content:
                text_content = str(llm_content['insights'])
            elif 'analysis' in llm_content:
                text_content = str(llm_content['analysis'])
            elif 'content' in llm_content:
                text_content = str(llm_content['content'])
        elif isinstance(llm_content, str):
            text_content = llm_content
        
        if not text_content or len(text_content.strip()) < self.min_content_length:
            validation["is_valid"] = False
            validation["issues"].append("Insufficient content length")
            validation["content_quality"] = "low"
            return validation
        
        # Check for fake content patterns
        fake_content_score = self.calculate_fake_content_score(text_content)
        if fake_content_score > 0.2:
            validation["is_valid"] = False
            validation["issues"].append(f"High fake content score: {fake_content_score:.2f}")
            validation["content_quality"] = "fake"
        
        # Check for generic content
        generic_score = self.calculate_generic_content_score(text_content)
        if generic_score > self.max_generic_score:
            validation["issues"].append(f"High generic content score: {generic_score:.2f}")
            validation["content_quality"] = "generic"
        
        # Check brand-specific content
        brand_mentions = self.count_brand_mentions(brand_name, text_content)
        if brand_mentions < self.min_brand_mentions and len(text_content) > 500:
            validation["issues"].append(f"Insufficient brand-specific content: {brand_mentions} mentions")
        
        return validation
    
    def validate_metrics(self, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """Validate metrics for fake or unrealistic values"""
        
        validation = {
            "is_valid": True,
            "issues": []
        }
        
        # Check for suspiciously perfect scores
        score_fields = ['overall_score', 'visual_score', 'market_score', 'sentiment_score']
        perfect_scores = 0
        
        for field in score_fields:
            if field in metrics:
                score = metrics[field]
                if isinstance(score, (int, float)):
                    if score == 100:
                        perfect_scores += 1
                    elif score > 0 and score < 10:  # Suspiciously low
                        validation["issues"].append(f"Unrealistic low score for {field}: {score}")
                    elif score > 95:  # Suspiciously high
                        validation["issues"].append(f"Suspiciously high score for {field}: {score}")
        
        # Too many perfect scores is suspicious
        if perfect_scores > 2:
            validation["is_valid"] = False
            validation["issues"].append(f"Too many perfect scores: {perfect_scores}")
        
        # Check for all zero scores (indicates no real data)
        all_zeros = all(metrics.get(field, 0) == 0 for field in score_fields)
        if all_zeros:
            validation["issues"].append("All metrics are zero - no real data available")
        
        return validation
    
    def validate_insights(self, brand_name: str, insights: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Validate actionable insights for quality and specificity"""
        
        validation = {
            "is_valid": True,
            "issues": []
        }
        
        if not insights:
            validation["issues"].append("No actionable insights provided")
            return validation
        
        generic_insights = 0
        
        for insight in insights:
            finding = insight.get('finding', '')
            recommendation = insight.get('recommendation', '')
            
            # Check for generic insights
            if self.is_generic_insight(finding) or self.is_generic_insight(recommendation):
                generic_insights += 1
            
            # Check for brand specificity
            if brand_name.lower() not in finding.lower() and brand_name.lower() not in recommendation.lower():
                if len(insights) < 3:  # Only flag if there are few insights
                    validation["issues"].append(f"Non-specific insight: {finding[:50]}...")
        
        if generic_insights > len(insights) * 0.7:  # More than 70% generic
            validation["is_valid"] = False
            validation["issues"].append(f"Too many generic insights: {generic_insights}/{len(insights)}")
        
        return validation
    
    def validate_data_sources(self, data_sources: Dict[str, Any]) -> Dict[str, Any]:
        """Validate data sources for authenticity"""
        
        validation = {
            "is_valid": True,
            "issues": []
        }
        
        if not data_sources:
            validation["issues"].append("No data source information available")
            return validation
        
        # Check if any data sources were successful
        successful_sources = sum(1 for status in data_sources.values() if status)
        total_sources = len(data_sources)
        
        if successful_sources == 0:
            validation["issues"].append("No successful data sources - limited analysis capability")
        elif successful_sources < total_sources * 0.3:  # Less than 30% success
            validation["issues"].append(f"Low data source success rate: {successful_sources}/{total_sources}")
        
        return validation
    
    def calculate_fake_content_score(self, text: str) -> float:
        """Calculate score indicating likelihood of fake content"""
        
        text_lower = text.lower()
        fake_matches = 0
        
        for pattern in self.fake_content_patterns:
            matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
            fake_matches += matches
        
        # Normalize by text length
        fake_score = fake_matches / max(len(text.split()), 1)
        return min(fake_score * 10, 1.0)  # Cap at 1.0
    
    def calculate_generic_content_score(self, text: str) -> float:
        """Calculate score indicating level of generic content"""
        
        text_lower = text.lower()
        generic_matches = 0
        
        for pattern in self.generic_content_patterns:
            matches = len(re.findall(pattern, text_lower, re.IGNORECASE))
            generic_matches += matches
        
        # Normalize by text length
        generic_score = generic_matches / max(len(text.split()), 1)
        return min(generic_score * 5, 1.0)  # Cap at 1.0
    
    def count_brand_mentions(self, brand_name: str, text: str) -> int:
        """Count mentions of the brand name in text"""
        return text.lower().count(brand_name.lower())
    
    def is_generic_insight(self, text: str) -> bool:
        """Check if an insight is generic"""
        generic_phrases = [
            "improve brand consistency",
            "enhance digital presence",
            "strengthen competitive position",
            "optimize customer experience",
            "increase market share",
            "develop brand awareness"
        ]
        
        text_lower = text.lower()
        return any(phrase in text_lower for phrase in generic_phrases)
    
    def generate_quality_recommendations(self, brand_name: str, issues: List[str]) -> List[str]:
        """Generate recommendations for improving content quality"""
        
        recommendations = [
            f"For comprehensive {brand_name} brand analysis, consider professional consulting services",
            f"Implement primary market research for {brand_name}-specific insights",
            f"Establish ongoing brand monitoring systems for {brand_name}",
            "Ensure API connectivity for real-time data access",
            "Validate all analysis results with internal brand knowledge"
        ]
        
        # Add specific recommendations based on issues
        if any("fake content" in issue for issue in issues):
            recommendations.append("Eliminate automated content generation that produces placeholder text")
        
        if any("generic" in issue for issue in issues):
            recommendations.append(f"Focus analysis specifically on {brand_name}'s unique market position")
        
        if any("data source" in issue for issue in issues):
            recommendations.append("Improve data source connectivity and validation")
        
        return recommendations
    
    def should_generate_report(self, validation_result: Dict[str, Any]) -> Tuple[bool, str]:
        """Determine if a report should be generated based on validation results"""
        
        quality_score = validation_result.get("quality_score", 0)
        is_valid = validation_result.get("is_valid", False)
        
        if quality_score >= 0.8 and is_valid:
            return True, "High quality analysis - report generation approved"
        elif quality_score >= 0.6:
            return True, "Acceptable quality with limitations - report generated with disclaimers"
        elif quality_score >= 0.4:
            return False, "Low quality analysis - professional consultation recommended"
        else:
            return False, "Insufficient data quality - report generation not recommended"


# Global instance
content_quality_service = ContentQualityService()