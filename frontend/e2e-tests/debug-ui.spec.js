/**
 * Debug UI Elements Test
 * Simple test to explore and understand the current UI structure
 */
import { test, expect } from '@playwright/test'

test.describe('Debug UI Elements', () => {
  test('Explore landing page elements', async ({ page }) => {
    console.log('🔍 Starting UI exploration...')
    
    // Navigate to the landing page
    await page.goto('http://localhost:5175')
    await page.waitForLoadState('networkidle')
    
    // Get page title
    const title = await page.title()
    console.log(`📄 Page title: ${title}`)
    
    // Get main heading
    const heading = await page.locator('h1').textContent()
    console.log(`📝 Main heading: "${heading}"`)
    
    // Find all buttons on the page
    const buttons = await page.locator('button').all()
    console.log(`🔘 Found ${buttons.length} buttons:`)
    
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent()
      const isVisible = await buttons[i].isVisible()
      const isEnabled = await buttons[i].isEnabled()
      console.log(`  ${i + 1}. "${text}" (visible: ${isVisible}, enabled: ${isEnabled})`)
    }
    
    // Find all input fields
    const inputs = await page.locator('input').all()
    console.log(`📝 Found ${inputs.length} input fields:`)
    
    for (let i = 0; i < inputs.length; i++) {
      const placeholder = await inputs[i].getAttribute('placeholder')
      const type = await inputs[i].getAttribute('type')
      const isVisible = await inputs[i].isVisible()
      console.log(`  ${i + 1}. type="${type}" placeholder="${placeholder}" (visible: ${isVisible})`)
    }
    
    // Check for specific analyze-related elements
    const analyzeElements = [
      'button:has-text("Analyze")',
      'button:has-text("Start")',
      'button:has-text("Begin")',
      'button:has-text("Audit")',
      '[data-testid*="analyze"]',
      '[data-testid*="start"]',
      'button[type="submit"]'
    ]
    
    console.log(`🔍 Checking for analyze-related elements:`)
    for (const selector of analyzeElements) {
      const count = await page.locator(selector).count()
      console.log(`  "${selector}": ${count} found`)
    }
    
    // Take a screenshot for manual inspection
    await page.screenshot({ 
      path: 'test-results/debug-ui-landing.png',
      fullPage: true 
    })
    console.log('📸 Screenshot saved: debug-ui-landing.png')
    
    // Get the entire page HTML for inspection
    const bodyHTML = await page.locator('body').innerHTML()
    console.log('📄 Page HTML structure (first 500 chars):')
    console.log(bodyHTML.substring(0, 500) + '...')
    
    console.log('✅ UI exploration completed')
  })
})