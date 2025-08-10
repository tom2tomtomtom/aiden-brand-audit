import { test, expect } from '@playwright/test';

test.describe('Download Functionality Investigation', () => {
  test('Investigate download buttons and export functionality', async ({ page }) => {
    console.log('Starting download investigation...');
    
    // Navigate and complete analysis
    await page.goto('/');
    const input = page.locator('input[placeholder*="Apple" i]');
    const button = page.locator('button:has-text("Start AI Brand Audit")');
    
    await input.fill('Tesla');
    await button.click();
    
    // Wait for results (up to 2 minutes)
    await page.waitForFunction(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
      const bodyText = document.body.textContent;
      return headings > 5 && /analysis|results|insights|brand/i.test(bodyText);
    }, { timeout: 120000 });
    
    console.log('Analysis completed, investigating download options...');
    
    // Take screenshot of results page
    await page.screenshot({ 
      path: 'test-results/download-investigation-results.png',
      fullPage: true 
    });
    
    // Get all interactive elements that could be download buttons
    const allButtons = await page.locator('button, a, [role="button"], [onclick], [class*="download"], [class*="export"], [title*="download"], [aria-label*="download"]').all();
    
    console.log(`Found ${allButtons.length} interactive elements`);
    
    const elementInfo = [];
    for (let i = 0; i < allButtons.length; i++) {
      try {
        const element = allButtons[i];
        const tagName = await element.evaluate(el => el.tagName);
        const text = await element.textContent() || '';
        const className = await element.getAttribute('class') || '';
        const title = await element.getAttribute('title') || '';
        const ariaLabel = await element.getAttribute('aria-label') || '';
        const href = await element.getAttribute('href') || '';
        const onclick = await element.getAttribute('onclick') || '';
        const isVisible = await element.isVisible();
        const isEnabled = await element.isEnabled();
        
        elementInfo.push({
          index: i,
          tagName,
          text: text.trim(),
          className,
          title,
          ariaLabel,
          href,
          onclick,
          isVisible,
          isEnabled,
          couldBeDownload: /download|export|pdf|save|report/i.test(text + className + title + ariaLabel + href + onclick)
        });
      } catch (error) {
        elementInfo.push({
          index: i,
          error: error.message
        });
      }
    }
    
    // Log all potentially download-related elements
    const downloadElements = elementInfo.filter(el => el.couldBeDownload);
    console.log(`Found ${downloadElements.length} potential download elements:`);
    downloadElements.forEach(el => {
      console.log(`  ${el.tagName}: "${el.text}" (visible: ${el.isVisible}, enabled: ${el.isEnabled})`);
    });
    
    // Check page content for download-related text
    const pageText = await page.locator('body').textContent();
    const hasDownloadText = /download|export|pdf|save|report/i.test(pageText);
    
    console.log(`Page contains download-related text: ${hasDownloadText}`);
    
    // Look for common download patterns in the page
    const downloadPatterns = [
      'Download Report',
      'Export PDF',
      'Save Report',
      'Download Analysis',
      'Export Results',
      'Generate PDF',
      'Download',
      'Export',
      'PDF'
    ];
    
    const foundPatterns = downloadPatterns.filter(pattern => 
      new RegExp(pattern, 'i').test(pageText)
    );
    
    console.log(`Found download patterns: ${foundPatterns.join(', ')}`);
    
    // Check if this is a progress page vs results page
    const isProgressPage = /progress|analyzing|processing|loading/i.test(pageText);
    const isResultsPage = /results|analysis|insights|recommendations/i.test(pageText) && !isProgressPage;
    
    console.log(`Page type - Progress: ${isProgressPage}, Results: ${isResultsPage}`);
    
    // Generate investigation report
    const report = {
      timestamp: new Date().toISOString(),
      totalInteractiveElements: allButtons.length,
      potentialDownloadElements: downloadElements.length,
      downloadElementDetails: downloadElements,
      hasDownloadText,
      foundPatterns,
      isProgressPage,
      isResultsPage,
      pageContentLength: pageText.length,
      recommendations: []
    };
    
    if (downloadElements.length === 0) {
      report.recommendations.push('No download buttons found - may need to wait longer for results or check different page');
    }
    
    if (isProgressPage) {
      report.recommendations.push('Currently on progress page - download options may appear after completion');
    }
    
    if (!isResultsPage && !isProgressPage) {
      report.recommendations.push('Page may have loaded incorrectly - check for navigation issues');
    }
    
    console.log('Investigation Report:', JSON.stringify(report, null, 2));
    
    // Save detailed report
    const fs = require('fs');
    fs.writeFileSync('test-results/download-investigation-report.json', JSON.stringify(report, null, 2));
    
    // Try to wait longer and check again if we're on progress page
    if (isProgressPage) {
      console.log('Waiting longer for analysis completion...');
      
      try {
        // Wait up to 5 more minutes for completion
        await page.waitForFunction(() => {
          const text = document.body.textContent;
          return !/progress|analyzing|processing|loading/i.test(text) && 
                 /results|analysis|insights|recommendations|download|export/i.test(text);
        }, { timeout: 300000 });
        
        // Take another screenshot
        await page.screenshot({ 
          path: 'test-results/download-investigation-final-results.png',
          fullPage: true 
        });
        
        // Re-check for download buttons
        const finalButtons = await page.locator('button, a, [role="button"]').all();
        const finalDownloadElements = [];
        
        for (const button of finalButtons) {
          const text = await button.textContent() || '';
          const className = await button.getAttribute('class') || '';
          
          if (/download|export|pdf|save|report/i.test(text + className)) {
            finalDownloadElements.push({
              text: text.trim(),
              className,
              isVisible: await button.isVisible(),
              isEnabled: await button.isEnabled()
            });
          }
        }
        
        console.log(`Final check found ${finalDownloadElements.length} download elements:`, finalDownloadElements);
        
      } catch (waitError) {
        console.log('Timeout waiting for results completion:', waitError.message);
      }
    }
  });
});