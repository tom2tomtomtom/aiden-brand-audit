const { chromium } = require('playwright');

(async () => {
  console.log('📊 TESTING FULL REPORT DELIVERY - PICKY USER DEMANDS RESULTS');
  console.log('=' .repeat(60));
  
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();
  
  let reportQuality = [];
  let missingFeatures = [];
  let deliveredFeatures = [];
  
  try {
    console.log('\n🚀 STEP 1: STARTING BRAND ANALYSIS');
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
    
    // Fill in a well-known brand for testing
    const input = page.locator('input').first();
    const submitButton = page.locator('button[type="submit"]').first();
    
    await input.fill('Apple');
    await page.waitForTimeout(500);
    
    console.log('✅ Brand name entered: Apple');
    
    // Start analysis
    await submitButton.click();
    console.log('✅ Analysis started');
    
    // Wait for analysis to begin
    await page.waitForTimeout(3000);
    
    console.log('\n⏳ STEP 2: MONITORING ANALYSIS PROGRESS');
    
    // Look for progress indicators
    const progressElements = await page.locator('.progress, .loading, .spinner, [role="progressbar"]').count();
    if (progressElements > 0) {
      deliveredFeatures.push('✅ Real-time progress tracking');
    } else {
      missingFeatures.push('❌ No progress indicators visible');
    }
    
    // Check for analysis stages
    const stageElements = await page.locator('.stage, .step, .phase').count();
    if (stageElements > 0) {
      deliveredFeatures.push('✅ Analysis stages visible');
    } else {
      missingFeatures.push('❌ No analysis stages shown');
    }
    
    // Wait longer for analysis to complete or show substantial progress
    console.log('⏳ Waiting for analysis to progress (up to 2 minutes)...');
    
    let analysisComplete = false;
    let waitTime = 0;
    const maxWaitTime = 120000; // 2 minutes
    
    while (waitTime < maxWaitTime && !analysisComplete) {
      await page.waitForTimeout(5000);
      waitTime += 5000;
      
      // Check for completion indicators
      const completionElements = await page.locator('.complete, .finished, .results, .report').count();
      const errorElements = await page.locator('.error, .failed, .timeout').count();
      
      if (completionElements > 0) {
        analysisComplete = true;
        deliveredFeatures.push('✅ Analysis completed successfully');
        break;
      }
      
      if (errorElements > 0) {
        missingFeatures.push('❌ Analysis failed with errors');
        break;
      }
      
      // Check progress percentage
      const progressText = await page.locator('text=/\\d+%/').first().textContent().catch(() => null);
      if (progressText) {
        console.log(`📈 Progress: ${progressText}`);
      }
      
      console.log(`⏳ Waiting... ${waitTime/1000}s elapsed`);
    }
    
    console.log('\n📊 STEP 3: ANALYZING REPORT CONTENT');
    
    // Check for report sections
    const reportSections = [
      { name: 'Executive Summary', selectors: ['.executive-summary', '.summary', 'h2:has-text("Executive")', 'h3:has-text("Summary")'] },
      { name: 'Brand Analysis', selectors: ['.brand-analysis', '.analysis', 'h2:has-text("Brand")', 'h3:has-text("Analysis")'] },
      { name: 'Competitive Intelligence', selectors: ['.competitive', '.competitor', 'h2:has-text("Competitive")', 'h3:has-text("Competitor")'] },
      { name: 'Visual Analysis', selectors: ['.visual-analysis', '.visual', 'h2:has-text("Visual")', '.color-palette', '.logo'] },
      { name: 'Market Position', selectors: ['.market-position', '.positioning', 'h2:has-text("Market")', 'h3:has-text("Position")'] },
      { name: 'Strategic Recommendations', selectors: ['.recommendations', '.strategic', 'h2:has-text("Recommendations")', 'h3:has-text("Strategic")'] },
      { name: 'Brand Health Score', selectors: ['.brand-health', '.score', '.rating', 'text=/\\d+\\/100/', 'text=/Score:/', '.health-score'] },
      { name: 'Key Insights', selectors: ['.insights', '.key-insights', 'h2:has-text("Insights")', 'h3:has-text("Key")'] }
    ];
    
    for (const section of reportSections) {
      let sectionFound = false;
      
      for (const selector of section.selectors) {
        const elements = await page.locator(selector).count();
        if (elements > 0) {
          sectionFound = true;
          break;
        }
      }
      
      if (sectionFound) {
        deliveredFeatures.push(`✅ ${section.name} section present`);
      } else {
        missingFeatures.push(`❌ ${section.name} section missing`);
      }
    }
    
    // Check for visual elements
    const visualElements = [
      { name: 'Charts/Graphs', selectors: ['.chart', '.graph', 'svg', 'canvas', '.recharts'] },
      { name: 'Color Palettes', selectors: ['.color-palette', '.colors', '.color-swatch', '[style*="background-color"]'] },
      { name: 'Brand Assets', selectors: ['.brand-assets', '.assets', '.logo', 'img[alt*="logo"]'] },
      { name: 'Screenshots', selectors: ['.screenshot', '.website-image', 'img[alt*="screenshot"]'] },
      { name: 'Progress Bars', selectors: ['.progress-bar', '.progress', '[role="progressbar"]'] }
    ];
    
    for (const element of visualElements) {
      let elementFound = false;
      
      for (const selector of element.selectors) {
        const count = await page.locator(selector).count();
        if (count > 0) {
          elementFound = true;
          break;
        }
      }
      
      if (elementFound) {
        deliveredFeatures.push(`✅ ${element.name} displayed`);
      } else {
        missingFeatures.push(`❌ ${element.name} missing`);
      }
    }
    
    // Check for export/download options
    const exportElements = await page.locator('button:has-text("Download"), button:has-text("Export"), button:has-text("PDF"), .download, .export').count();
    if (exportElements > 0) {
      deliveredFeatures.push('✅ Export/Download options available');
    } else {
      missingFeatures.push('❌ No export/download options');
    }
    
    // Check for data quality indicators
    const dataElements = await page.locator('text=/\\$\\d+/, text=/\\d+%/, text=/\\d+ competitors/, text=/market share/, text=/revenue/').count();
    if (dataElements > 0) {
      deliveredFeatures.push('✅ Quantitative data present');
    } else {
      missingFeatures.push('❌ No quantitative data visible');
    }
    
    // Check for actionable insights
    const actionableElements = await page.locator('text=/recommend/, text=/should/, text=/opportunity/, text=/improve/, text=/strategy/').count();
    if (actionableElements > 0) {
      deliveredFeatures.push('✅ Actionable insights provided');
    } else {
      missingFeatures.push('❌ No actionable insights visible');
    }
    
    console.log('\n📸 STEP 4: CAPTURING EVIDENCE');
    
    // Take screenshots of the current state
    await page.screenshot({ path: 'report-delivery-test.png', fullPage: true });
    
    // Try to scroll and capture more content
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'report-delivery-bottom.png', fullPage: true });
    
    console.log('\n🔍 STEP 5: CONTENT QUALITY ASSESSMENT');
    
    // Check text content length and quality
    const bodyText = await page.locator('body').textContent();
    const wordCount = bodyText.split(/\s+/).length;
    
    if (wordCount > 1000) {
      reportQuality.push(`✅ Substantial content: ${wordCount} words`);
    } else if (wordCount > 500) {
      reportQuality.push(`⚠️ Moderate content: ${wordCount} words`);
    } else {
      reportQuality.push(`❌ Insufficient content: ${wordCount} words`);
    }
    
    // Check for professional language
    const professionalTerms = ['analysis', 'strategy', 'market', 'competitive', 'brand', 'insights', 'recommendations'];
    let professionalTermCount = 0;
    
    for (const term of professionalTerms) {
      const regex = new RegExp(term, 'gi');
      const matches = bodyText.match(regex);
      if (matches) {
        professionalTermCount += matches.length;
      }
    }
    
    if (professionalTermCount > 20) {
      reportQuality.push('✅ Professional terminology used extensively');
    } else if (professionalTermCount > 10) {
      reportQuality.push('⚠️ Some professional terminology used');
    } else {
      reportQuality.push('❌ Lacks professional terminology');
    }
    
  } catch (error) {
    missingFeatures.push(`❌ CRITICAL ERROR: ${error.message}`);
  }
  
  // Final Assessment
  console.log('\n' + '=' .repeat(60));
  console.log('📊 FULL REPORT DELIVERY ASSESSMENT');
  console.log('=' .repeat(60));
  
  console.log('\n✅ DELIVERED FEATURES:');
  if (deliveredFeatures.length === 0) {
    console.log('  ❌ NO FEATURES DELIVERED - CRITICAL FAILURE!');
  } else {
    deliveredFeatures.forEach(feature => console.log(`  ${feature}`));
  }
  
  console.log('\n📝 REPORT QUALITY:');
  reportQuality.forEach(quality => console.log(`  ${quality}`));
  
  console.log('\n❌ MISSING FEATURES:');
  if (missingFeatures.length === 0) {
    console.log('  🎉 ALL EXPECTED FEATURES PRESENT!');
  } else {
    missingFeatures.forEach(missing => console.log(`  ${missing}`));
  }
  
  // Calculate delivery score
  const totalExpected = 20; // Expected number of key features
  const delivered = deliveredFeatures.length;
  const missing = missingFeatures.length;
  const deliveryScore = Math.max(0, (delivered / (delivered + missing)) * 100);
  
  console.log(`\n📊 REPORT DELIVERY SCORE: ${deliveryScore.toFixed(1)}%`);
  
  if (deliveryScore >= 90) {
    console.log('🏆 EXCEPTIONAL - Delivers comprehensive, professional reports!');
  } else if (deliveryScore >= 75) {
    console.log('🎉 EXCELLENT - Strong report delivery with minor gaps');
  } else if (deliveryScore >= 60) {
    console.log('👍 GOOD - Solid reporting with room for improvement');
  } else if (deliveryScore >= 40) {
    console.log('⚠️ BASIC - Limited reporting capabilities');
  } else {
    console.log('💥 INADEQUATE - Does not deliver meaningful reports');
  }
  
  console.log('\n🎯 PICKY USER REPORT VERDICT:');
  if (deliveryScore >= 80) {
    console.log('  ✅ ACCEPTABLE: App delivers substantial value');
    console.log('  📊 Reports provide meaningful business insights');
    console.log('  💼 Suitable for professional use');
  } else {
    console.log('  ❌ UNACCEPTABLE: App fails to deliver promised value');
    console.log('  📊 Reports are incomplete or superficial');
    console.log('  💼 Not ready for professional use');
  }
  
  console.log('\n📸 Evidence captured:');
  console.log('  - report-delivery-test.png (main view)');
  console.log('  - report-delivery-bottom.png (scrolled view)');
  
  await browser.close();
  
})().catch(console.error);
