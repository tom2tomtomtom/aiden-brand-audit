import { test, expect } from '@playwright/test';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Test configuration
const TEST_CONFIG = {
  baseURL: 'http://localhost:3002',
  backendURL: 'http://localhost:8000',
  brands: ['Apple', 'Tesla', 'Nike'],
  timeout: 300000, // 5 minutes for brand analysis
  screenshots: true,
  reportDownloads: true
};

// Quality scoring system
const QualityMetrics = {
  UI_DESIGN: { max: 25, current: 0 },
  FUNCTIONALITY: { max: 25, current: 0 },
  CONTENT_QUALITY: { max: 25, current: 0 },
  PDF_QUALITY: { max: 25, current: 0 }
};

let testReport = {
  timestamp: new Date().toISOString(),
  testConfig: TEST_CONFIG,
  results: [],
  screenshots: [],
  performance: {},
  errors: [],
  recommendations: [],
  qualityScore: 0
};

test.describe('Comprehensive E2E UI and Quality Test Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Set up comprehensive error tracking
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testReport.errors.push({
          type: 'console_error',
          message: msg.text(),
          timestamp: new Date().toISOString()
        });
      }
    });

    page.on('pageerror', error => {
      testReport.errors.push({
        type: 'page_error',
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Set up performance monitoring
    await page.addInitScript(() => {
      window.performanceMetrics = {
        startTime: performance.now(),
        loadTimes: {},
        apiCalls: []
      };
    });
  });

  test('1. Complete User Journey Test - Apple Brand Analysis', async ({ page }) => {
    console.log('\n🚀 STARTING COMPREHENSIVE E2E TEST');
    console.log('===================================');

    let currentStep = 'Landing Page Load';
    try {
      // STEP 1: LANDING PAGE VERIFICATION
      console.log('\n1️⃣ LANDING PAGE QUALITY ANALYSIS');
      console.log('---------------------------------');

      const startTime = Date.now();
      await page.goto(TEST_CONFIG.baseURL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;

      testReport.performance.pageLoad = loadTime;
      console.log(`✅ Page load time: ${loadTime}ms`);

      if (loadTime < 3000) {
        QualityMetrics.UI_DESIGN.current += 5;
        console.log(`✅ Excellent page load performance`);
      } else if (loadTime < 5000) {
        QualityMetrics.UI_DESIGN.current += 3;
        testReport.recommendations.push('Consider optimizing initial page load time');
      } else {
        testReport.recommendations.push('Page load time is too slow for production use');
      }

      // Take landing page screenshot
      const landingScreenshot = `landing_page_${Date.now()}.png`;
      await page.screenshot({ 
        path: `test-results/${landingScreenshot}`, 
        fullPage: true 
      });
      testReport.screenshots.push({
        step: 'landing_page',
        filename: landingScreenshot,
        description: 'Initial landing page state'
      });

      // UI Quality Assessment
      await page.waitForSelector('h1', { timeout: 10000 });
      const title = await page.locator('h1').textContent();
      console.log(`📋 Page title: "${title}"`);

      if (title && title.includes('Brand Audit')) {
        QualityMetrics.UI_DESIGN.current += 3;
        console.log('✅ Professional page title');
      } else {
        testReport.recommendations.push('Page title should clearly indicate brand audit functionality');
      }

      // Check for modern UI elements
      const gradientElements = await page.locator('.bg-gradient-to-br, .bg-gradient-to-r').count();
      const shadowElements = await page.locator('[class*="shadow"]').count();
      
      if (gradientElements > 0 && shadowElements > 0) {
        QualityMetrics.UI_DESIGN.current += 4;
        console.log('✅ Modern UI design elements present');
      } else {
        testReport.recommendations.push('Consider adding modern UI elements (gradients, shadows)');
      }

      // Check responsive design indicators
      const responsiveClasses = await page.locator('[class*="sm:"], [class*="md:"], [class*="lg:"]').count();
      if (responsiveClasses > 5) {
        QualityMetrics.UI_DESIGN.current += 3;
        console.log('✅ Responsive design classes detected');
      }

      // STEP 2: FORM INTERACTION TESTING
      console.log('\n2️⃣ FORM VALIDATION & INTERACTION TEST');
      console.log('-------------------------------------');

      currentStep = 'Form Interaction';
      const searchInput = page.locator('input[type="text"], input[placeholder*="brand"], input[placeholder*="Apple"]').first();
      await expect(searchInput).toBeVisible();

      // Test placeholder quality
      const placeholder = await searchInput.getAttribute('placeholder');
      console.log(`📋 Input placeholder: "${placeholder}"`);
      
      if (placeholder && (placeholder.includes('Apple') || placeholder.includes('brand'))) {
        QualityMetrics.FUNCTIONALITY.current += 2;
        console.log('✅ Helpful input placeholder');
      }

      // Test example brand buttons
      const appleBrandButton = page.locator('button:has-text("Apple"), .apple, [data-brand="apple"]').first();
      const exampleButtons = await page.locator('button:has-text("Apple"), button:has-text("Tesla"), button:has-text("Nike")').count();
      
      if (exampleButtons >= 3) {
        QualityMetrics.FUNCTIONALITY.current += 3;
        console.log('✅ Example brand buttons available');

        // Test example brand selection
        await appleBrandButton.click();
        await page.waitForTimeout(500);
        const inputValue = await searchInput.inputValue();
        
        if (inputValue === 'Apple') {
          QualityMetrics.FUNCTIONALITY.current += 2;
          console.log('✅ Example brand selection works correctly');
        }
      } else {
        // Fallback: manual input
        await searchInput.fill('Apple');
        console.log('⚠️ Manual brand input used (example buttons not found)');
      }

      // Form validation testing
      await searchInput.fill('');
      const submitButton = page.locator('button:has-text("Start"), button:has-text("Analyze"), button[type="submit"]').first();
      await submitButton.click();
      
      // Check for validation feedback
      await page.waitForTimeout(1000);
      const validationMessages = await page.locator('.error, .invalid, [role="alert"]').count();
      if (validationMessages > 0) {
        QualityMetrics.FUNCTIONALITY.current += 2;
        console.log('✅ Form validation feedback present');
      }

      // Fill form properly for analysis
      await searchInput.fill('Apple');
      
      // STEP 3: ANALYSIS INITIATION
      console.log('\n3️⃣ ANALYSIS INITIATION TEST');
      console.log('----------------------------');

      currentStep = 'Analysis Start';
      const analysisStartTime = Date.now();
      
      await submitButton.click();
      console.log('✅ Analysis form submitted');

      // Wait for progress page or analysis to start
      await page.waitForTimeout(3000);
      
      // Check if we moved to progress/analysis page
      const currentURL = page.url();
      console.log(`📋 Current URL: ${currentURL}`);

      if (currentURL.includes('analysis') || currentURL.includes('progress') || currentURL !== TEST_CONFIG.baseURL) {
        QualityMetrics.FUNCTIONALITY.current += 5;
        console.log('✅ Successfully navigated to analysis page');
      } else {
        // Check if analysis started on same page
        const progressIndicators = await page.locator('[role="progressbar"], .progress, .loading').count();
        if (progressIndicators > 0) {
          QualityMetrics.FUNCTIONALITY.current += 4;
          console.log('✅ Analysis progress indicators visible');
        }
      }

      // STEP 4: PROGRESS MONITORING & WEBSOCKET TESTING
      console.log('\n4️⃣ REAL-TIME PROGRESS MONITORING');
      console.log('--------------------------------');

      currentStep = 'Progress Monitoring';
      
      // Take progress screenshot
      const progressScreenshot = `progress_state_${Date.now()}.png`;
      await page.screenshot({ 
        path: `test-results/${progressScreenshot}`, 
        fullPage: true 
      });
      testReport.screenshots.push({
        step: 'progress_monitoring',
        filename: progressScreenshot,
        description: 'Analysis progress state'
      });

      // Monitor progress elements
      const progressElements = [
        'Brand Discovery',
        'Market Intelligence', 
        'Visual Analysis',
        'Competitive Analysis',
        'Strategic Insights'
      ];

      let progressStepsFound = 0;
      for (const step of progressElements) {
        const stepElement = page.locator(`text=${step}, :has-text("${step}")`);
        const isVisible = await stepElement.count() > 0;
        if (isVisible) {
          progressStepsFound++;
          console.log(`✅ Progress step found: ${step}`);
        }
      }

      if (progressStepsFound >= 3) {
        QualityMetrics.FUNCTIONALITY.current += 4;
        console.log(`✅ Comprehensive progress steps (${progressStepsFound}/${progressElements.length})`);
      }

      // Check for real-time updates (WebSocket functionality)
      let progressUpdates = 0;
      const progressBar = page.locator('[role="progressbar"], .progress-bar').first();
      
      if (await progressBar.count() > 0) {
        QualityMetrics.FUNCTIONALITY.current += 3;
        console.log('✅ Progress bar element present');
        
        // Monitor for progress changes
        for (let i = 0; i < 10; i++) {
          await page.waitForTimeout(5000);
          const progressText = await page.textContent('body');
          if (progressText.includes('%') || progressText.includes('completed') || progressText.includes('analyzing')) {
            progressUpdates++;
            console.log(`📊 Progress update detected: ${i + 1}`);
            break;
          }
        }
      }

      if (progressUpdates > 0) {
        QualityMetrics.FUNCTIONALITY.current += 4;
        console.log('✅ Real-time progress updates working');
      }

      // STEP 5: ANALYSIS COMPLETION & RESULTS
      console.log('\n5️⃣ ANALYSIS COMPLETION & RESULTS');
      console.log('--------------------------------');

      currentStep = 'Results Display';
      
      // Wait for analysis completion (with timeout)
      const maxWaitTime = 180000; // 3 minutes
      let analysisCompleted = false;
      let waitTime = 0;

      while (waitTime < maxWaitTime && !analysisCompleted) {
        await page.waitForTimeout(5000);
        waitTime += 5000;

        const pageContent = await page.textContent('body');
        
        // Check for completion indicators
        if (pageContent.includes('Complete') || 
            pageContent.includes('Download') || 
            pageContent.includes('Executive Summary') ||
            pageContent.includes('100%')) {
          analysisCompleted = true;
          console.log(`✅ Analysis completed in ${waitTime}ms`);
          testReport.performance.analysisTime = waitTime;
        }

        // Progress logging every 30 seconds
        if (waitTime % 30000 === 0) {
          console.log(`⏳ Analysis running... ${waitTime/1000}s elapsed`);
        }
      }

      if (!analysisCompleted) {
        console.log(`⚠️ Analysis timeout after ${maxWaitTime/1000}s`);
        testReport.recommendations.push('Analysis takes too long - consider performance optimization');
      } else {
        QualityMetrics.FUNCTIONALITY.current += 6;
        
        if (waitTime < 60000) {
          QualityMetrics.FUNCTIONALITY.current += 2;
          console.log('✅ Excellent analysis performance');
        } else if (waitTime < 120000) {
          console.log('✅ Good analysis performance');
        }
      }

      // STEP 6: CONTENT QUALITY ANALYSIS
      console.log('\n6️⃣ CONTENT QUALITY ASSESSMENT');
      console.log('------------------------------');

      currentStep = 'Content Quality';

      // Take results screenshot
      const resultsScreenshot = `results_content_${Date.now()}.png`;
      await page.screenshot({ 
        path: `test-results/${resultsScreenshot}`, 
        fullPage: true 
      });
      testReport.screenshots.push({
        step: 'results_content',
        filename: resultsScreenshot,
        description: 'Analysis results and content quality'
      });

      const pageContent = await page.textContent('body');
      
      // Content quality checks
      const qualityIndicators = {
        'Executive Summary': pageContent.includes('Executive Summary') || pageContent.includes('executive summary'),
        'Market Position': pageContent.includes('market') && pageContent.includes('position'),
        'Competitive Analysis': pageContent.includes('competit') && pageContent.includes('analys'),
        'Brand Strength': pageContent.includes('brand') && (pageContent.includes('strength') || pageContent.includes('score')),
        'Recommendations': pageContent.includes('recommend') || pageContent.includes('suggest'),
        'Visual Analysis': pageContent.includes('visual') || pageContent.includes('logo') || pageContent.includes('color'),
        'Data Sources': pageContent.includes('source') || pageContent.includes('data'),
        'Professional Formatting': pageContent.length > 5000
      };

      let contentQualityScore = 0;
      Object.entries(qualityIndicators).forEach(([indicator, present]) => {
        if (present) {
          contentQualityScore++;
          console.log(`✅ ${indicator}: Present`);
        } else {
          console.log(`❌ ${indicator}: Missing`);
          testReport.recommendations.push(`Add ${indicator} to improve report quality`);
        }
      });

      QualityMetrics.CONTENT_QUALITY.current = Math.round((contentQualityScore / 8) * 25);
      console.log(`📊 Content Quality Score: ${contentQualityScore}/8 (${QualityMetrics.CONTENT_QUALITY.current}/25)`);

      // Check for placeholder content
      const placeholderIndicators = ['lorem ipsum', 'placeholder', 'sample data', 'test content', 'coming soon'];
      let placeholderFound = false;
      
      placeholderIndicators.forEach(placeholder => {
        if (pageContent.toLowerCase().includes(placeholder)) {
          placeholderFound = true;
          testReport.recommendations.push(`Remove placeholder content: "${placeholder}"`);
        }
      });

      if (!placeholderFound) {
        QualityMetrics.CONTENT_QUALITY.current += 5;
        console.log('✅ No placeholder content detected');
      }

      // STEP 7: PDF DOWNLOAD & QUALITY TESTING
      console.log('\n7️⃣ PDF REPORT DOWNLOAD & QUALITY');
      console.log('---------------------------------');

      currentStep = 'PDF Download';

      // Look for download buttons
      const downloadButton = page.locator('a:has-text("Download"), button:has-text("Download"), a[href*=".pdf"]').first();
      const downloadButtonExists = await downloadButton.count() > 0;

      if (downloadButtonExists) {
        QualityMetrics.PDF_QUALITY.current += 5;
        console.log('✅ PDF download button available');

        try {
          // Set up download handling
          const [download] = await Promise.all([
            page.waitForEvent('download', { timeout: 30000 }),
            downloadButton.click()
          ]);

          if (download) {
            const downloadPath = `test-results/downloaded_report_${Date.now()}.pdf`;
            await download.saveAs(downloadPath);
            
            QualityMetrics.PDF_QUALITY.current += 10;
            console.log(`✅ PDF downloaded successfully: ${downloadPath}`);
            
            testReport.results.push({
              step: 'pdf_download',
              status: 'success',
              file: downloadPath,
              size: (await download).suggestedFilename()
            });

            // Basic PDF quality checks (file size, etc.)
            if (existsSync(downloadPath)) {
              const stats = require('fs').statSync(downloadPath);
              const fileSizeKB = stats.size / 1024;
              
              if (fileSizeKB > 100) {
                QualityMetrics.PDF_QUALITY.current += 5;
                console.log(`✅ PDF file size appropriate: ${Math.round(fileSizeKB)}KB`);
              } else if (fileSizeKB > 50) {
                QualityMetrics.PDF_QUALITY.current += 3;
                console.log(`⚠️ PDF file size small: ${Math.round(fileSizeKB)}KB`);
                testReport.recommendations.push('PDF report seems lightweight - consider adding more content');
              } else {
                testReport.recommendations.push('PDF report is too small - may lack comprehensive content');
              }

              if (fileSizeKB < 5000) {
                QualityMetrics.PDF_QUALITY.current += 2;
                console.log('✅ PDF file size reasonable for quick download');
              } else {
                testReport.recommendations.push('PDF file size is large - consider optimization');
              }
            }

          } else {
            testReport.recommendations.push('PDF download failed - check report generation');
          }

        } catch (error) {
          console.log(`❌ PDF download failed: ${error.message}`);
          testReport.errors.push({
            type: 'pdf_download_error',
            message: error.message,
            timestamp: new Date().toISOString()
          });
        }
      } else {
        console.log('❌ No PDF download option found');
        testReport.recommendations.push('Add PDF download functionality for professional reporting');
      }

      // STEP 8: MOBILE RESPONSIVENESS TEST
      console.log('\n8️⃣ MOBILE RESPONSIVENESS TEST');
      console.log('------------------------------');

      currentStep = 'Mobile Testing';

      const viewports = [
        { name: 'Mobile Portrait', width: 375, height: 667 },
        { name: 'Mobile Landscape', width: 667, height: 375 },
        { name: 'Tablet', width: 768, height: 1024 },
        { name: 'Desktop', width: 1920, height: 1080 }
      ];

      let responsiveScore = 0;
      for (const viewport of viewports) {
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);

        const isContentVisible = await page.locator('h1').isVisible();
        const hasHorizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);

        if (isContentVisible && !hasHorizontalScroll) {
          responsiveScore++;
          console.log(`✅ ${viewport.name} (${viewport.width}x${viewport.height}): Good`);
        } else {
          console.log(`❌ ${viewport.name} (${viewport.width}x${viewport.height}): Issues detected`);
          testReport.recommendations.push(`Fix responsive design for ${viewport.name}`);
        }

        // Take responsive screenshots
        const responsiveScreenshot = `responsive_${viewport.name.toLowerCase().replace(' ', '_')}_${Date.now()}.png`;
        await page.screenshot({ 
          path: `test-results/${responsiveScreenshot}`,
          fullPage: false 
        });
        testReport.screenshots.push({
          step: 'responsive_design',
          filename: responsiveScreenshot,
          description: `${viewport.name} responsive test`
        });
      }

      QualityMetrics.UI_DESIGN.current += Math.round((responsiveScore / 4) * 10);
      console.log(`📱 Responsive Design Score: ${responsiveScore}/4`);

    } catch (error) {
      console.log(`❌ Test failed at step: ${currentStep}`);
      console.log(`❌ Error: ${error.message}`);
      
      testReport.errors.push({
        type: 'test_execution_error',
        step: currentStep,
        message: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });

      // Take error screenshot
      const errorScreenshot = `error_${currentStep.toLowerCase().replace(' ', '_')}_${Date.now()}.png`;
      await page.screenshot({ 
        path: `test-results/${errorScreenshot}`,
        fullPage: true 
      });
      testReport.screenshots.push({
        step: 'error',
        filename: errorScreenshot,
        description: `Error at ${currentStep}`
      });
    }

    // STEP 9: PERFORMANCE ANALYSIS
    console.log('\n9️⃣ PERFORMANCE ANALYSIS');
    console.log('-----------------------');

    // Get performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    testReport.performance = { ...testReport.performance, ...performanceMetrics };
    
    console.log(`📊 DOM Content Loaded: ${performanceMetrics.domContentLoaded}ms`);
    console.log(`📊 Page Load Complete: ${performanceMetrics.loadComplete}ms`);
    console.log(`📊 First Paint: ${performanceMetrics.firstPaint}ms`);
    console.log(`📊 First Contentful Paint: ${performanceMetrics.firstContentfulPaint}ms`);

    // Performance scoring
    if (performanceMetrics.firstContentfulPaint < 2000) {
      QualityMetrics.UI_DESIGN.current += 3;
      console.log('✅ Excellent First Contentful Paint');
    } else if (performanceMetrics.firstContentfulPaint < 3000) {
      QualityMetrics.UI_DESIGN.current += 2;
      console.log('✅ Good First Contentful Paint');
    }

    // STEP 10: FINAL QUALITY ASSESSMENT
    console.log('\n🏆 FINAL QUALITY ASSESSMENT');
    console.log('===========================');

    // Calculate overall quality score
    const totalScore = Object.values(QualityMetrics).reduce((sum, metric) => sum + metric.current, 0);
    testReport.qualityScore = totalScore;

    console.log('\n📊 QUALITY BREAKDOWN:');
    console.log(`   UI Design: ${QualityMetrics.UI_DESIGN.current}/${QualityMetrics.UI_DESIGN.max}`);
    console.log(`   Functionality: ${QualityMetrics.FUNCTIONALITY.current}/${QualityMetrics.FUNCTIONALITY.max}`);
    console.log(`   Content Quality: ${QualityMetrics.CONTENT_QUALITY.current}/${QualityMetrics.CONTENT_QUALITY.max}`);
    console.log(`   PDF Quality: ${QualityMetrics.PDF_QUALITY.current}/${QualityMetrics.PDF_QUALITY.max}`);
    console.log(`   TOTAL SCORE: ${totalScore}/100`);

    // Quality rating
    let qualityRating;
    if (totalScore >= 90) qualityRating = 'EXCELLENT';
    else if (totalScore >= 80) qualityRating = 'VERY GOOD';
    else if (totalScore >= 70) qualityRating = 'GOOD';
    else if (totalScore >= 60) qualityRating = 'FAIR';
    else qualityRating = 'NEEDS IMPROVEMENT';

    console.log(`\n🎯 OVERALL QUALITY RATING: ${qualityRating}`);

    // Recommendations summary
    if (testReport.recommendations.length > 0) {
      console.log('\n💡 KEY RECOMMENDATIONS:');
      testReport.recommendations.slice(0, 5).forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`);
      });
    }

    // Save comprehensive test report
    const reportFilename = `comprehensive_test_report_${Date.now()}.json`;
    writeFileSync(`test-results/${reportFilename}`, JSON.stringify(testReport, null, 2));
    console.log(`\n📄 Comprehensive test report saved: ${reportFilename}`);

    console.log('\n🎉 COMPREHENSIVE E2E TEST COMPLETE!');
    console.log('===================================');

    // Test assertions
    expect(QualityMetrics.UI_DESIGN.current).toBeGreaterThan(10); // Minimum UI quality
    expect(QualityMetrics.FUNCTIONALITY.current).toBeGreaterThan(10); // Minimum functionality
    expect(totalScore).toBeGreaterThan(40); // Minimum overall quality
    expect(testReport.errors.length).toBeLessThan(5); // Maximum acceptable errors
  });

  test('2. Cross-Browser Compatibility Test', async ({ browserName, page }) => {
    console.log(`\n🌐 CROSS-BROWSER TEST: ${browserName.toUpperCase()}`);
    console.log('=====================================');

    await page.goto(TEST_CONFIG.baseURL);
    await page.waitForLoadState('networkidle');

    // Basic compatibility checks
    const title = await page.locator('h1').textContent();
    expect(title).toBeTruthy();
    console.log(`✅ ${browserName}: Main title renders correctly`);

    const inputField = page.locator('input[type="text"]').first();
    await expect(inputField).toBeVisible();
    console.log(`✅ ${browserName}: Form input accessible`);

    const buttons = await page.locator('button').count();
    expect(buttons).toBeGreaterThan(0);
    console.log(`✅ ${browserName}: Buttons render (${buttons} found)`);

    // Browser-specific screenshot
    await page.screenshot({ 
      path: `test-results/browser_${browserName}_${Date.now()}.png`, 
      fullPage: true 
    });

    console.log(`✅ ${browserName}: Cross-browser test passed`);
  });

  test('3. API Integration & Data Quality Test', async ({ request }) => {
    console.log('\n🔌 API INTEGRATION & DATA QUALITY TEST');
    console.log('=====================================');

    // Health check
    try {
      const healthResponse = await request.get(`${TEST_CONFIG.backendURL}/api/health`);
      expect(healthResponse.ok()).toBe(true);
      
      const healthData = await healthResponse.json();
      console.log(`✅ Backend health status: ${healthData.status}`);

      // API keys validation
      if (healthData.api_keys_configured) {
        const workingKeys = Object.values(healthData.api_keys_configured).filter(Boolean).length;
        const totalKeys = Object.keys(healthData.api_keys_configured).length;
        console.log(`📊 API keys configured: ${workingKeys}/${totalKeys}`);
        
        expect(workingKeys).toBeGreaterThan(0);
      }

    } catch (error) {
      console.log(`❌ Backend connection failed: ${error.message}`);
      throw error;
    }

    // Test analysis endpoint
    const testBrand = 'Apple';
    console.log(`\n🧪 Testing analysis endpoint with brand: ${testBrand}`);

    try {
      const analyzeResponse = await request.post(`${TEST_CONFIG.backendURL}/api/analyze`, {
        data: { company_name: testBrand },
        headers: { 'Content-Type': 'application/json' }
      });

      if (analyzeResponse.ok()) {
        const analyzeData = await analyzeResponse.json();
        console.log(`✅ Analysis initiated: ${analyzeData.data?.analysis_id || 'ID not provided'}`);
        
        // If we get an analysis ID, test status endpoint
        if (analyzeData.data?.analysis_id) {
          await new Promise(resolve => setTimeout(resolve, 5000));
          
          const statusResponse = await request.get(
            `${TEST_CONFIG.backendURL}/api/analyze/${analyzeData.data.analysis_id}/status`
          );
          
          if (statusResponse.ok()) {
            const statusData = await statusResponse.json();
            console.log(`✅ Status endpoint working: ${statusData.data?.status || 'Status not provided'}`);
          }
        }
      } else {
        console.log(`⚠️ Analysis endpoint returned: ${analyzeResponse.status()}`);
      }

    } catch (error) {
      console.log(`❌ Analysis API test failed: ${error.message}`);
    }

    console.log('✅ API integration test completed');
  });
});

// Test teardown
test.afterEach(async ({ page }) => {
  // Clean up any remaining downloads or temporary files
  await page.close();
});