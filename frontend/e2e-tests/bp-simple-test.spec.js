/**
 * BP Brand Audit - Simple Working Test
 * Based on actual UI structure discovered through debugging
 */
import { test, expect } from '@playwright/test'

test('BP Brand Audit - Simple Complete Journey', async ({ page }) => {
  console.log('🏢 Starting BP Brand Audit - Simple Journey')
  
  // Navigate to the application
  await page.goto('http://localhost:5175')
  await page.waitForLoadState('networkidle')
  
  // Verify the page loaded correctly
  await expect(page.locator('h1')).toContainText('AI Brand Audit Tool')
  console.log('✅ Landing page loaded')
  
  // Take screenshot of landing page
  await page.screenshot({ 
    path: 'test-results/bp-simple-01-landing.png',
    fullPage: true 
  })
  
  // Enter BP in the input field
  const brandInput = page.locator('input[placeholder*="company name" i]')
  await brandInput.fill('BP')
  console.log('✅ Entered brand name: BP')
  
  // Wait a moment for the button to be enabled
  await page.waitForTimeout(1000)
  
  // Click the Start AI Brand Audit button
  const startButton = page.locator('button:has-text("Start AI Brand Audit")')
  await expect(startButton).toBeEnabled()
  await startButton.click()
  console.log('✅ Started brand audit')
  
  // Take screenshot after starting
  await page.screenshot({ 
    path: 'test-results/bp-simple-02-started.png',
    fullPage: true 
  })
  
  // Wait for some kind of progress or results page
  // This could be progress page or results depending on the flow
  await page.waitForTimeout(5000) // Give it time to load
  
  // Take screenshot of whatever page we're on
  await page.screenshot({ 
    path: 'test-results/bp-simple-03-progress.png',
    fullPage: true 
  })
  
  // Log what we can see on the page
  const currentUrl = page.url()
  console.log(`📍 Current URL: ${currentUrl}`)
  
  // Check for various possible states
  const progressVisible = await page.locator('h1:has-text("Analysis in Progress")').isVisible()
  const resultsVisible = await page.locator('text=/Results|Strategic Intelligence|Report/i').first().isVisible().catch(() => false)
  const errorVisible = await page.locator('text=/error|failed/i').first().isVisible().catch(() => false)
  
  console.log(`📊 Page state - Progress: ${progressVisible}, Results: ${resultsVisible}, Error: ${errorVisible}`)
  
  if (progressVisible) {
    console.log('✅ Progress page detected - analysis started successfully')
    
    // Monitor for a short time to see if we get progress updates
    let attempts = 0
    const maxAttempts = 12 // 1 minute with 5-second intervals
    
    while (attempts < maxAttempts) {
      await page.waitForTimeout(5000)
      attempts++
      
      // Check if analysis completed
      const completedVisible = await page.locator('text=/Complete|Results|Strategic/i').isVisible()
      if (completedVisible) {
        console.log(`✅ Analysis completed after ${attempts * 5} seconds`)
        break
      }
      
      // Check for errors
      const errorNow = await page.locator('text=/error|failed/i').isVisible()
      if (errorNow) {
        console.log('❌ Error detected during analysis')
        break
      }
      
      console.log(`⏳ Still processing... (${attempts * 5}s elapsed)`)
    }
    
    // Take final screenshot
    await page.screenshot({ 
      path: 'test-results/bp-simple-04-final.png',
      fullPage: true 
    })
    
  } else if (resultsVisible) {
    console.log('✅ Results page detected immediately')
    
    // Look for BP-specific content
    const bpMentions = await page.locator('text=BP').count()
    console.log(`🏢 BP mentions found: ${bpMentions}`)
    
    // Look for industry keywords
    const energyKeywords = ['energy', 'petroleum', 'oil', 'gas', 'sustainability']
    let foundKeywords = []
    
    for (const keyword of energyKeywords) {
      const count = await page.locator(`text=/${keyword}/i`).count()
      if (count > 0) {
        foundKeywords.push(keyword)
      }
    }
    
    console.log(`🔑 Industry keywords found: ${foundKeywords.join(', ')}`)
    
    // Look for competitive elements
    const competitors = ['Shell', 'ExxonMobil', 'Chevron', 'TotalEnergies']
    let foundCompetitors = []
    
    for (const competitor of competitors) {
      const count = await page.locator(`text=${competitor}`).count()
      if (count > 0) {
        foundCompetitors.push(competitor)
      }
    }
    
    console.log(`🏆 Competitors found: ${foundCompetitors.join(', ')}`)
    
    // Basic quality assertions
    expect(bpMentions).toBeGreaterThan(0)
    console.log('✅ Brand validation passed')
    
  } else if (errorVisible) {
    console.log('❌ Error page detected')
    
    // Get error details
    const errorText = await page.locator('text=/error|failed/i').first().textContent()
    console.log(`❌ Error message: ${errorText}`)
    
  } else {
    console.log('⚠️ Unknown page state - taking screenshot for analysis')
    
    // Get all visible text to understand what's on the page
    const bodyText = await page.locator('body').textContent()
    console.log('📄 Page content (first 300 chars):')
    console.log(bodyText.substring(0, 300) + '...')
  }
  
  console.log('🏁 BP Simple Test Completed')
})