#!/usr/bin/env python3
"""
LLM Analysis Service - Extracted from SimpleAnalyzer
Handles all OpenRouter/Claude API interactions and LLM response processing
"""
import os
import re  
import requests
import time
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List

# Configure logging
logger = logging.getLogger(__name__)

class LLMAnalysisService:
    """
    Service for handling all LLM (Large Language Model) analysis operations.
    Manages OpenRouter API calls, prompt engineering, and response processing.
    """
    
    def __init__(self):
        """Initialize the LLM Analysis Service with API credentials."""
        self.openrouter_api_key = os.environ.get('OPENROUTER_API_KEY')
        if not self.openrouter_api_key:
            logger.warning("OpenRouter API key not found in environment variables")
    
    def call_llm_analysis(
        self, 
        brand_name: str, 
        analysis_id: Optional[str] = None, 
        analysis_storage: Optional[Dict[str, Any]] = None, 
        websocket_service: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Call LLM for comprehensive single-pass brand analysis with progress updates.
        
        Args:
            brand_name: Name of the brand to analyze
            analysis_id: Optional analysis identifier for progress tracking
            analysis_storage: Optional storage dict for progress updates
            websocket_service: Optional WebSocket service for real-time updates
            
        Returns:
            Dict containing analysis results or error information
        """
        if not self.openrouter_api_key:
            return {"error": "No OpenRouter API key"}

        def update_progress(step_num: int, total_steps: int, step_name: str):
            """Update progress for LLM analysis"""
            # Calculate stage progress (0-100% for LLM stage)
            stage_progress = int((step_num / total_steps) * 100)

            # Update WebSocket progress
            if websocket_service:
                websocket_service.emit_substep_update(analysis_id, step_name, stage_progress)

            # Update legacy storage
            if analysis_id and analysis_storage and analysis_id in analysis_storage:
                # LLM analysis is 50% of total progress (10% to 60%)
                llm_progress = 10 + (step_num / total_steps) * 50
                analysis_storage[analysis_id]["progress"] = int(llm_progress)
                analysis_storage[analysis_id]["current_step"] = f"LLM: {step_name}"
                logger.info(f"Progress: {int(llm_progress)}% - {step_name}")

        # OPTIMIZED: Single-pass comprehensive analysis to prevent hanging
        logger.info(f"Starting optimized single-pass analysis for {brand_name}")
        
        update_progress(0, 1, "Generating comprehensive brand analysis")

        # Single comprehensive prompt that covers all strategic areas
        comprehensive_prompt = f"""You are a world-class brand strategist and former McKinsey partner conducting a comprehensive strategic intelligence briefing for {brand_name}. This is for a multi-million dollar client pitch requiring consulting-grade analysis.

Write a detailed strategic analysis covering these key areas:

## EXECUTIVE SUMMARY & STRATEGIC CONTEXT (200-300 words)
- Key strategic findings and critical business insights
- Primary competitive advantages and vulnerabilities  
- Overall brand health assessment with specific reasoning
- Top 3 strategic recommendations with quantified impact

## COMPETITIVE INTELLIGENCE (200-300 words)  
- Top 3-5 direct competitors and positioning differentiation
- Market share trends and competitive threats/opportunities
- Recent strategic moves and marketing effectiveness comparison
- Specific competitive gaps and white space opportunities

## STRATEGIC CHALLENGES & GROWTH OPPORTUNITIES (200-300 words)
- Current business challenges with impact quantification
- High-priority growth opportunities (geographic, product, technology)
- Investment requirements and ROI projections for key initiatives
- Partnership opportunities and acquisition targets

## CULTURAL POSITION & STAKEHOLDER ANALYSIS (150-200 words)
- Brand role in cultural conversations and social impact initiatives
- Stakeholder relationships (employees, investors, media, community)
- Crisis management capabilities and reputation assessment
- ESG positioning and authenticity perception

## STRATEGIC RECOMMENDATIONS & ACTION PLAN (200-300 words)
- Immediate actions (0-90 days) with quick wins identified
- Strategic initiatives (3-12 months) with implementation roadmaps
- Long-term transformation goals (12-36 months) with success metrics
- Resource allocation priorities and risk mitigation strategies

Provide specific examples, metrics, and actionable insights throughout. Target 1,000-1,500 total words for comprehensive coverage."""

        try:
            # Single API call with timeout protection
            start_time = time.time()
            
            headers = {
                'Authorization': f'Bearer {self.openrouter_api_key}',
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://brand-audit-tool.com',
                'X-Title': 'Brand Audit Tool'
            }

            payload = {
                "model": "anthropic/claude-3-haiku",
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a world-class brand strategist providing consulting-grade analysis. Write comprehensive, specific insights with actionable recommendations."
                    },
                    {
                        "role": "user",
                        "content": comprehensive_prompt
                    }
                ],
                "max_tokens": 4000,
                "temperature": 0.3
            }

            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=60  # 60-second timeout to prevent hanging
            )
            
            end_time = time.time()
            duration = end_time - start_time

            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                usage = data.get('usage', {})
                word_count = len(content.split())
                
                update_progress(1, 1, "Analysis completed")
                
                logger.info(f"Single-pass LLM analysis completed in {duration:.2f}s")
                logger.info(f"Generated {word_count} words, {usage.get('total_tokens', 'unknown')} tokens")
                
                return {
                    "source": "llm_optimized",
                    "analysis": content,
                    "total_words": word_count,
                    "sections_completed": 1,
                    "sections_total": 1,
                    "generation_time": duration,
                    "tokens_used": usage.get('total_tokens', 0),
                    "success": True
                }
            else:
                error_msg = f"API Error {response.status_code}: {response.text}"
                logger.error(f"LLM API failed: {error_msg}")
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            error_msg = "LLM analysis timed out after 60 seconds"
            logger.error(error_msg)
            return {"error": error_msg}
        except Exception as e:
            error_msg = f"LLM analysis failed: {str(e)}"
            logger.error(error_msg)
            return {"error": error_msg}
    
    def call_llm_section(
        self, 
        brand_name: str, 
        section_name: str, 
        section_prompt: str, 
        min_words: int = 500
    ) -> Dict[str, Any]:
        """
        Call LLM for a specific section of brand analysis.
        
        Args:
            brand_name: Name of the brand to analyze
            section_name: Name of the section being generated
            section_prompt: Specific prompt for this section
            min_words: Minimum word count requirement
            
        Returns:
            Dict containing section results or error information
        """
        if not self.openrouter_api_key:
            return {"error": "No OpenRouter API key configured"}

        headers = {
            'Authorization': f'Bearer {self.openrouter_api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://brand-audit-tool.com',
            'X-Title': 'Brand Audit Tool'
        }

        payload = {
            "model": "anthropic/claude-3-haiku",
            "messages": [
                {
                    "role": "system",
                    "content": f"You are a world-class brand strategist and former McKinsey partner. Write a detailed {section_name} section for {brand_name} that is AT LEAST {min_words} words. This is for a multi-million dollar client pitch. Be extremely thorough, include specific metrics, examples, and actionable insights. Do not summarize - provide comprehensive detail."
                },
                {
                    "role": "user", 
                    "content": section_prompt
                }
            ],
            "max_tokens": 4000,
            "temperature": 0.2
        }

        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers=headers,
                json=payload,
                timeout=45
            )

            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                word_count = len(content.split())
                
                return {
                    "success": True,
                    "section": section_name,
                    "content": content,
                    "word_count": word_count,
                    "tokens_used": data.get('usage', {}).get('total_tokens', 0)
                }
            else:
                return {"error": f"LLM API failed: {response.status_code}"}

        except Exception as e:
            return {"error": f"LLM call failed: {str(e)}"}

    def parse_llm_sections(self, llm_analysis: str) -> Dict[str, str]:
        """
        Parse LLM analysis into structured sections for consulting report.
        
        Args:
            llm_analysis: Raw LLM analysis text
            
        Returns:
            Dict mapping section names to section content
        """
        sections = {}
        
        # Split by common section headers
        section_patterns = [
            r'#{1,3}\s*(EXECUTIVE SUMMARY|Executive Summary).*?(?=#{1,3}|\Z)',
            r'#{1,3}\s*(COMPETITIVE INTELLIGENCE|Competitive Intelligence).*?(?=#{1,3}|\Z)',
            r'#{1,3}\s*(STRATEGIC CHALLENGES|Strategic Challenges).*?(?=#{1,3}|\Z)',
            r'#{1,3}\s*(CULTURAL POSITION|Cultural Position).*?(?=#{1,3}|\Z)',
            r'#{1,3}\s*(STRATEGIC RECOMMENDATIONS|Strategic Recommendations).*?(?=#{1,3}|\Z)',
            r'#{1,3}\s*(MARKET POSITION|Market Position).*?(?=#{1,3}|\Z)',
            r'#{1,3}\s*(GROWTH OPPORTUNITIES|Growth Opportunities).*?(?=#{1,3}|\Z)'
        ]
        
        for pattern in section_patterns:
            matches = re.finditer(pattern, llm_analysis, re.DOTALL | re.IGNORECASE)
            for match in matches:
                section_text = match.group(0).strip()
                # Extract section name from header
                header_match = re.match(r'#{1,3}\s*([^#\n]+)', section_text)
                if header_match:
                    section_name = header_match.group(1).strip()
                    # Remove header from content
                    content = re.sub(r'^#{1,3}\s*[^#\n]+\n?', '', section_text).strip()
                    if content:
                        sections[section_name.upper()] = content
        
        # If no structured sections found, try to extract key content blocks
        if not sections and llm_analysis:
            # Look for content blocks separated by double newlines
            blocks = [block.strip() for block in llm_analysis.split('\n\n') if block.strip()]
            if blocks:
                sections['COMPREHENSIVE_ANALYSIS'] = '\n\n'.join(blocks)
        
        logger.info(f"Parsed {len(sections)} sections from LLM analysis")
        return sections

    def extract_colors_from_llm(self, llm_analysis: str, brand_name: str) -> List[str]:
        """
        Extract brand colors from LLM analysis - NO HARDCODED FALLBACKS.
        
        Args:
            llm_analysis: LLM analysis text to search for colors
            brand_name: Brand name for context
            
        Returns:
            List of hex color codes found in the analysis
        """
        colors = []
        
        # Look for hex colors in LLM analysis
        hex_pattern = r'#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})'
        hex_matches = re.findall(hex_pattern, llm_analysis)
        colors.extend([f"#{match}" for match in hex_matches])
        
        return colors[:5]  # Limit to 5 colors maximum

    def extract_list_from_llm(self, llm_analysis: str, keywords: List[str], fallback: List[str]) -> List[str]:
        """
        Extract lists from LLM analysis based on keywords.
        
        Args:
            llm_analysis: LLM analysis text to search
            keywords: Keywords to search for
            fallback: Fallback list if nothing found
            
        Returns:
            List of extracted items or fallback
        """
        items = []
        
        # Look for bullet points or numbered lists near keywords
        for keyword in keywords:
            pattern = rf'{keyword}.*?(?=\n\n|\Z)'
            matches = re.finditer(pattern, llm_analysis, re.DOTALL | re.IGNORECASE)
            
            for match in matches:
                text = match.group(0)
                # Extract bullet points or numbered items
                list_items = re.findall(r'[•\-\*]\s*([^\n]+)', text)
                items.extend([item.strip() for item in list_items])
                
                # Also look for numbered lists
                numbered_items = re.findall(r'\d+\.\s*([^\n]+)', text)
                items.extend([item.strip() for item in numbered_items])
        
        return items[:10] if items else fallback  # Limit to 10 items