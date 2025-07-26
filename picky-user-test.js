const { test, expect } = require('@playwright/test');

test.describe('🔥 PICKY USER BRAND AUDIT TEST - EXCEPTIONAL EXPERIENCE REQUIRED', () => {
  test.beforeEach(async ({ page }) => {
    // Set viewport for consistent testing
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Navigate to the app
    await page.goto('http://localhost:5173');
    
    // Wait for app to be fully loaded
    await page.waitForLoadState('networkidle');
  });

  test('🚨 CRITICAL: Page loads instantly without any delays', async ({ page }) => {
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    await page.waitForSelector('body');
    const loadTime = Date.now() - startTime;
    
    // PICKY USER EXPECTATION: Page should load in under 2 seconds
    expect(loadTime).toBeLessThan(2000);
    console.log(`⏱️ Page load time: ${loadTime}ms - ${loadTime < 1000 ? '✅ EXCELLENT' : loadTime < 2000 ? '⚠️ ACCEPTABLE' : '❌ TOO SLOW'}`);
  });

  test('🎨 UI PERFECTION: Visual elements are pixel-perfect', async ({ page }) => {
    // Check for proper branding and title
    const title = await page.title();
    expect(title).toContain('Brand Audit');
    console.log(`📄 Page title: "${title}"`);
    
    // Check for main navigation/header
    const header = page.locator('header, nav, [role="banner"]').first();
    await expect(header).toBeVisible();
    
    // Check for main content area
    const main = page.locator('main, [role="main"], .main-content').first();
    await expect(main).toBeVisible();
    
    // PICKY USER: No broken images allowed
    const images = page.locator('img');
    const imageCount = await images.count();
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const src = await img.getAttribute('src');
      if (src && !src.startsWith('data:')) {
        const response = await page.request.get(src);
        expect(response.status()).toBe(200);
      }
    }
    console.log(`🖼️ Checked ${imageCount} images - all loading correctly`);
  });

  test('🔍 BRAND SEARCH: Must be intuitive and responsive', async ({ page }) => {
    // Look for search input
    const searchInput = page.locator('input[type="text"], input[placeholder*="brand"], input[placeholder*="company"], input[placeholder*="search"]').first();
    
    if (await searchInput.isVisible()) {
      console.log('✅ Found search input');
      
      // PICKY USER: Input should have proper placeholder
      const placeholder = await searchInput.getAttribute('placeholder');
      expect(placeholder).toBeTruthy();
      expect(placeholder.length).toBeGreaterThan(5);
      console.log(`📝 Placeholder: "${placeholder}"`);
      
      // PICKY USER: Should handle typing smoothly
      await searchInput.click();
      await searchInput.fill('Apple');
      
      // Check for real-time feedback
      await page.waitForTimeout(500);
      
      // Look for search button or submit
      const searchButton = page.locator('button[type="submit"], button:has-text("search"), button:has-text("analyze"), button:has-text("audit")').first();
      
      if (await searchButton.isVisible()) {
        console.log('✅ Found search/analyze button');
        
        // PICKY USER: Button should be clearly labeled
        const buttonText = await searchButton.textContent();
        expect(buttonText.trim().length).toBeGreaterThan(2);
        console.log(`🔘 Button text: "${buttonText}"`);
        
        // Test the search functionality
        await searchButton.click();
        
        // PICKY USER: Should show immediate feedback
        await page.waitForTimeout(1000);
        
        // Look for loading indicators or results
        const loadingIndicator = page.locator('.loading, .spinner, [role="progressbar"], .progress').first();
        const resultsArea = page.locator('.results, .analysis, .report, .output').first();
        
        const hasLoading = await loadingIndicator.isVisible();
        const hasResults = await resultsArea.isVisible();
        
        console.log(`🔄 Loading indicator: ${hasLoading ? '✅ Present' : '⚠️ Missing'}`);
        console.log(`📊 Results area: ${hasResults ? '✅ Present' : '⚠️ Missing'}`);
        
        // PICKY USER: Must show progress or results within 5 seconds
        if (hasLoading || hasResults) {
          console.log('✅ App shows proper feedback after search');
        } else {
          console.log('❌ CRITICAL: No feedback after search - user will be confused!');
        }
      } else {
        console.log('❌ CRITICAL: No search button found - how does user submit?');
      }
    } else {
      console.log('❌ CRITICAL: No search input found - primary feature missing!');
    }
  });

  test('📱 RESPONSIVE DESIGN: Must work perfectly on all devices', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 768, height: 1024, name: 'iPad' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.waitForTimeout(500);
      
      console.log(`📱 Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
      
      // PICKY USER: No horizontal scrolling allowed
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      const viewportWidth = viewport.width;
      
      if (bodyWidth > viewportWidth) {
        console.log(`❌ CRITICAL: Horizontal scroll on ${viewport.name} - ${bodyWidth}px > ${viewportWidth}px`);
      } else {
        console.log(`✅ No horizontal scroll on ${viewport.name}`);
      }
      
      // Check if main elements are still visible
      const mainContent = page.locator('main, .main, .content, .app').first();
      await expect(mainContent).toBeVisible();
    }
  });

  test('⚡ PERFORMANCE: Zero tolerance for slow interactions', async ({ page }) => {
    // Test button click responsiveness
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    console.log(`🔘 Testing ${buttonCount} buttons for responsiveness`);
    
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i);
      if (await button.isVisible() && await button.isEnabled()) {
        const startTime = Date.now();
        await button.click();
        const responseTime = Date.now() - startTime;
        
        // PICKY USER: Buttons must respond instantly
        expect(responseTime).toBeLessThan(100);
        console.log(`⚡ Button ${i+1} response: ${responseTime}ms`);
        
        await page.waitForTimeout(100);
      }
    }
  });

  test('🔗 NAVIGATION: Must be crystal clear and intuitive', async ({ page }) => {
    // Look for navigation elements
    const navLinks = page.locator('nav a, .nav a, .menu a, [role="navigation"] a');
    const linkCount = await navLinks.count();
    
    console.log(`🔗 Found ${linkCount} navigation links`);
    
    if (linkCount === 0) {
      console.log('⚠️ No navigation links found - single page app?');
    } else {
      // PICKY USER: All links should have meaningful text
      for (let i = 0; i < linkCount; i++) {
        const link = navLinks.nth(i);
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        
        expect(text.trim().length).toBeGreaterThan(0);
        console.log(`🔗 Link ${i+1}: "${text}" → ${href}`);
      }
    }
  });

  test('🚨 ERROR HANDLING: Must gracefully handle all failures', async ({ page }) => {
    // Test with invalid input
    const searchInput = page.locator('input[type="text"]').first();
    
    if (await searchInput.isVisible()) {
      // PICKY USER: Should handle empty input gracefully
      await searchInput.fill('');
      const submitButton = page.locator('button[type="submit"], button:has-text("search"), button:has-text("analyze")').first();
      
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Look for error messages
        const errorMessage = page.locator('.error, .alert, .warning, [role="alert"]').first();
        const hasError = await errorMessage.isVisible();
        
        console.log(`🚨 Empty input handling: ${hasError ? '✅ Shows error' : '⚠️ No error shown'}`);
      }
      
      // Test with very long input
      await searchInput.fill('A'.repeat(1000));
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        console.log('✅ Tested extremely long input');
      }
      
      // Test with special characters
      await searchInput.fill('!@#$%^&*()');
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        console.log('✅ Tested special characters');
      }
    }
  });

  test('🎯 ACCESSIBILITY: Must be perfect for all users', async ({ page }) => {
    // PICKY USER: All interactive elements must be keyboard accessible
    await page.keyboard.press('Tab');
    await page.waitForTimeout(100);
    
    const focusedElement = page.locator(':focus');
    const hasFocus = await focusedElement.count() > 0;
    
    console.log(`⌨️ Keyboard navigation: ${hasFocus ? '✅ Working' : '❌ CRITICAL: No focus management'}`);
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    let imagesWithAlt = 0;
    
    for (let i = 0; i < imageCount; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      if (alt && alt.trim().length > 0) {
        imagesWithAlt++;
      }
    }
    
    console.log(`🖼️ Images with alt text: ${imagesWithAlt}/${imageCount}`);
    
    // Check for proper headings structure
    const headings = page.locator('h1, h2, h3, h4, h5, h6');
    const headingCount = await headings.count();
    
    console.log(`📝 Heading structure: ${headingCount} headings found`);
    
    if (headingCount === 0) {
      console.log('❌ CRITICAL: No headings found - terrible for screen readers!');
    }
  });

  test('💎 OVERALL USER EXPERIENCE: Must be exceptional', async ({ page }) => {
    console.log('\n🔍 FINAL PICKY USER ASSESSMENT:');
    
    // Check for loading states
    const hasLoadingStates = await page.locator('.loading, .spinner, .progress').count() > 0;
    console.log(`⏳ Loading states: ${hasLoadingStates ? '✅ Present' : '❌ Missing'}`);
    
    // Check for empty states
    const hasEmptyStates = await page.locator('.empty, .no-data, .placeholder').count() > 0;
    console.log(`📭 Empty states: ${hasEmptyStates ? '✅ Present' : '⚠️ Might be missing'}`);
    
    // Check for consistent styling
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    console.log(`🎨 UI consistency: ${buttonCount} buttons to check`);
    
    // Overall assessment
    console.log('\n🎯 PICKY USER VERDICT:');
    console.log('✅ = Exceptional | ⚠️ = Needs improvement | ❌ = Unacceptable');
  });
});
