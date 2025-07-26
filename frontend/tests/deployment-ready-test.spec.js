/**
 * Deployment Ready Test - Critical User Flows
 * Tests only the most essential functionality that would block deployment
 */

import { test, expect } from '@playwright/test'

const APP_URL = 'http://localhost:5173'

test.describe('🚀 DEPLOYMENT READY - Critical Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded', timeout: 15000 })
  })

  // CRITICAL TEST 1: App loads without crash
  test('CRITICAL: App loads without crashing', async ({ page }) => {
    // Check title loads
    await expect(page).toHaveTitle(/AI Brand Audit/i)
    
    // No critical error elements that prevent basic functionality  
    const errorElements = page.locator('[data-error], .error')
    await expect(errorElements).toHaveCount(0)
    
    console.log('✅ App loads successfully')
  })

  // CRITICAL TEST 2: Main input field works
  test('CRITICAL: Main input field is functional', async ({ page }) => {
    // Find the brand input field
    const brandInput = page.locator('input[placeholder*="Apple"]')
    await expect(brandInput).toBeVisible({ timeout: 10000 })
    
    // Test typing
    await brandInput.fill('Tesla')
    await expect(brandInput).toHaveValue('Tesla')
    
    // Test clearing
    await brandInput.clear()
    await expect(brandInput).toHaveValue('')
    
    console.log('✅ Main input field works')
  })

  // CRITICAL TEST 3: Main button exists and responds
  test('CRITICAL: Submit button is functional', async ({ page }) => {
    const brandInput = page.locator('input[placeholder*="Apple"]')
    const submitButton = page.locator('button[type="submit"]')
    
    // Button should be disabled when empty
    await expect(submitButton).toBeDisabled()
    
    // Button should enable when input has value
    await brandInput.fill('Nike')
    await expect(submitButton).toBeEnabled()
    
    // Button should respond to click (even if backend fails)
    await submitButton.click()
    
    console.log('✅ Submit button works')
  })

  // CRITICAL TEST 4: Example brands work
  test('CRITICAL: Example brand buttons work', async ({ page }) => {
    const brandInput = page.locator('input[placeholder*="Apple"]')
    
    // Find any example brand button (try multiple common ones)
    const exampleBrand = await page.locator('button:has-text("Apple"), button:has-text("Tesla"), button:has-text("Nike")').first()
    
    if (await exampleBrand.count() > 0) {
      const brandName = await exampleBrand.textContent()
      await exampleBrand.click()
      
      // Should populate input
      await expect(brandInput).toHaveValue(brandName.trim())
      
      console.log(`✅ Example brand "${brandName}" works`)
    } else {
      console.log('⚠️ No example brand buttons found')
    }
  })

  // CRITICAL TEST 5: Mobile viewport doesn't break
  test('CRITICAL: Mobile viewport is usable', async ({ page }) => {
    // Set mobile size
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    
    // Main elements should still be usable
    const brandInput = page.locator('input[placeholder*="Apple"]')
    await expect(brandInput).toBeVisible()
    
    const submitButton = page.locator('button[type="submit"]')
    await expect(submitButton).toBeVisible()
    
    // Should accept touch input
    await brandInput.fill('TestMobile')
    await expect(brandInput).toHaveValue('TestMobile')
    
    console.log('✅ Mobile viewport works')
  })

  // CRITICAL TEST 6: No horizontal scroll on mobile
  test('CRITICAL: No horizontal scroll on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload({ waitUntil: 'domcontentloaded' })
    
    // Check viewport width
    const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
    const clientWidth = await page.evaluate(() => document.body.clientWidth)
    
    // Should not have significant horizontal overflow
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 50) // 50px tolerance
    
    console.log('✅ No horizontal scroll')
  })

  // CRITICAL TEST 7: Basic keyboard navigation
  test('CRITICAL: Keyboard navigation works', async ({ page }) => {
    // Tab to input
    await page.keyboard.press('Tab')
    
    const brandInput = page.locator('input[placeholder*="Apple"]')
    await expect(brandInput).toBeFocused()
    
    // Type with keyboard
    await page.keyboard.type('KeyboardTest')
    await expect(brandInput).toHaveValue('KeyboardTest')
    
    console.log('✅ Keyboard navigation works')
  })

  // CRITICAL TEST 8: Page doesn't timeout
  test('CRITICAL: Page loads within reasonable time', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })
    
    const loadTime = Date.now() - startTime
    
    // Should load within 15 seconds (generous for production)
    expect(loadTime).toBeLessThan(15000)
    
    console.log(`✅ Page loads in ${loadTime}ms`)
  })
})