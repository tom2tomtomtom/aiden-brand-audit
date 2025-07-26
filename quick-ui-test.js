const { chromium } = require('playwright');

(async () => {
  console.log('🔥 STARTING PICKY USER UI TEST - ZERO TOLERANCE FOR POOR UX');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  let issues = [];
  let successes = [];
  
  try {
    // Test 1: Page Load Performance
    console.log('\n🚀 TEST 1: PAGE LOAD PERFORMANCE');
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 3000) {
      issues.push(`❌ UNACCEPTABLE: Page load took ${loadTime}ms (>3s is too slow)`);
    } else if (loadTime > 1500) {
      issues.push(`⚠️ SLOW: Page load took ${loadTime}ms (should be <1.5s)`);
    } else {
      successes.push(`✅ EXCELLENT: Page loaded in ${loadTime}ms`);
    }
    
    // Test 2: Visual First Impression
    console.log('\n🎨 TEST 2: VISUAL FIRST IMPRESSION');
    const title = await page.title();
    if (!title || title.includes('Vite') || title === 'React App') {
      issues.push('❌ AMATEUR: Generic or missing page title');
    } else {
      successes.push(`✅ PROFESSIONAL: Page title "${title}"`);
    }
    
    // Check for main heading
    const h1 = await page.locator('h1').first();
    if (await h1.count() === 0) {
      issues.push('❌ CRITICAL: No main heading (H1) found - terrible for SEO and accessibility');
    } else {
      const h1Text = await h1.textContent();
      successes.push(`✅ GOOD: Main heading found: "${h1Text}"`);
    }
    
    // Test 3: Primary Action Discovery
    console.log('\n🎯 TEST 3: PRIMARY ACTION DISCOVERY');
    
    // Look for obvious input field
    const inputs = await page.locator('input[type="text"], input[type="search"], input:not([type="hidden"])').count();
    if (inputs === 0) {
      issues.push('❌ CRITICAL: No input fields found - how does user interact?');
    } else {
      successes.push(`✅ GOOD: Found ${inputs} input field(s)`);
      
      // Test the main input
      const mainInput = page.locator('input').first();
      const placeholder = await mainInput.getAttribute('placeholder');
      if (!placeholder || placeholder.length < 5) {
        issues.push('❌ POOR UX: Input has no helpful placeholder text');
      } else {
        successes.push(`✅ HELPFUL: Input placeholder: "${placeholder}"`);
      }
    }
    
    // Look for primary action button
    const buttons = await page.locator('button').count();
    if (buttons === 0) {
      issues.push('❌ CRITICAL: No buttons found - how does user submit?');
    } else {
      successes.push(`✅ GOOD: Found ${buttons} button(s)`);
      
      // Check button text quality
      const firstButton = page.locator('button').first();
      const buttonText = await firstButton.textContent();
      if (!buttonText || buttonText.trim().length < 3) {
        issues.push('❌ POOR UX: Button has unclear or missing text');
      } else {
        successes.push(`✅ CLEAR: Button text: "${buttonText}"`);
      }
    }
    
    // Test 4: Responsive Design
    console.log('\n📱 TEST 4: RESPONSIVE DESIGN');
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablet' },
      { width: 1920, height: 1080, name: 'Desktop' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
      if (bodyWidth > viewport.width + 20) { // Allow small tolerance
        issues.push(`❌ BROKEN: Horizontal scroll on ${viewport.name} (${bodyWidth}px > ${viewport.width}px)`);
      } else {
        successes.push(`✅ RESPONSIVE: ${viewport.name} layout works`);
      }
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Test 5: User Flow - Brand Search
    console.log('\n🔍 TEST 5: BRAND SEARCH USER FLOW');
    
    const searchInput = page.locator('input').first();
    const searchButton = page.locator('button').first();
    
    if (await searchInput.isVisible() && await searchButton.isVisible()) {
      // Test empty submission
      await searchButton.click();
      await page.waitForTimeout(1000);
      
      const errorElements = await page.locator('.error, .alert, [role="alert"], .warning').count();
      if (errorElements === 0) {
        issues.push('⚠️ MISSING: No error handling for empty input');
      } else {
        successes.push('✅ GOOD: Error handling for empty input');
      }
      
      // Test actual search
      await searchInput.fill('Apple');
      await searchButton.click();
      await page.waitForTimeout(2000);
      
      // Look for loading indicators
      const loadingElements = await page.locator('.loading, .spinner, .progress, [role="progressbar"]').count();
      if (loadingElements === 0) {
        issues.push('⚠️ POOR UX: No loading indicators during search');
      } else {
        successes.push('✅ EXCELLENT: Loading indicators present');
      }
      
      // Look for results or progress
      await page.waitForTimeout(3000);
      const resultElements = await page.locator('.result, .analysis, .report, .output, .data').count();
      if (resultElements === 0) {
        issues.push('⚠️ UNCLEAR: No visible results or progress after search');
      } else {
        successes.push('✅ GOOD: Results or progress visible');
      }
      
    } else {
      issues.push('❌ CRITICAL: Cannot test user flow - missing input or button');
    }
    
    // Test 6: Performance During Interaction
    console.log('\n⚡ TEST 6: INTERACTION PERFORMANCE');
    
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const button = allButtons.nth(i);
      if (await button.isVisible() && await button.isEnabled()) {
        const clickStart = Date.now();
        await button.click();
        const clickTime = Date.now() - clickStart;
        
        if (clickTime > 200) {
          issues.push(`❌ SLUGGISH: Button click took ${clickTime}ms (should be <200ms)`);
        } else {
          successes.push(`✅ SNAPPY: Button responds in ${clickTime}ms`);
        }
        
        await page.waitForTimeout(500);
      }
    }
    
    // Test 7: Accessibility Basics
    console.log('\n♿ TEST 7: ACCESSIBILITY BASICS');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').count();
    if (focusedElement === 0) {
      issues.push('❌ CRITICAL: No keyboard focus management - inaccessible!');
    } else {
      successes.push('✅ ACCESSIBLE: Keyboard navigation works');
    }
    
    // Check images for alt text
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
    
    if (imageCount > 0 && imagesWithAlt === 0) {
      issues.push(`❌ INACCESSIBLE: ${imageCount} images without alt text`);
    } else if (imageCount > 0) {
      successes.push(`✅ ACCESSIBLE: ${imagesWithAlt}/${imageCount} images have alt text`);
    }
    
  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
  }
  
  // Final Assessment
  console.log('\n' + '=' .repeat(60));
  console.log('🏆 PICKY USER FINAL VERDICT');
  console.log('=' .repeat(60));
  
  console.log('\n✅ SUCCESSES:');
  successes.forEach(success => console.log(`  ${success}`));
  
  console.log('\n❌ ISSUES THAT NEED FIXING:');
  issues.forEach(issue => console.log(`  ${issue}`));
  
  const score = (successes.length / (successes.length + issues.length)) * 100;
  console.log(`\n📊 OVERALL SCORE: ${score.toFixed(1)}%`);
  
  if (score >= 90) {
    console.log('🎉 EXCEPTIONAL - This app delivers a premium experience!');
  } else if (score >= 75) {
    console.log('👍 GOOD - Solid app with room for improvement');
  } else if (score >= 60) {
    console.log('⚠️ MEDIOCRE - Significant UX issues need addressing');
  } else {
    console.log('💥 UNACCEPTABLE - Major overhaul needed for user satisfaction');
  }
  
  console.log('\n🎯 PICKY USER RECOMMENDATIONS:');
  if (issues.length > 0) {
    console.log('  1. Fix all CRITICAL issues immediately');
    console.log('  2. Address POOR UX issues for better user satisfaction');
    console.log('  3. Improve MISSING features for completeness');
    console.log('  4. Test with real users to validate improvements');
  } else {
    console.log('  🎊 Congratulations! This app meets picky user standards!');
  }
  
  await browser.close();
  
})().catch(console.error);
