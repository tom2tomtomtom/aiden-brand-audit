/**
 * Quick Critical Flow Test
 * Tests only the most essential functionality that could block deployment
 */

const { chromium } = require('playwright');

async function testCriticalFlows() {
  console.log('🚀 Starting Critical Flow Tests...\n');
  
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    // Test 1: App loads without errors
    console.log('1️⃣ Testing: App loads without errors');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle', { timeout: 10000 });
    
    const title = await page.title();
    if (title.includes('AI Brand Audit Tool')) {
      console.log('✅ App loads correctly');
    } else {
      console.log('❌ App title incorrect:', title);
      return false;
    }
    
    // Test 2: Main elements are visible
    console.log('\n2️⃣ Testing: Main elements visibility');
    const h1 = await page.locator('h1').textContent();
    if (h1 && h1.includes('AI Brand Audit Tool')) {
      console.log('✅ Main heading visible');
    } else {
      console.log('❌ Main heading missing or incorrect');
      return false;
    }
    
    const brandInput = page.locator('input[placeholder*="Apple"]');
    await brandInput.waitFor({ timeout: 5000 });
    console.log('✅ Brand input field visible');
    
    const startButton = page.locator('text=Start AI Brand Audit');
    await startButton.waitFor({ timeout: 5000 });
    console.log('✅ Start button visible');
    
    // Test 3: Form interaction works
    console.log('\n3️⃣ Testing: Form interaction');
    await brandInput.fill('Tesla');
    const inputValue = await brandInput.inputValue();
    if (inputValue === 'Tesla') {
      console.log('✅ Input accepts text');
    } else {
      console.log('❌ Input not working correctly');
      return false;
    }
    
    // Check if button becomes enabled
    const isEnabled = await startButton.isEnabled();
    if (isEnabled) {
      console.log('✅ Button enables with valid input');
    } else {
      console.log('❌ Button remains disabled');
      return false;
    }
    
    // Test 4: Button click doesn't crash
    console.log('\n4️⃣ Testing: Button interaction');
    await startButton.click();
    await page.waitForTimeout(2000);
    
    // Check if page changed state (either error toast or navigation)
    const hasError = await page.locator('[data-sonner-toast]').count() > 0;
    const hasLoading = await page.locator('text=/analyzing|loading|initializing/i').count() > 0;
    const hasProgress = await page.locator('text=/progress|analysis/i').count() > 0;
    
    if (hasError || hasLoading || hasProgress) {
      console.log('✅ Button click triggers app response');
    } else {
      console.log('❌ Button click has no visible effect');
      return false;
    }
    
    // Test 5: Mobile viewport
    console.log('\n5️⃣ Testing: Mobile responsiveness');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    const mobileH1 = await page.locator('h1').isVisible();
    const mobileInput = await page.locator('input[placeholder*="Apple"]').isVisible();
    const mobileButton = await page.locator('text=Start AI Brand Audit').isVisible();
    
    if (mobileH1 && mobileInput && mobileButton) {
      console.log('✅ Mobile viewport works');
    } else {
      console.log('❌ Mobile viewport has issues');
      return false;
    }
    
    // Test 6: No console errors
    console.log('\n6️⃣ Testing: JavaScript errors');
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('http://localhost:5173');
    await page.waitForTimeout(3000);
    
    const criticalErrors = errors.filter(error => 
      !error.includes('favicon') && 
      !error.includes('404') &&
      !error.includes('net::ERR_')
    );
    
    if (criticalErrors.length === 0) {
      console.log('✅ No critical JavaScript errors');
    } else {
      console.log('❌ JavaScript errors found:', criticalErrors);
      return false;
    }
    
    console.log('\n🎉 ALL CRITICAL TESTS PASSED!');
    console.log('✅ App is ready for deployment');
    return true;
    
  } catch (error) {
    console.log('\n❌ CRITICAL TEST FAILED:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

// Run the test
testCriticalFlows().then(success => {
  if (success) {
    console.log('\n🟢 DEPLOYMENT STATUS: READY');
    process.exit(0);
  } else {
    console.log('\n🔴 DEPLOYMENT STATUS: BLOCKED');
    process.exit(1);
  }
}).catch(error => {
  console.log('\n💥 TEST RUNNER ERROR:', error);
  process.exit(1);
});