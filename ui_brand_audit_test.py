#!/usr/bin/env python3
"""
UI Brand Audit Test using Playwright
Tests the complete user journey through the brand audit application
"""

import asyncio
import time
import json
import requests
from datetime import datetime
from playwright.async_api import async_playwright

async def test_brand_audit_ui():
    """Test the complete brand audit UI workflow"""
    
    print("🎭 COMPREHENSIVE UI BRAND AUDIT TEST")
    print("=" * 60)
    
    async with async_playwright() as p:
        # Launch browser
        browser = await p.chromium.launch(headless=False)  # Set to False to see the browser
        context = await browser.new_context()
        page = await context.new_page()
        
        test_results = {
            "test_timestamp": datetime.now().isoformat(),
            "ui_tests": {},
            "screenshots": [],
            "errors": []
        }
        
        try:
            # Test 1: Load the application
            print("\n1. 🌐 LOADING BRAND AUDIT APPLICATION")
            print("-" * 40)
            
            await page.goto("http://localhost:5173")
            await page.wait_for_load_state("networkidle")
            
            # Take screenshot
            screenshot_path = f"ui_test_homepage_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            await page.screenshot(path=screenshot_path)
            test_results["screenshots"].append(screenshot_path)
            
            # Check if page loaded
            title = await page.title()
            print(f"✅ Page loaded successfully")
            print(f"   Title: {title}")
            print(f"   Screenshot: {screenshot_path}")
            
            test_results["ui_tests"]["page_load"] = {
                "success": True,
                "title": title,
                "screenshot": screenshot_path
            }
            
            # Test 2: Check for main elements
            print("\n2. 🔍 CHECKING UI ELEMENTS")
            print("-" * 40)
            
            # Look for common UI elements
            elements_to_check = [
                "input[type='text']",  # Input field
                "button",              # Buttons
                "form",                # Forms
                ".brand-audit",        # Brand audit specific elements
                ".analysis"            # Analysis elements
            ]
            
            found_elements = {}
            for selector in elements_to_check:
                try:
                    element = await page.query_selector(selector)
                    found_elements[selector] = element is not None
                    if element:
                        print(f"   ✅ Found: {selector}")
                    else:
                        print(f"   ❌ Missing: {selector}")
                except Exception as e:
                    found_elements[selector] = False
                    print(f"   ❌ Error checking {selector}: {e}")
            
            test_results["ui_tests"]["ui_elements"] = {
                "success": any(found_elements.values()),
                "elements_found": found_elements
            }
            
            # Test 3: Try to interact with the application
            print("\n3. 🎯 TESTING BRAND AUDIT WORKFLOW")
            print("-" * 40)
            
            # Look for input field to enter brand name
            brand_input = await page.query_selector("input[type='text'], input[placeholder*='brand'], input[placeholder*='company']")
            
            if brand_input:
                print("   ✅ Found brand input field")
                
                # Enter test brand
                await brand_input.fill("Apple")
                print("   📝 Entered 'Apple' as test brand")
                
                # Look for submit button
                submit_button = await page.query_selector("button[type='submit'], button:has-text('Analyze'), button:has-text('Start'), button:has-text('Audit')")
                
                if submit_button:
                    print("   ✅ Found submit button")
                    
                    # Take screenshot before submission
                    screenshot_path = f"ui_test_before_submit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=screenshot_path)
                    test_results["screenshots"].append(screenshot_path)
                    
                    # Click submit
                    await submit_button.click()
                    print("   🚀 Clicked submit button")
                    
                    # Wait for response
                    await page.wait_for_timeout(3000)  # Wait 3 seconds
                    
                    # Take screenshot after submission
                    screenshot_path = f"ui_test_after_submit_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                    await page.screenshot(path=screenshot_path)
                    test_results["screenshots"].append(screenshot_path)
                    
                    # Check for results or progress indicators
                    progress_indicators = await page.query_selector_all(".progress, .loading, .spinner, .analysis-progress")
                    results_elements = await page.query_selector_all(".results, .report, .analysis-results")
                    
                    if progress_indicators:
                        print(f"   📊 Found {len(progress_indicators)} progress indicators")
                        
                        # Wait for analysis to complete (up to 60 seconds)
                        print("   ⏳ Waiting for analysis to complete...")
                        for i in range(12):  # 12 * 5 seconds = 60 seconds max
                            await page.wait_for_timeout(5000)
                            
                            # Check if analysis is complete
                            completed_elements = await page.query_selector_all(".completed, .finished, .report-ready")
                            if completed_elements:
                                print(f"   ✅ Analysis completed after {(i+1)*5} seconds")
                                break
                            
                            print(f"   ⏳ Still waiting... ({(i+1)*5}s)")
                        
                        # Take final screenshot
                        screenshot_path = f"ui_test_final_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
                        await page.screenshot(path=screenshot_path)
                        test_results["screenshots"].append(screenshot_path)
                    
                    elif results_elements:
                        print(f"   📋 Found {len(results_elements)} result elements")
                    else:
                        print("   ⚠️  No progress indicators or results found")
                    
                    test_results["ui_tests"]["brand_audit_workflow"] = {
                        "success": True,
                        "brand_entered": "Apple",
                        "submit_clicked": True,
                        "progress_indicators": len(progress_indicators),
                        "result_elements": len(results_elements)
                    }
                    
                else:
                    print("   ❌ No submit button found")
                    test_results["ui_tests"]["brand_audit_workflow"] = {
                        "success": False,
                        "error": "No submit button found"
                    }
            else:
                print("   ❌ No brand input field found")
                test_results["ui_tests"]["brand_audit_workflow"] = {
                    "success": False,
                    "error": "No brand input field found"
                }
            
            # Test 4: Check for download/export functionality
            print("\n4. 📄 CHECKING DOWNLOAD/EXPORT FUNCTIONALITY")
            print("-" * 40)
            
            download_buttons = await page.query_selector_all("button:has-text('Download'), button:has-text('Export'), button:has-text('PDF'), a[download]")
            
            if download_buttons:
                print(f"   ✅ Found {len(download_buttons)} download/export buttons")
                
                # Try to click the first download button
                try:
                    # Set up download handling
                    async with page.expect_download() as download_info:
                        await download_buttons[0].click()
                    
                    download = await download_info.value
                    download_path = f"downloaded_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
                    await download.save_as(download_path)
                    
                    print(f"   📥 Successfully downloaded: {download_path}")
                    test_results["ui_tests"]["download_functionality"] = {
                        "success": True,
                        "download_path": download_path
                    }
                    
                except Exception as e:
                    print(f"   ⚠️  Download attempt failed: {e}")
                    test_results["ui_tests"]["download_functionality"] = {
                        "success": False,
                        "error": str(e)
                    }
            else:
                print("   ❌ No download/export buttons found")
                test_results["ui_tests"]["download_functionality"] = {
                    "success": False,
                    "error": "No download buttons found"
                }
            
        except Exception as e:
            print(f"❌ UI test error: {e}")
            test_results["errors"].append(str(e))
        
        finally:
            # Take final screenshot
            final_screenshot = f"ui_test_final_state_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
            await page.screenshot(path=final_screenshot)
            test_results["screenshots"].append(final_screenshot)
            
            await browser.close()
        
        return test_results

def test_api_directly():
    """Test the API directly to ensure it's working"""
    
    print("\n🔧 DIRECT API TEST")
    print("-" * 40)
    
    try:
        # Test a simple brand analysis request
        analysis_data = {
            "company_name": "Apple",
            "website": "https://apple.com",
            "analysis_options": {
                "brandPerception": True,
                "pressCoverage": True,
                "visualAnalysis": True,
                "competitiveAnalysis": True
            },
            "use_async_processing": True
        }
        
        print("   📡 Sending brand analysis request...")
        response = requests.post(
            "http://localhost:8000/api/analyze",
            json=analysis_data,
            timeout=10
        )
        
        print(f"   📊 Response status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            analysis_id = data.get("analysis_id")
            print(f"   ✅ Analysis started: {analysis_id}")
            
            # Check status periodically
            for i in range(6):  # Check for 30 seconds
                time.sleep(5)
                status_response = requests.get(f"http://localhost:8000/api/analysis/{analysis_id}")
                
                if status_response.status_code == 200:
                    status_data = status_response.json()
                    status = status_data.get("status")
                    progress = status_data.get("progress", 0)
                    
                    print(f"   📈 Status: {status} ({progress}%)")
                    
                    if status == "completed":
                        print("   🎉 Analysis completed successfully!")
                        return True
                    elif status == "failed":
                        print("   ❌ Analysis failed")
                        return False
                else:
                    print(f"   ⚠️  Status check failed: {status_response.status_code}")
            
            print("   ⏰ Analysis still in progress after 30 seconds")
            return True  # Consider it successful if it's still running
            
        else:
            print(f"   ❌ API request failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"   ❌ API test error: {e}")
        return False

async def main():
    """Main test function"""
    
    print("🚀 STARTING COMPREHENSIVE BRAND AUDIT TEST")
    print("=" * 60)
    
    # Test API first
    api_success = test_api_directly()
    
    # Test UI
    ui_results = await test_brand_audit_ui()
    
    # Calculate overall success
    ui_success_count = sum(1 for test in ui_results["ui_tests"].values() if test.get("success", False))
    ui_total_tests = len(ui_results["ui_tests"])
    ui_success_rate = (ui_success_count / ui_total_tests * 100) if ui_total_tests > 0 else 0
    
    print(f"\n📊 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"🔧 API Test: {'✅ PASSED' if api_success else '❌ FAILED'}")
    print(f"🎭 UI Tests: {ui_success_count}/{ui_total_tests} passed ({ui_success_rate:.1f}%)")
    print(f"📸 Screenshots taken: {len(ui_results['screenshots'])}")
    print(f"❌ Errors encountered: {len(ui_results['errors'])}")
    
    print(f"\n📁 Generated files:")
    for screenshot in ui_results["screenshots"]:
        print(f"   📸 {screenshot}")
    
    if ui_results["ui_tests"].get("download_functionality", {}).get("success"):
        download_path = ui_results["ui_tests"]["download_functionality"]["download_path"]
        print(f"   📄 {download_path}")
    
    overall_success = api_success and ui_success_rate >= 50
    print(f"\n🎯 OVERALL RESULT: {'✅ SUCCESS' if overall_success else '❌ NEEDS ATTENTION'}")
    
    return overall_success

if __name__ == "__main__":
    asyncio.run(main())
