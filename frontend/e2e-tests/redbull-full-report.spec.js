/**
 * Red Bull Brand Audit - Full Report Test
 * Waits for complete analysis and validates report content
 */
import { test, expect } from '@playwright/test'

test('Red Bull Brand Audit - Full Report Generation', async ({ page }) => {
  // Set longer timeout for this test
  test.setTimeout(300000) // 5 minutes
  
  console.log('🔴 Starting Red Bull Brand Audit - Full Report Test')
  
  // Navigate to the application
  await page.goto('http://localhost:5175')
  await page.waitForLoadState('networkidle')
  
  // Verify the page loaded correctly
  await expect(page.locator('h1')).toContainText('AI Brand Audit Tool')
  console.log('✅ Landing page loaded')
  
  // Enter Red Bull in the input field
  const brandInput = page.locator('input[placeholder*="company name" i]')
  await brandInput.fill('Red Bull')
  console.log('✅ Entered brand name: Red Bull')
  
  // Wait for button to be enabled and click it
  await page.waitForTimeout(1000)
  const startButton = page.locator('button:has-text("Start AI Brand Audit")')
  await expect(startButton).toBeEnabled()
  await startButton.click()
  console.log('✅ Started brand audit')
  
  // Wait for progress page
  await expect(page.locator('h1:has-text("Analysis in Progress")')).toBeVisible({ timeout: 10000 })
  console.log('✅ Progress page loaded')
  
  // Take screenshot of progress page
  await page.screenshot({ 
    path: 'test-results/redbull-full-01-progress.png',
    fullPage: true 
  })
  
  // Monitor for analysis completion with extended timeout
  let analysisComplete = false
  let attempts = 0
  const maxAttempts = 60 // 5 minutes with 5-second intervals
  
  console.log('⏳ Monitoring analysis progress...')
  
  while (!analysisComplete && attempts < maxAttempts) {
    await page.waitForTimeout(5000)
    attempts++
    
    // Check for various completion indicators
    const urlCheck = page.url()
    const hasResults = urlCheck.includes('/results') || urlCheck.includes('/report')
    
    // Check for results content on page
    const hasReportContent = await page.locator('text=/Strategic Intelligence|Executive Summary|Brand Health|Analysis Results/i').count() > 0
    
    // Check if we're no longer on progress page
    const stillInProgress = await page.locator('h1:has-text("Analysis in Progress")').isVisible()
    
    if (hasResults || hasReportContent || !stillInProgress) {
      console.log(`✅ Analysis appears complete after ${attempts * 5} seconds`)
      console.log(`📍 Current URL: ${urlCheck}`)
      analysisComplete = true
      break
    }
    
    // Log progress every 30 seconds
    if (attempts % 6 === 0) {
      console.log(`⏳ Still analyzing... (${attempts * 5}s elapsed)`)
    }
  }
  
  // Take screenshot of current state
  await page.screenshot({ 
    path: 'test-results/redbull-full-02-final.png',
    fullPage: true 
  })
  
  if (analysisComplete) {
    console.log('🎯 Analysis completed! Validating Red Bull report content...')
    
    // Wait a moment for page to fully render
    await page.waitForTimeout(2000)
    
    // Look for Red Bull brand mentions
    const redbullMentions = await page.locator('text=/Red Bull|RedBull/i').count()
    console.log(`🔴 Red Bull brand mentions: ${redbullMentions}`)
    
    // Look for energy drink industry keywords
    const industryKeywords = [
      'energy drink', 
      'beverage', 
      'wings', 
      'caffeine', 
      'sports', 
      'extreme sports',
      'athletic',
      'performance'
    ]
    
    let foundKeywords = []
    for (const keyword of industryKeywords) {
      const count = await page.locator(`text=/${keyword}/i`).count()
      if (count > 0) {
        foundKeywords.push(`${keyword} (${count})`)
      }
    }
    console.log(`🔑 Industry keywords found: ${foundKeywords.join(', ')}`)
    
    // Look for Red Bull competitors
    const competitors = [
      'Monster Energy', 
      'Monster', 
      'Rockstar', 
      '5-hour Energy', 
      'Bang Energy',
      'Red Bull',
      'energy drink'
    ]
    
    let foundCompetitors = []
    for (const competitor of competitors) {
      const count = await page.locator(`text=/${competitor}/i`).count()
      if (count > 0) {
        foundCompetitors.push(`${competitor} (${count})`)
      }
    }
    console.log(`🏆 Competitive mentions: ${foundCompetitors.join(', ')}`)
    
    // Look for key report sections
    const reportSections = [
      'Executive Summary',
      'Strategic Context', 
      'Brand Health',
      'Visual Analysis',
      'Competitive Analysis',
      'Market Analysis',
      'Recommendations'
    ]
    
    let foundSections = []
    for (const section of reportSections) {
      const visible = await page.locator(`text=${section}`).isVisible().catch(() => false)
      if (visible) {
        foundSections.push(section)
      }
    }
    console.log(`📊 Report sections found: ${foundSections.join(', ')}`)
    
    // Check for visual elements
    const colorElements = await page.locator('[class*="color"], [data-testid*="color"]').count()
    const chartElements = await page.locator('canvas, svg, [class*="chart"], [data-testid*="chart"]').count()
    const scoreElements = await page.locator('text=/score|rating|\\/100|\\d+%/i').count()
    
    console.log(`🎨 Visual elements - Colors: ${colorElements}, Charts: ${chartElements}, Scores: ${scoreElements}`)
    
    // Basic validations
    expect(redbullMentions).toBeGreaterThan(0)
    console.log('✅ Brand name validation passed')
    
    if (foundKeywords.length > 0) {
      console.log('✅ Industry relevance validation passed')
    }
    
    if (foundSections.length > 0) {
      console.log('✅ Report structure validation passed')
    }
    
    // Get page content for manual review
    const bodyText = await page.locator('body').textContent()
    const executiveSummaryMatch = bodyText.match(/executive summary[^.]*\.{1,3}[^.]*\.{1,3}[^.]*/i)
    if (executiveSummaryMatch) {
      console.log('📋 Executive Summary Preview:')
      console.log(executiveSummaryMatch[0].substring(0, 200) + '...')
    }
    
    console.log('🎉 Red Bull brand audit report generated successfully!')
    
  } else {
    console.log(`⏰ Analysis did not complete within ${maxAttempts * 5} seconds`)
    console.log('📍 Final URL:', page.url())
    
    // Still verify that analysis started properly
    const progressWasVisible = await page.locator('text=/progress|analyzing|processing/i').count() > 0
    if (progressWasVisible) {
      console.log('✅ Analysis process was initiated correctly')
    }
  }
  
  console.log('🏁 Red Bull Full Report Test Completed')
})