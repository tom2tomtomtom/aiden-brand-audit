#!/usr/bin/env python3
"""
Real Brand Audit Test - Tests actual API services and generates authentic reports
"""

import requests
import json
import time
import os
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_openrouter_api():
    """Test OpenRouter API directly"""
    print("\n🤖 TESTING OPENROUTER API")
    print("-" * 40)
    
    api_key = os.getenv('OPENROUTER_API_KEY')
    if not api_key:
        print("❌ OpenRouter API key not found")
        return False
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        test_data = {
            'model': 'anthropic/claude-3-haiku',
            'messages': [
                {
                    'role': 'user', 
                    'content': 'Analyze Apple as a brand. Provide 3 key brand attributes in JSON format: {"attributes": ["attr1", "attr2", "attr3"]}'
                }
            ],
            'max_tokens': 200
        }
        
        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=test_data,
            timeout=30
        )
        
        print(f"OpenRouter API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            content = data['choices'][0]['message']['content']
            print(f"✅ OpenRouter API working!")
            print(f"Sample response: {content[:100]}...")
            return True
        else:
            print(f"❌ OpenRouter API failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ OpenRouter API error: {e}")
        return False

def test_news_api():
    """Test News API directly"""
    print("\n📰 TESTING NEWS API")
    print("-" * 40)
    
    api_key = os.getenv('NEWS_API_KEY')
    if not api_key:
        print("❌ News API key not found")
        return False
    
    try:
        url = f"https://newsapi.org/v2/everything?q=Apple+brand&apiKey={api_key}&pageSize=5&sortBy=relevancy"
        
        response = requests.get(url, timeout=30)
        
        print(f"News API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            articles = data.get('articles', [])
            print(f"✅ News API working!")
            print(f"Found {len(articles)} articles about Apple")
            if articles:
                print(f"Sample headline: {articles[0]['title'][:80]}...")
            return True
        else:
            print(f"❌ News API failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ News API error: {e}")
        return False

def test_brandfetch_api():
    """Test BrandFetch API directly"""
    print("\n🎨 TESTING BRANDFETCH API")
    print("-" * 40)
    
    api_key = os.getenv('BRANDFETCH_API_KEY')
    if not api_key:
        print("❌ BrandFetch API key not found")
        return False
    
    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json'
        }
        
        # Search for Apple brand
        search_url = "https://api.brandfetch.io/v2/search/apple.com"
        
        response = requests.get(search_url, headers=headers, timeout=30)
        
        print(f"BrandFetch API Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ BrandFetch API working!")
            if isinstance(data, list) and len(data) > 0:
                brand_info = data[0]
                print(f"Brand found: {brand_info.get('name', 'Unknown')}")
                print(f"Domain: {brand_info.get('domain', 'Unknown')}")
            return True
        else:
            print(f"❌ BrandFetch API failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ BrandFetch API error: {e}")
        return False

def generate_real_brand_analysis():
    """Generate a real brand analysis using actual API calls"""
    print("\n🎯 GENERATING REAL BRAND ANALYSIS")
    print("-" * 40)
    
    company_name = "Apple"
    analysis_results = {
        "company_name": company_name,
        "analysis_timestamp": datetime.now().isoformat(),
        "data_sources": [],
        "brand_analysis": {},
        "news_analysis": {},
        "visual_analysis": {},
        "success": False
    }
    
    # Test 1: Brand Analysis via OpenRouter
    print("1. Generating brand perception analysis...")
    api_key = os.getenv('OPENROUTER_API_KEY')
    if api_key:
        try:
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json'
            }
            
            brand_prompt = f"""
            Analyze {company_name} as a brand. Provide a comprehensive analysis in JSON format with:
            {{
                "brand_strength": <score 1-100>,
                "market_position": "<leader/challenger/follower>",
                "key_attributes": ["attr1", "attr2", "attr3"],
                "competitive_advantages": ["adv1", "adv2"],
                "brand_sentiment": "<positive/neutral/negative>",
                "strategic_recommendations": ["rec1", "rec2", "rec3"]
            }}
            """
            
            response = requests.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json={
                    'model': 'anthropic/claude-3-haiku',
                    'messages': [{'role': 'user', 'content': brand_prompt}],
                    'max_tokens': 500
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                content = data['choices'][0]['message']['content']
                print("✅ Brand analysis generated")
                analysis_results["brand_analysis"] = {
                    "raw_response": content,
                    "source": "OpenRouter API"
                }
                analysis_results["data_sources"].append("OpenRouter LLM Analysis")
            else:
                print(f"❌ Brand analysis failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Brand analysis error: {e}")
    
    # Test 2: News Analysis
    print("2. Gathering news coverage...")
    news_key = os.getenv('NEWS_API_KEY')
    if news_key:
        try:
            url = f"https://newsapi.org/v2/everything?q={company_name}+brand&apiKey={news_key}&pageSize=10&sortBy=relevancy"
            response = requests.get(url, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                articles = data.get('articles', [])
                print(f"✅ Found {len(articles)} news articles")
                
                analysis_results["news_analysis"] = {
                    "total_articles": len(articles),
                    "articles": [
                        {
                            "title": article["title"],
                            "source": article["source"]["name"],
                            "published_at": article["publishedAt"],
                            "url": article["url"]
                        }
                        for article in articles[:5]  # Top 5 articles
                    ],
                    "source": "NewsAPI"
                }
                analysis_results["data_sources"].append("NewsAPI Coverage Analysis")
            else:
                print(f"❌ News analysis failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ News analysis error: {e}")
    
    # Test 3: Visual/Brand Assets Analysis
    print("3. Analyzing brand assets...")
    brandfetch_key = os.getenv('BRANDFETCH_API_KEY')
    if brandfetch_key:
        try:
            headers = {
                'Authorization': f'Bearer {brandfetch_key}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"https://api.brandfetch.io/v2/search/{company_name.lower()}.com",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                print("✅ Brand assets retrieved")
                
                if isinstance(data, list) and len(data) > 0:
                    brand_data = data[0]
                    analysis_results["visual_analysis"] = {
                        "brand_name": brand_data.get("name"),
                        "domain": brand_data.get("domain"),
                        "description": brand_data.get("description"),
                        "source": "BrandFetch API"
                    }
                    analysis_results["data_sources"].append("BrandFetch Visual Assets")
            else:
                print(f"❌ Visual analysis failed: {response.status_code}")
                
        except Exception as e:
            print(f"❌ Visual analysis error: {e}")
    
    # Determine success
    analysis_results["success"] = len(analysis_results["data_sources"]) > 0
    
    return analysis_results

def main():
    """Main test function"""
    print("🚀 REAL BRAND AUDIT API TESTING")
    print("=" * 60)
    
    # Test individual APIs
    openrouter_works = test_openrouter_api()
    news_works = test_news_api()
    brandfetch_works = test_brandfetch_api()
    
    print(f"\n📊 API TEST SUMMARY")
    print("-" * 40)
    print(f"OpenRouter API: {'✅ Working' if openrouter_works else '❌ Failed'}")
    print(f"News API: {'✅ Working' if news_works else '❌ Failed'}")
    print(f"BrandFetch API: {'✅ Working' if brandfetch_works else '❌ Failed'}")
    
    # Generate real analysis
    if any([openrouter_works, news_works, brandfetch_works]):
        analysis_results = generate_real_brand_analysis()
        
        print(f"\n🎯 REAL ANALYSIS RESULTS")
        print("-" * 40)
        print(f"Company: {analysis_results['company_name']}")
        print(f"Data Sources: {len(analysis_results['data_sources'])}")
        print(f"Success: {'✅ Yes' if analysis_results['success'] else '❌ No'}")
        
        for source in analysis_results['data_sources']:
            print(f"  📊 {source}")
        
        # Save results to file
        filename = f"real_brand_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(analysis_results, f, indent=2)
        
        print(f"\n📄 Results saved to: {filename}")
        
        return analysis_results
    else:
        print("\n❌ No APIs working - cannot generate real analysis")
        return None

if __name__ == "__main__":
    results = main()
    
    if results and results["success"]:
        print("\n🎉 REAL BRAND AUDIT TEST SUCCESSFUL!")
        print("The brand audit tool can generate authentic analysis using real APIs.")
    else:
        print("\n❌ REAL BRAND AUDIT TEST FAILED!")
        print("The brand audit tool cannot generate authentic analysis.")
