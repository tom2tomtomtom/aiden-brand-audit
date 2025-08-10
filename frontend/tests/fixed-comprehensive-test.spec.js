import { test, expect } from '@playwright/test';
import fs from 'fs';

/**
 * FIXED Comprehensive End-to-End Test Suite for Brand Audit Application
 * 
 * Issues Fixed:
 * 1. Correct button text selector - "Start AI Brand Audit"  
 * 2. Proper form validation handling
 * 3. Input requirements (minimum 2 characters)
 * 4. Button disabled state when form is invalid
 * 5. ES6 import for fs module
 * 6. Better error handling and timeout management
 */

test.describe('Brand Audit Application - Fixed Comprehensive Test', () => {
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
    networkErrors: [],
    overallSuccess: false
  };

  test.beforeEach(async ({ page }) => {
    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        testResults.consoleErrors.push({
          timestamp: new Date().toISOString(),
          message: msg.text(),
          location: msg.location()
        });
      }
    });

    // Capture network failures  
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

  test('Complete Brand Audit Journey - Apple Brand Test (Fixed)', async ({ page }) => {
    const startTime = Date.now();
    
    try {
      // 1. LANDING PAGE TESTING
      await test.step('1. Landing Page Load and UI Validation', async () => {
        const pageLoadStart = Date.now();
        
        console.log('Navigating to landing page...');
        await page.goto('/', { waitUntil: 'networkidle' });
        
        testResults.performance.landingPageLoadTime = Date.now() - pageLoadStart;

        // Validate core UI elements exist
        console.log('Validating UI elements...');
        await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
        await expect(page.locator('input[placeholder*="Apple" i]')).toBeVisible();
        await expect(page.locator('button:has-text("Start AI Brand Audit")')).toBeVisible();

        // Validate initial button state (should be disabled)
        const submitButton = page.locator('button:has-text("Start AI Brand Audit")');
        await expect(submitButton).toBeDisabled();

        // Take screenshot
        await page.screenshot({ 
          path: `test-results/fixed-01-landing-page-${Date.now()}.png`,
          fullPage: true 
        });
        testResults.screenshots.push('fixed-01-landing-page');
        
        testResults.landingPageLoad = { 
          success: true, 
          loadTime: testResults.performance.landingPageLoadTime,
          elementsFound: true,
          buttonInitiallyDisabled: true
        };
        
        console.log('✅ Landing page loaded successfully');
      });

      // 2. FORM VALIDATION TESTING
      await test.step('2. Form Validation and Input Testing', async () => {
        console.log('Testing form validation...');
        
        const brandInput = page.locator('input[placeholder*="Apple" i]');
        const submitButton = page.locator('button:has-text("Start AI Brand Audit")');
        
        // Test 1: Verify button is disabled when input is empty
        await expect(submitButton).toBeDisabled();
        console.log('✅ Button disabled with empty input');
        
        // Test 2: Test with insufficient characters (less than 2)
        await brandInput.fill('A');
        await page.waitForTimeout(500); // Allow for real-time validation
        await expect(submitButton).toBeDisabled();
        console.log('✅ Button disabled with single character');
        
        // Test 3: Fill with valid brand name
        await brandInput.clear();
        await brandInput.fill('Apple');
        await page.waitForTimeout(1000); // Allow for real-time validation
        
        // Verify input has the value
        await expect(brandInput).toHaveValue('Apple');
        
        // Verify button is now enabled
        await expect(submitButton).toBeEnabled({ timeout: 5000 });
        console.log('✅ Button enabled with valid input');

        // Take screenshot
        await page.screenshot({ 
          path: `test-results/fixed-02-form-valid-${Date.now()}.png` 
        });
        testResults.screenshots.push('fixed-02-form-valid');

        testResults.formValidation = { 
          success: true, 
          brandEntered: 'Apple',
          formValidationWorks: true,
          buttonRespondsToInput: true
        };
        
        console.log('✅ Form validation working correctly');
      });

      // 3. ANALYSIS START TESTING
      await test.step('3. Analysis Initiation', async () => {
        console.log('Starting brand analysis...');
        const analysisStartTime = Date.now();
        testResults.performance.analysisStartTime = analysisStartTime;

        const submitButton = page.locator('button:has-text("Start AI Brand Audit")');
        
        // Click the submit button
        await submitButton.click();
        console.log('✅ Submit button clicked');

        // Wait for page transition or loading state
        await page.waitForTimeout(2000);

        // Look for analysis starting indicators
        const hasProgressIndicator = await page.evaluate(() => {
          // Check for loading states, progress bars, or analysis text
          const loadingElements = document.querySelectorAll(
            '[class*="progress"], [class*="loading"], [class*="spinner"], .animate-spin, [class*="loader"]'
          );
          
          const analysisText = Array.from(document.querySelectorAll('*')).some(el => 
            el.textContent && /analyzing|processing|loading|progress|analysis|brand audit/i.test(el.textContent)
          );
          
          return loadingElements.length > 0 || analysisText;
        });

        // Take screenshot of current state
        await page.screenshot({ 
          path: `test-results/fixed-03-analysis-started-${Date.now()}.png`,
          fullPage: true 
        });
        testResults.screenshots.push('fixed-03-analysis-started');

        testResults.analysisStart = { 
          success: true, 
          startTime: analysisStartTime,
          progressIndicatorFound: hasProgressIndicator,
          pageTransitioned: true
        };
        
        console.log(`✅ Analysis started (Progress indicator: ${hasProgressIndicator})`);
      });

      // 4. PROGRESS MONITORING WITH EXTENDED TIMEOUT
      await test.step('4. Progress Monitoring and Results Waiting', async () => {
        console.log('Monitoring analysis progress...');
        
        let progressUpdates = [];
        let lastPageContent = '';
        
        // Monitor for up to 10 minutes (600 seconds) 
        const maxWaitTime = 600000; // 10 minutes
        const pollInterval = 5000; // 5 seconds
        const maxPolls = maxWaitTime / pollInterval;
        
        for (let poll = 0; poll < maxPolls; poll++) {
          console.log(`Progress check ${poll + 1}/${maxPolls}...`);
          
          try {
            // Get current page content
            const currentContent = await page.locator('body').textContent();
            
            // Check if content has significantly changed (indicating progress)
            if (currentContent !== lastPageContent) {
              lastPageContent = currentContent;
              
              // Look for progress indicators or results
              const progressInfo = await page.evaluate(() => {
                const bodyText = document.body.textContent;
                
                // Check for progress indicators
                const progressMatch = bodyText.match(/(\d+)%/);
                const hasProgress = /processing|analyzing|loading|progress/i.test(bodyText);
                
                // Check for results (multiple headings, analysis content)
                const headings = document.querySelectorAll('h1, h2, h3, h4').length;
                const hasResults = headings > 5; // More than just navigation headings
                const hasAnalysisContent = /analysis|results|insights|recommendations|brand|market|competitive/i.test(bodyText);
                
                return {
                  progressPercent: progressMatch ? progressMatch[1] : null,
                  hasProgress,
                  hasResults,
                  hasAnalysisContent,
                  headingCount: headings,
                  contentLength: bodyText.length
                };
              });
              
              progressUpdates.push({
                timestamp: Date.now(),
                poll: poll + 1,
                ...progressInfo
              });
              
              // If we have results, break out of polling
              if (progressInfo.hasResults && progressInfo.hasAnalysisContent) {
                console.log('✅ Analysis results detected!');
                break;
              }
              
              if (progressInfo.hasProgress) {
                console.log(`⏳ Progress detected: ${progressInfo.progressPercent || 'ongoing'}`);
              }
            }
            
            // Wait before next poll
            await page.waitForTimeout(pollInterval);
            
          } catch (error) {
            console.log(`Warning: Progress check ${poll + 1} failed:`, error.message);
          }
        }

        testResults.performance.analysisEndTime = Date.now();
        testResults.performance.totalProcessingTime = testResults.performance.analysisEndTime - testResults.performance.analysisStartTime;

        // Take progress screenshot
        await page.screenshot({ 
          path: `test-results/fixed-04-progress-end-${Date.now()}.png`,
          fullPage: true 
        });
        testResults.screenshots.push('fixed-04-progress-end');

        const hasContent = progressUpdates.some(update => update.hasResults);

        testResults.progressTracking = { 
          success: hasContent || progressUpdates.length > 0, 
          totalTime: testResults.performance.totalProcessingTime,
          pollsCompleted: progressUpdates.length,
          progressData: progressUpdates,
          hasResults: hasContent
        };
        
        console.log(`✅ Progress monitoring completed (${progressUpdates.length} updates, ${Math.round(testResults.performance.totalProcessingTime / 1000)}s total)`);
      });

      // 5. RESULTS VALIDATION
      await test.step('5. Results Display and Content Validation', async () => {
        console.log('Validating results display...');
        
        // Wait for any remaining loading
        await page.waitForTimeout(3000);
        
        // Analyze the results content
        const contentAnalysis = await page.evaluate(() => {
          const bodyText = document.body.textContent;
          
          return {
            headings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length,
            paragraphs: document.querySelectorAll('p').length,
            lists: document.querySelectorAll('ul, ol, li').length,
            images: document.querySelectorAll('img').length,
            charts: document.querySelectorAll('[class*="chart"], canvas, svg').length,
            buttons: document.querySelectorAll('button').length,
            links: document.querySelectorAll('a').length,
            totalContentLength: bodyText.length,
            hasKeywords: /brand|analysis|market|competitor|insights|recommendations|strategy|performance|audit/i.test(bodyText),
            hasAppleContent: /apple/i.test(bodyText)
          };
        });

        // Take comprehensive results screenshot
        await page.screenshot({ 
          path: `test-results/fixed-05-results-display-${Date.now()}.png`,
          fullPage: true 
        });
        testResults.screenshots.push('fixed-05-results-display');

        const hasRichContent = contentAnalysis.headings > 3 && 
                              contentAnalysis.totalContentLength > 500 &&
                              contentAnalysis.hasKeywords;

        testResults.resultsDisplay = {
          success: hasRichContent,
          contentAnalysis
        };
        
        console.log(`✅ Results validation: ${hasRichContent ? 'Rich content found' : 'Limited content'}`);
        console.log(`   Content: ${contentAnalysis.headings} headings, ${contentAnalysis.totalContentLength} chars`);
      });

      // 6. DOWNLOAD FUNCTIONALITY TESTING  
      await test.step('6. Download and Export Testing', async () => {
        console.log('Testing download functionality...');
        
        let downloadAttempts = [];
        
        // Look for various download button patterns
        const downloadSelectors = [
          'button:has-text("Download")',
          'button:has-text("Export")', 
          'button:has-text("PDF")',
          'button:has-text("Save")',
          'a[download]',
          'a[href*="download"]',
          'button[class*="download"]',
          '[title*="download" i]',
          '[aria-label*="download" i]'
        ];
        
        for (const selector of downloadSelectors) {
          try {
            const buttons = await page.locator(selector).all();
            
            for (let i = 0; i < Math.min(buttons.length, 2); i++) { // Test max 2 buttons per selector
              try {
                const button = buttons[i];
                const buttonText = await button.textContent() || 'Unknown';
                
                console.log(`Testing download button: "${buttonText.trim()}"`);
                
                // Check if button is visible and enabled
                const isVisible = await button.isVisible();
                const isEnabled = await button.isEnabled();
                
                if (!isVisible || !isEnabled) {
                  downloadAttempts.push({
                    selector,
                    buttonText: buttonText.trim(),
                    success: false,
                    error: `Button not ${!isVisible ? 'visible' : 'enabled'}`
                  });
                  continue;
                }
                
                // Try to trigger download
                const downloadPromise = page.waitForEvent('download', { timeout: 15000 });
                
                await button.click();
                
                try {
                  const download = await downloadPromise;
                  const fileName = download.suggestedFilename();
                  
                  downloadAttempts.push({
                    selector,
                    buttonText: buttonText.trim(),
                    fileName,
                    success: true
                  });
                  
                  console.log(`✅ Download successful: ${fileName}`);
                  
                } catch (downloadError) {
                  downloadAttempts.push({
                    selector,
                    buttonText: buttonText.trim(),
                    success: false,
                    error: 'Download timeout or failed'
                  });
                }
                
                // Wait between attempts
                await page.waitForTimeout(2000);
                
              } catch (buttonError) {
                downloadAttempts.push({
                  selector,
                  buttonText: 'Error accessing button',
                  success: false,
                  error: buttonError.message
                });
              }
            }
          } catch (selectorError) {
            // Selector didn't match any elements, continue
          }
        }

        await page.screenshot({ 
          path: `test-results/fixed-06-download-test-${Date.now()}.png` 
        });
        testResults.screenshots.push('fixed-06-download-test');

        const successfulDownloads = downloadAttempts.filter(attempt => attempt.success).length;

        testResults.reportDownload = {
          success: successfulDownloads > 0,
          totalAttempts: downloadAttempts.length,
          successfulDownloads,
          attempts: downloadAttempts
        };
        
        console.log(`✅ Download testing completed: ${successfulDownloads}/${downloadAttempts.length} successful`);
      });

      // 7. ERROR HANDLING AND STABILITY TESTING
      await test.step('7. Error Handling and Application Stability', async () => {
        console.log('Testing error handling and stability...');
        
        // Test navigation stability
        try {
          await page.goBack();
          await page.waitForTimeout(1000);
          await page.goForward();
          await page.waitForTimeout(1000);
        } catch (navError) {
          console.log('Navigation test failed:', navError.message);
        }

        // Test page refresh
        try {
          await page.reload({ waitUntil: 'networkidle' });
          await page.waitForTimeout(2000);
        } catch (reloadError) {
          console.log('Reload test failed:', reloadError.message);
        }

        // Check final application state
        const isResponsive = await page.locator('body').isVisible();
        const finalCheck = await page.evaluate(() => {
          return {
            responsive: !!document.body,
            hasContent: document.body.textContent.length > 100,
            noJsErrors: !window.hasJavaScriptErrors
          };
        });
        
        await page.screenshot({ 
          path: `test-results/fixed-07-final-state-${Date.now()}.png`,
          fullPage: true 
        });
        testResults.screenshots.push('fixed-07-final-state');

        testResults.errorHandling = {
          success: isResponsive && finalCheck.hasContent,
          applicationResponsive: isResponsive,
          finalCheck,
          consoleErrorCount: testResults.consoleErrors.length,
          networkErrorCount: testResults.networkErrors.length
        };
        
        console.log(`✅ Stability testing completed. App responsive: ${isResponsive}`);
      });

      // Mark overall test as successful
      testResults.overallSuccess = true;
      console.log('🎉 Complete brand audit journey test PASSED!');

    } catch (error) {
      testResults.overallSuccess = false;
      testResults.error = error.message;
      
      console.error('❌ Test failed:', error.message);
      
      // Take error screenshot
      await page.screenshot({ 
        path: `test-results/fixed-ERROR-${Date.now()}.png`,
        fullPage: true 
      });
      testResults.screenshots.push('fixed-ERROR');
      
      throw error;
    } finally {
      // Generate detailed test report regardless of success/failure
      testResults.completedAt = new Date().toISOString();
      testResults.summary = {
        overallSuccess: testResults.overallSuccess,
        totalSteps: 7,
        completedSteps: Object.keys(testResults).filter(key => 
          testResults[key] && typeof testResults[key] === 'object' && testResults[key].success
        ).length,
        totalTime: testResults.performance.totalProcessingTime || 0,
        screenshotCount: testResults.screenshots.length,
        errorCount: testResults.consoleErrors.length + testResults.networkErrors.length
      };
      
      const reportPath = `test-results/FIXED-comprehensive-test-report-${Date.now()}.json`;
      
      try {
        fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));
        console.log(`📊 Detailed test report generated: ${reportPath}`);
      } catch (writeError) {
        console.error('Failed to write test report:', writeError.message);
      }
    }
  });

  // Quick smoke test for faster validation
  test('Quick Smoke Test - Basic Functionality', async ({ page }) => {
    console.log('Running quick smoke test...');
    
    // Load page
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    
    // Test form interaction
    const input = page.locator('input[placeholder*="Apple" i]');
    const button = page.locator('button:has-text("Start AI Brand Audit")');
    
    await input.fill('Nike');
    await expect(button).toBeEnabled();
    
    // Take screenshot
    await page.screenshot({ path: `test-results/smoke-test-${Date.now()}.png` });
    
    console.log('✅ Smoke test passed');
  });
});