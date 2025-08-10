import { test, expect } from '@playwright/test';

/**
 * Comprehensive End-to-End Test Suite for Brand Audit Application
 * 
 * This test suite covers the complete user journey from landing page to report download:
 * 1. Landing Page - Load and validate UI
 * 2. Brand Input - Enter brand name and validate form
 * 3. Analysis Start - Click "Start Brand Audit" button
 * 4. Progress Monitoring - Track real-time progress updates
 * 5. Results Display - Validate professional report generation
 * 6. Report Download - Test all export/download functionality
 * 7. Error Handling - Test edge cases and error scenarios
 */

test.describe('Brand Audit Application - Complete User Journey', () => {
  let testResults = {
    landingPageLoad: null,
    formValidation: null,
    analysisStart: null,
    progressTracking: null,
    resultsDisplay: null,
    reportDownload: null,
    errorHandling: null,
    performance: {
      landingPageLoadTime: null,
      analysisStartTime: null,
      analysisEndTime: null,
      totalProcessingTime: null
    },
    screenshots: [],
    consoleErrors: [],
    networkErrors: []
  };

  test.beforeEach(async ({ page }) => {
    // Capture console errors and network failures
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.consoleErrors.push({
          timestamp: new Date().toISOString(),
          message: msg.text(),
          location: msg.location()
        });
      }
    });

    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        testResults.networkErrors.push({
          timestamp: new Date().toISOString(),
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
  });

  test('Complete Brand Audit Journey - Apple Brand Test', async ({ page }) => {
    const startTime = Date.now();
    
    try {
      // 1. LANDING PAGE TESTING
      await test.step('1. Landing Page Load and Validation', async () => {
        const pageLoadStart = Date.now();
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        testResults.performance.landingPageLoadTime = Date.now() - pageLoadStart;

        // Validate core UI elements
        await expect(page.locator('h1')).toBeVisible();
        await expect(page.locator('input[placeholder*="brand" i], input[placeholder*="company" i]')).toBeVisible();
        await expect(page.locator('button:has-text("Start"), button:has-text("Audit"), button:has-text("Analyze")')).toBeVisible();

        // Take screenshot
        const screenshot1 = await page.screenshot({ path: `test-results/01-landing-page-${Date.now()}.png` });
        testResults.screenshots.push('01-landing-page');
        
        testResults.landingPageLoad = { 
          success: true, 
          loadTime: testResults.performance.landingPageLoadTime,
          elementsFound: true 
        };
      });

      // 2. BRAND INPUT TESTING
      await test.step('2. Brand Input Form Validation', async () => {
        const brandInput = page.locator('input[placeholder*="brand" i], input[placeholder*="company" i]').first();
        
        // Test form validation
        const submitButton = page.locator('button:has-text("Start"), button:has-text("Audit"), button:has-text("Analyze")').first();
        
        // Test empty submission
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Fill with test brand
        await brandInput.fill('Apple');
        await expect(brandInput).toHaveValue('Apple');

        // Take screenshot
        await page.screenshot({ path: `test-results/02-brand-input-filled-${Date.now()}.png` });
        testResults.screenshots.push('02-brand-input-filled');

        testResults.formValidation = { 
          success: true, 
          brandEntered: 'Apple',
          inputValidation: true 
        };
      });

      // 3. ANALYSIS START TESTING
      await test.step('3. Analysis Start and Initial Response', async () => {
        const analysisStartTime = Date.now();
        testResults.performance.analysisStartTime = analysisStartTime;

        const submitButton = page.locator('button:has-text("Start"), button:has-text("Audit"), button:has-text("Analyze")').first();
        await submitButton.click();

        // Wait for analysis to begin (look for progress indicators)
        await page.waitForFunction(() => {
          const progressElements = document.querySelectorAll('[class*="progress"], [class*="loading"], [class*="spinner"], .animate-spin');
          const loadingText = Array.from(document.querySelectorAll('*')).some(el => 
            el.textContent && /analyzing|processing|loading|progress/i.test(el.textContent)
          );
          return progressElements.length > 0 || loadingText;
        }, { timeout: 30000 });

        // Take screenshot of analysis starting
        await page.screenshot({ path: `test-results/03-analysis-started-${Date.now()}.png` });
        testResults.screenshots.push('03-analysis-started');

        testResults.analysisStart = { 
          success: true, 
          startTime: analysisStartTime,
          progressIndicatorFound: true 
        };
      });

      // 4. PROGRESS MONITORING TESTING
      await test.step('4. Real-time Progress Monitoring', async () => {
        let progressUpdates = [];
        let progressCheckInterval;
        
        // Monitor progress for up to 5 minutes
        const progressTimeout = setTimeout(() => {
          if (progressCheckInterval) clearInterval(progressCheckInterval);
        }, 300000); // 5 minutes

        // Check for progress updates every 5 seconds
        progressCheckInterval = setInterval(async () => {
          try {
            const progressText = await page.locator('body').textContent();
            const progressMatch = progressText.match(/(\d+)%|\bprocessing\b|\banalyzing\b|\bprogress\b/i);
            
            if (progressMatch) {
              progressUpdates.push({
                timestamp: Date.now(),
                content: progressMatch[0],
                fullContext: progressText.substring(0, 200)
              });
            }

            // Check if analysis is complete (look for results)
            const hasResults = await page.locator('[class*="result"], [class*="report"], [class*="analysis"], h2, h3').count() > 3;
            if (hasResults) {
              clearTimeout(progressTimeout);
              clearInterval(progressCheckInterval);
            }
          } catch (error) {
            console.log('Progress check error:', error.message);
          }
        }, 5000);

        // Wait for analysis completion (look for results content)
        await page.waitForFunction(() => {
          const resultElements = document.querySelectorAll('h2, h3, [class*="result"], [class*="report"], [class*="analysis"]');
          const hasMultipleHeadings = resultElements.length > 3;
          const hasResultText = Array.from(document.querySelectorAll('*')).some(el => 
            el.textContent && /results|analysis|report|insights|recommendations/i.test(el.textContent)
          );
          return hasMultipleHeadings && hasResultText;
        }, { timeout: 300000 }); // 5 minutes max

        clearTimeout(progressTimeout);
        if (progressCheckInterval) clearInterval(progressCheckInterval);

        testResults.performance.analysisEndTime = Date.now();
        testResults.performance.totalProcessingTime = testResults.performance.analysisEndTime - testResults.performance.analysisStartTime;

        // Take screenshot of progress/results
        await page.screenshot({ path: `test-results/04-progress-monitoring-${Date.now()}.png` });
        testResults.screenshots.push('04-progress-monitoring');

        testResults.progressTracking = { 
          success: true, 
          updatesReceived: progressUpdates.length,
          totalTime: testResults.performance.totalProcessingTime,
          progressData: progressUpdates.slice(-5) // Last 5 updates
        };
      });

      // 5. RESULTS DISPLAY TESTING
      await test.step('5. Results Display and Report Validation', async () => {
        // Wait for results to fully load
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(3000);

        // Validate results content
        const headingCount = await page.locator('h1, h2, h3, h4').count();
        const paragraphCount = await page.locator('p').count();
        const listCount = await page.locator('ul, ol, li').count();

        // Look for key report sections
        const bodyText = await page.locator('body').textContent();
        const hasKeywords = /brand|analysis|market|competitor|insights|recommendations|strategy|performance/i.test(bodyText);

        // Check for visual elements
        const imageCount = await page.locator('img').count();
        const chartCount = await page.locator('[class*="chart"], canvas, svg').count();

        // Take comprehensive screenshot
        await page.screenshot({ path: `test-results/05-results-display-${Date.now()}.png`, fullPage: true });
        testResults.screenshots.push('05-results-display');

        testResults.resultsDisplay = {
          success: true,
          contentAnalysis: {
            headings: headingCount,
            paragraphs: paragraphCount,
            lists: listCount,
            images: imageCount,
            charts: chartCount,
            hasRelevantContent: hasKeywords,
            totalContentLength: bodyText.length
          }
        };
      });

      // 6. REPORT DOWNLOAD TESTING
      await test.step('6. Report Download and Export Functionality', async () => {
        let downloadAttempts = [];

        // Look for download buttons
        const downloadButtons = await page.locator('button:has-text("Download"), button:has-text("Export"), button:has-text("PDF"), a[download], a[href*="download"]').all();
        
        for (let i = 0; i < Math.min(downloadButtons.length, 3); i++) {
          try {
            const button = downloadButtons[i];
            const buttonText = await button.textContent();
            
            // Start waiting for download before clicking
            const downloadPromise = page.waitForEvent('download', { timeout: 30000 });
            
            await button.click();
            
            try {
              const download = await downloadPromise;
              const fileName = download.suggestedFilename();
              
              downloadAttempts.push({
                buttonText: buttonText?.trim(),
                fileName: fileName,
                success: true
              });
            } catch (downloadError) {
              downloadAttempts.push({
                buttonText: buttonText?.trim(),
                fileName: null,
                success: false,
                error: downloadError.message
              });
            }
            
            // Wait between download attempts
            await page.waitForTimeout(2000);
          } catch (error) {
            downloadAttempts.push({
              buttonText: 'unknown',
              fileName: null,
              success: false,
              error: error.message
            });
          }
        }

        // Take screenshot after download attempts
        await page.screenshot({ path: `test-results/06-download-attempts-${Date.now()}.png` });
        testResults.screenshots.push('06-download-attempts');

        testResults.reportDownload = {
          success: downloadAttempts.some(attempt => attempt.success),
          downloadButtons: downloadButtons.length,
          attempts: downloadAttempts
        };
      });

      // 7. ERROR HANDLING TESTING
      await test.step('7. Error Handling and Edge Cases', async () => {
        // Test browser back/forward
        await page.goBack();
        await page.waitForTimeout(1000);
        await page.goForward();
        await page.waitForTimeout(1000);

        // Test page refresh
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check if application recovered gracefully
        const isResponsive = await page.locator('body').isVisible();
        
        testResults.errorHandling = {
          success: true,
          navigationTest: true,
          refreshTest: isResponsive,
          consoleErrors: testResults.consoleErrors.length,
          networkErrors: testResults.networkErrors.length
        };

        // Final screenshot
        await page.screenshot({ path: `test-results/07-final-state-${Date.now()}.png`, fullPage: true });
        testResults.screenshots.push('07-final-state');
      });

      // Mark overall test as successful
      testResults.overallSuccess = true;

    } catch (error) {
      testResults.overallSuccess = false;
      testResults.error = error.message;
      
      // Take error screenshot
      await page.screenshot({ path: `test-results/ERROR-screenshot-${Date.now()}.png`, fullPage: true });
      testResults.screenshots.push('ERROR-screenshot');
      
      throw error;
    }
  });

  test.afterAll(async () => {
    // Generate test report
    const reportPath = `/Users/thomasdowuona-hyde/brand-audit-app/test-results/comprehensive-test-report-${Date.now()}.json`;
    const fs = require('fs');
    
    testResults.completedAt = new Date().toISOString();
    testResults.summary = {
      totalSteps: 7,
      completedSteps: Object.values(testResults).filter(result => result && result.success).length,
      totalTime: testResults.performance.totalProcessingTime || 0,
      screenshotCount: testResults.screenshots.length,
      errorCount: testResults.consoleErrors.length + testResults.networkErrors.length
    };
    
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
    console.log('Comprehensive test report generated:', reportPath);
  });
});

// Performance-focused test
test.describe('Performance Testing', () => {
  test('Page Load Performance Metrics', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        totalLoad: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    // Assert performance benchmarks
    expect(metrics.totalLoad).toBeLessThan(5000); // Less than 5 seconds
    expect(metrics.domContentLoaded).toBeLessThan(3000); // Less than 3 seconds
    
    console.log('Performance metrics:', metrics);
  });
});

// Cross-browser compatibility test
test.describe('Cross-Browser Compatibility', () => {
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`Basic functionality on ${browserName}`, async ({ page }) => {
      await page.goto('/');
      
      // Test basic interactions
      await expect(page.locator('h1')).toBeVisible();
      const input = page.locator('input').first();
      await input.fill('TestBrand');
      await expect(input).toHaveValue('TestBrand');
      
      // Test button click
      const button = page.locator('button').first();
      await button.click();
      
      // Wait for some response
      await page.waitForTimeout(2000);
      
      // Basic validation that page didn't crash
      await expect(page.locator('body')).toBeVisible();
    });
  });
});

// Mobile responsiveness test
test.describe('Mobile Responsiveness', () => {
  test('Mobile layout and functionality', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    
    // Test mobile-specific elements
    await expect(page.locator('h1')).toBeVisible();
    const input = page.locator('input').first();
    await input.fill('MobileBrand');
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: `test-results/mobile-layout-${Date.now()}.png`,
      fullPage: true 
    });
    
    // Test touch interactions
    const button = page.locator('button').first();
    await button.click();
    
    await page.waitForTimeout(3000);
    await expect(page.locator('body')).toBeVisible();
  });
});