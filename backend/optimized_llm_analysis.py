#!/usr/bin/env python3
"""
Optimized LLM analysis function - single-pass approach to prevent hanging
"""

def get_optimized_llm_analysis_replacement():
    """Return the optimized LLM analysis function replacement code"""
    return '''        # OPTIMIZED: Single-pass comprehensive analysis to prevent hanging
        print(f"🚀 Starting optimized single-pass analysis for {brand_name}")
        
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
            import requests
            import time
            
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
                
                print(f"✅ Single-pass LLM analysis completed in {duration:.2f}s")
                print(f"📝 Generated {word_count} words, {usage.get('total_tokens', 'unknown')} tokens")
                
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
                print(f"❌ LLM API failed: {error_msg}")
                return {"error": error_msg}
                
        except requests.exceptions.Timeout:
            error_msg = "LLM analysis timed out after 60 seconds"
            print(f"❌ {error_msg}")
            return {"error": error_msg}
        except Exception as e:
            error_msg = f"LLM analysis failed: {str(e)}"
            print(f"❌ {error_msg}")
            return {"error": error_msg}'''

if __name__ == "__main__":
    print("Optimized LLM analysis replacement ready")