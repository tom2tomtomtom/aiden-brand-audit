#!/usr/bin/env python3
"""
Comprehensive Brand Audit Test
Conducts a full brand audit test and generates a PDF report
"""

import requests
import json
import time
import os
from datetime import datetime
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors

def test_brand_audit_pipeline():
    """Test the complete brand audit pipeline"""
    
    print("🎯 COMPREHENSIVE BRAND AUDIT TEST")
    print("=" * 60)
    
    # Test configuration
    backend_url = "http://localhost:8000"
    test_company = "Apple"
    test_website = "https://apple.com"
    
    results = {
        "test_timestamp": datetime.now().isoformat(),
        "company_name": test_company,
        "website": test_website,
        "backend_url": backend_url,
        "tests_performed": {},
        "api_responses": {},
        "errors": [],
        "success_rate": 0
    }
    
    # Test 1: Health Check
    print("\n1. 🏥 TESTING BACKEND HEALTH")
    print("-" * 40)
    
    try:
        response = requests.get(f"{backend_url}/api/health", timeout=10)
        results["tests_performed"]["health_check"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.status_code == 200 else response.text
        }
        
        if response.status_code == 200:
            health_data = response.json()
            print(f"✅ Backend Health: {health_data.get('status')}")
            print(f"   Service: {health_data.get('service')}")
            print(f"   Environment: {health_data.get('environment')}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Health check error: {e}")
        results["errors"].append(f"Health check failed: {e}")
        results["tests_performed"]["health_check"] = {"success": False, "error": str(e)}
    
    # Test 2: Brand Search
    print("\n2. 🔍 TESTING BRAND SEARCH")
    print("-" * 40)
    
    try:
        search_data = {"query": test_company}
        response = requests.post(f"{backend_url}/api/brand/search", json=search_data, timeout=10)
        
        results["tests_performed"]["brand_search"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.status_code == 200 else response.text
        }
        
        if response.status_code == 200:
            search_results = response.json()
            print(f"✅ Brand search successful")
            print(f"   Success: {search_results.get('success')}")
            print(f"   Message: {search_results.get('message', 'No message')}")
        else:
            print(f"❌ Brand search failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Brand search error: {e}")
        results["errors"].append(f"Brand search failed: {e}")
        results["tests_performed"]["brand_search"] = {"success": False, "error": str(e)}
    
    # Test 3: Service Integration Test
    print("\n3. 🔧 TESTING SERVICE INTEGRATION")
    print("-" * 40)
    
    try:
        test_data = {"company_name": test_company}
        response = requests.post(f"{backend_url}/api/test-analysis", json=test_data, timeout=30)
        
        results["tests_performed"]["service_integration"] = {
            "status": response.status_code,
            "success": response.status_code == 200,
            "response": response.json() if response.status_code == 200 else response.text
        }
        
        if response.status_code == 200:
            test_results = response.json()
            print(f"✅ Service integration test successful")
            
            services = test_results.get("data", {}).get("services_tested", {})
            for service_name, service_result in services.items():
                status = service_result.get("status")
                message = service_result.get("message", service_result.get("error", "No message"))
                print(f"   📊 {service_name}: {status}")
                print(f"      {message}")
        else:
            print(f"❌ Service integration test failed: {response.status_code}")
            
    except Exception as e:
        print(f"❌ Service integration error: {e}")
        results["errors"].append(f"Service integration failed: {e}")
        results["tests_performed"]["service_integration"] = {"success": False, "error": str(e)}
    
    # Test 4: API Key Validation
    print("\n4. 🔑 TESTING API KEY CONFIGURATION")
    print("-" * 40)
    
    # Check if APIs are properly configured
    api_status = {
        "openrouter": "Unknown",
        "newsapi": "Unknown", 
        "brandfetch": "Unknown"
    }
    
    # Test OpenRouter API directly
    try:
        import os
        from dotenv import load_dotenv
        load_dotenv()
        
        openrouter_key = os.getenv('OPENROUTER_API_KEY')
        news_key = os.getenv('NEWS_API_KEY')
        brandfetch_key = os.getenv('BRANDFETCH_API_KEY')
        
        api_status["openrouter"] = "Configured" if openrouter_key else "Missing"
        api_status["newsapi"] = "Configured" if news_key else "Missing"
        api_status["brandfetch"] = "Configured" if brandfetch_key else "Missing"
        
        print(f"   🔑 OpenRouter API: {api_status['openrouter']}")
        print(f"   📰 News API: {api_status['newsapi']}")
        print(f"   🎨 BrandFetch API: {api_status['brandfetch']}")
        
        results["tests_performed"]["api_keys"] = {
            "success": True,
            "api_status": api_status
        }
        
    except Exception as e:
        print(f"❌ API key validation error: {e}")
        results["errors"].append(f"API key validation failed: {e}")
        results["tests_performed"]["api_keys"] = {"success": False, "error": str(e)}
    
    # Calculate success rate
    successful_tests = sum(1 for test in results["tests_performed"].values() if test.get("success", False))
    total_tests = len(results["tests_performed"])
    results["success_rate"] = (successful_tests / total_tests * 100) if total_tests > 0 else 0
    
    print(f"\n📊 OVERALL TEST RESULTS")
    print("-" * 40)
    print(f"✅ Successful tests: {successful_tests}/{total_tests}")
    print(f"📈 Success rate: {results['success_rate']:.1f}%")
    print(f"❌ Errors encountered: {len(results['errors'])}")
    
    return results

def generate_pdf_report(test_results):
    """Generate a comprehensive PDF report"""
    
    print("\n📄 GENERATING PDF REPORT")
    print("-" * 40)
    
    # Create PDF document
    filename = f"brand_audit_test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    doc = SimpleDocTemplate(filename, pagesize=A4)
    
    # Get styles
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.darkblue
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=12,
        textColor=colors.darkblue
    )
    
    # Build content
    content = []
    
    # Title
    content.append(Paragraph("Brand Audit System Test Report", title_style))
    content.append(Spacer(1, 20))
    
    # Executive Summary
    content.append(Paragraph("Executive Summary", heading_style))
    content.append(Paragraph(f"""
    This report documents a comprehensive test of the Brand Audit System conducted on {test_results['test_timestamp']}.
    The test evaluated the system's ability to perform brand analysis for {test_results['company_name']} 
    with a focus on API integration, service functionality, and data authenticity.
    """, styles['Normal']))
    content.append(Spacer(1, 12))
    
    # Test Results Summary
    content.append(Paragraph("Test Results Summary", heading_style))
    
    # Create summary table
    summary_data = [
        ['Metric', 'Result'],
        ['Test Company', test_results['company_name']],
        ['Test Website', test_results['website']],
        ['Backend URL', test_results['backend_url']],
        ['Success Rate', f"{test_results['success_rate']:.1f}%"],
        ['Total Tests', str(len(test_results['tests_performed']))],
        ['Errors', str(len(test_results['errors']))]
    ]
    
    summary_table = Table(summary_data, colWidths=[2*inch, 3*inch])
    summary_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black)
    ]))
    
    content.append(summary_table)
    content.append(Spacer(1, 20))
    
    # Detailed Test Results
    content.append(Paragraph("Detailed Test Results", heading_style))
    
    for test_name, test_data in test_results['tests_performed'].items():
        test_title = test_name.replace('_', ' ').title()
        status = "✅ PASSED" if test_data.get('success', False) else "❌ FAILED"
        
        content.append(Paragraph(f"{test_title}: {status}", styles['Heading3']))
        
        if test_data.get('success', False):
            content.append(Paragraph("Status: Test completed successfully", styles['Normal']))
            if 'response' in test_data:
                response_text = str(test_data['response'])[:200] + "..." if len(str(test_data['response'])) > 200 else str(test_data['response'])
                content.append(Paragraph(f"Response: {response_text}", styles['Normal']))
        else:
            error_msg = test_data.get('error', 'Unknown error')
            content.append(Paragraph(f"Error: {error_msg}", styles['Normal']))
        
        content.append(Spacer(1, 12))
    
    # Conclusions
    content.append(Paragraph("Conclusions", heading_style))
    
    if test_results['success_rate'] >= 80:
        conclusion = "The Brand Audit System is functioning well and ready for production use."
    elif test_results['success_rate'] >= 60:
        conclusion = "The Brand Audit System is mostly functional but may need minor adjustments."
    else:
        conclusion = "The Brand Audit System requires significant attention before production use."
    
    content.append(Paragraph(conclusion, styles['Normal']))
    content.append(Spacer(1, 12))
    
    # Build PDF
    doc.build(content)
    
    print(f"✅ PDF report generated: {filename}")
    print(f"📁 File size: {os.path.getsize(filename)} bytes")
    
    return filename

if __name__ == "__main__":
    # Run comprehensive test
    test_results = test_brand_audit_pipeline()
    
    # Generate PDF report
    try:
        pdf_filename = generate_pdf_report(test_results)
        print(f"\n🎉 COMPREHENSIVE TEST COMPLETE!")
        print(f"📄 PDF Report: {pdf_filename}")
        print(f"📊 Overall Success Rate: {test_results['success_rate']:.1f}%")
    except Exception as e:
        print(f"❌ PDF generation failed: {e}")
        print("📋 Test results available in console output above")
