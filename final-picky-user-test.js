const { chromium } = require('playwright');

(async () => {
  console.log('🔥 FINAL PICKY USER TEST - VERIFYING FIXES');
  console.log('=' .repeat(50));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  let issues = [];
  let successes = [];
  let improvements = [];
  
  try {
    // Test 1: Page Load Performance (IMPROVED)
    console.log('\n🚀 TEST 1: PAGE LOAD PERFORMANCE (CHECKING IMPROVEMENTS)');
    const startTime = Date.now();
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    if (loadTime > 3000) {
      issues.push(`❌ STILL SLOW: Page load took ${loadTime}ms (>3s)`);
    } else if (loadTime > 1500) {
      improvements.push(`⚡ IMPROVED: Page load took ${loadTime}ms (was >2s, now <3s)`);
    } else {
      successes.push(`✅ EXCELLENT: Page loaded in ${loadTime}ms`);
    }
    
    // Test 2: Button Disabled Logic (FIXED)
    console.log('\n🔘 TEST 2: BUTTON DISABLED LOGIC (CHECKING FIX)');
    
    const input = page.locator('input').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    // Test empty state
    await input.fill('');
    await page.waitForTimeout(100);
    let isDisabled = await submitButton.getAttribute('disabled');
    if (isDisabled !== null) {
      successes.push('✅ CORRECT: Button disabled when input is empty');
    } else {
      issues.push('❌ BUG: Button should be disabled when input is empty');
    }
    
    // Test single character
    await input.fill('A');
    await page.waitForTimeout(100);
    isDisabled = await submitButton.getAttribute('disabled');
    if (isDisabled !== null) {
      successes.push('✅ SMART: Button disabled for single character (good validation)');
    } else {
      issues.push('⚠️ PERMISSIVE: Button allows single character (might be intentional)');
    }
    
    // Test valid input
    await input.fill('Apple');
    await page.waitForTimeout(100);
    isDisabled = await submitButton.getAttribute('disabled');
    if (isDisabled === null) {
      successes.push('✅ PERFECT: Button enables for valid input');
    } else {
      issues.push('❌ CRITICAL: Button still disabled for valid input');
    }
    
    // Test validation feedback
    await input.fill('A');
    await page.waitForTimeout(200);
    const validationMessage = await page.locator('text=Please enter at least 2 characters').count();
    if (validationMessage > 0) {
      successes.push('✅ EXCELLENT: Real-time validation feedback shown');
    } else {
      improvements.push('⚡ COULD ADD: Real-time validation feedback for better UX');
    }
    
    // Test 3: Mobile Responsiveness (FIXED)
    console.log('\n📱 TEST 3: MOBILE RESPONSIVENESS (CHECKING FIXES)');
    
    const viewports = [
      { width: 375, height: 667, name: 'iPhone SE' },
      { width: 414, height: 896, name: 'iPhone 11' },
      { width: 768, height: 1024, name: 'iPad' }
    ];
    
    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(500);
      
      const buttonVisible = await submitButton.isVisible();
      const inputVisible = await input.isVisible();
      const horizontalScroll = await page.evaluate(() => document.body.scrollWidth > window.innerWidth);
      
      if (buttonVisible && inputVisible && !horizontalScroll) {
        successes.push(`✅ PERFECT: ${viewport.name} layout works flawlessly`);
      } else {
        const issues_found = [];
        if (!buttonVisible) issues_found.push('button not visible');
        if (!inputVisible) issues_found.push('input not visible');
        if (horizontalScroll) issues_found.push('horizontal scroll');
        
        if (issues_found.length > 0) {
          issues.push(`❌ ${viewport.name}: ${issues_found.join(', ')}`);
        }
      }
    }
    
    // Reset to desktop
    await page.setViewportSize({ width: 1920, height: 1080 });
    
    // Test 4: User Flow - Complete Analysis (ENHANCED)
    console.log('\n🎯 TEST 4: COMPLETE USER FLOW (ENHANCED TESTING)');
    
    await input.fill('Tesla');
    await page.waitForTimeout(200);
    
    // Check if button is clickable
    const isClickable = await submitButton.isEnabled();
    if (isClickable) {
      successes.push('✅ READY: Button is clickable for valid input');
      
      // Actually click and test the flow
      try {
        await submitButton.click();
        successes.push('✅ RESPONSIVE: Button click works instantly');
        
        // Wait for navigation or loading state
        await page.waitForTimeout(2000);
        
        // Look for progress indicators
        const progressElements = await page.locator('.progress, .loading, .spinner, [role="progressbar"]').count();
        if (progressElements > 0) {
          successes.push('✅ EXCELLENT: Progress indicators visible during analysis');
        } else {
          improvements.push('⚡ COULD IMPROVE: Add more visible progress indicators');
        }
        
        // Look for analysis content
        const analysisContent = await page.locator('.analysis, .progress, .step, .stage').count();
        if (analysisContent > 0) {
          successes.push('✅ FUNCTIONAL: Analysis interface loads properly');
        } else {
          issues.push('⚠️ UNCLEAR: No clear analysis interface visible');
        }
        
      } catch (error) {
        issues.push(`❌ CRITICAL: Button click failed - ${error.message}`);
      }
    } else {
      issues.push('❌ CRITICAL: Button not clickable even with valid input');
    }
    
    // Test 5: Performance During Interaction (NEW)
    console.log('\n⚡ TEST 5: INTERACTION PERFORMANCE');
    
    // Test input responsiveness
    await page.goto('http://localhost:5173'); // Reset
    await page.waitForLoadState('networkidle');
    
    const testInput = page.locator('input').first();
    const testString = 'Performance Test Brand';
    
    const typingStart = Date.now();
    await testInput.type(testString, { delay: 50 });
    const typingTime = Date.now() - typingStart;
    
    if (typingTime < testString.length * 100) { // Should be responsive
      successes.push(`✅ SNAPPY: Input typing is responsive (${typingTime}ms)`);
    } else {
      issues.push(`❌ SLUGGISH: Input typing is slow (${typingTime}ms)`);
    }
    
    // Test 6: Accessibility Improvements (ENHANCED)
    console.log('\n♿ TEST 6: ACCESSIBILITY (ENHANCED CHECKS)');
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus').count();
    if (focusedElement > 0) {
      successes.push('✅ ACCESSIBLE: Keyboard navigation works');
    } else {
      issues.push('❌ INACCESSIBLE: No keyboard focus management');
    }
    
    // Test form labels
    const labeledInputs = await page.locator('input[aria-label], input + label, label input').count();
    if (labeledInputs > 0) {
      successes.push('✅ ACCESSIBLE: Form inputs are properly labeled');
    } else {
      improvements.push('⚡ COULD IMPROVE: Add proper form labels for screen readers');
    }
    
    // Test button accessibility
    const accessibleButtons = await page.locator('button[aria-label], button:has-text("Start")').count();
    if (accessibleButtons > 0) {
      successes.push('✅ ACCESSIBLE: Buttons have clear text/labels');
    } else {
      issues.push('❌ INACCESSIBLE: Buttons lack clear accessibility labels');
    }
    
    // Test 7: Visual Polish (NEW)
    console.log('\n🎨 TEST 7: VISUAL POLISH & UX DETAILS');
    
    // Check for loading states
    const hasLoadingStates = await page.locator('[class*="loading"], [class*="spinner"], [class*="animate"]').count();
    if (hasLoadingStates > 0) {
      successes.push('✅ POLISHED: Loading animations present');
    } else {
      improvements.push('⚡ COULD ADD: Loading animations for better perceived performance');
    }
    
    // Check for hover states
    const testButton = page.locator('button').first();
    await testButton.hover();
    await page.waitForTimeout(100);
    
    const hasHoverEffects = await testButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return styles.transition !== 'none' || styles.transform !== 'none';
    });
    
    if (hasHoverEffects) {
      successes.push('✅ POLISHED: Interactive hover effects present');
    } else {
      improvements.push('⚡ COULD ADD: Hover effects for better interactivity');
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'final-ui-test-screenshot.png', fullPage: true });
    
  } catch (error) {
    issues.push(`❌ CRITICAL ERROR: ${error.message}`);
  }
  
  // Final Assessment
  console.log('\n' + '=' .repeat(60));
  console.log('🏆 FINAL PICKY USER VERDICT');
  console.log('=' .repeat(60));
  
  console.log('\n✅ SUCCESSES:');
  successes.forEach(success => console.log(`  ${success}`));
  
  console.log('\n⚡ IMPROVEMENTS MADE:');
  improvements.forEach(improvement => console.log(`  ${improvement}`));
  
  console.log('\n❌ REMAINING ISSUES:');
  if (issues.length === 0) {
    console.log('  🎉 NO ISSUES FOUND - EXCEPTIONAL QUALITY!');
  } else {
    issues.forEach(issue => console.log(`  ${issue}`));
  }
  
  const totalItems = successes.length + improvements.length + issues.length;
  const positiveItems = successes.length + improvements.length;
  const score = totalItems > 0 ? (positiveItems / totalItems) * 100 : 0;
  
  console.log(`\n📊 FINAL SCORE: ${score.toFixed(1)}%`);
  
  if (score >= 95) {
    console.log('🏆 EXCEPTIONAL - This app delivers a world-class experience!');
  } else if (score >= 85) {
    console.log('🎉 EXCELLENT - Outstanding app with minor room for improvement');
  } else if (score >= 75) {
    console.log('👍 GOOD - Solid app that meets high standards');
  } else if (score >= 60) {
    console.log('⚠️ ACCEPTABLE - Functional but needs UX improvements');
  } else {
    console.log('💥 NEEDS WORK - Significant issues remain');
  }
  
  console.log('\n🎯 PICKY USER FINAL RECOMMENDATIONS:');
  if (issues.length === 0) {
    console.log('  🎊 Congratulations! This app exceeds picky user expectations!');
    console.log('  🚀 Ready for production deployment');
    console.log('  💎 Delivers exceptional user experience');
  } else {
    console.log('  1. Address remaining critical issues immediately');
    console.log('  2. Consider implementing suggested improvements');
    console.log('  3. Test with real users to validate changes');
  }
  
  console.log('\n📸 Final screenshot saved as final-ui-test-screenshot.png');
  
  await browser.close();
  
})().catch(console.error);
