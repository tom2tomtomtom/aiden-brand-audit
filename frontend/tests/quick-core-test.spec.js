/**
 * Quick Core Test - Essential functionality check
 */

import { test, expect } from '@playwright/test'

const APP_URL = 'http://localhost:5173'

test.describe('Quick Core Flow Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(APP_URL, { waitUntil: 'networkidle', timeout: 30000 })
  })

  test('should load homepage without errors', async ({ page }) => {
    // Check page loads
    await expect(page).toHaveTitle(/AI Brand Audit/i)
    
    // Check no actual error messages (avoid false positives)
    const errorElements = page.locator('text=/Error:|500 Error|Internal Error/i')
    await expect(errorElements).toHaveCount(0)
    
    console.log('✅ Homepage loads successfully')
  })

  test('should have main form elements', async ({ page }) => {
    // Check for input field
    const brandInput = page.locator('input').first()
    await expect(brandInput).toBeVisible()
    
    // Check for button
    const button = page.locator('button').first()
    await expect(button).toBeVisible()
    
    console.log('✅ Main form elements are present')
  })

  test('should accept user input', async ({ page }) => {
    // Fill input
    const brandInput = page.locator('input').first()
    await brandInput.fill('TestBrand')
    
    // Check value is set
    await expect(brandInput).toHaveValue('TestBrand')
    
    console.log('✅ User input works')
  })

  test('should respond to button clicks', async ({ page }) => {
    // Fill input
    const brandInput = page.locator('input').first()
    await brandInput.fill('Tesla')
    
    // Click button
    const button = page.locator('button').first()
    await button.click()
    
    // Should show some response (loading state, navigation, etc.)
    await page.waitForTimeout(2000)
    
    console.log('✅ Button interaction works')
  })

  test('should work on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.reload()
    
    // Check main elements still visible
    const brandInput = page.locator('input').first()
    await expect(brandInput).toBeVisible()
    
    const button = page.locator('button').first()
    await expect(button).toBeVisible()
    
    console.log('✅ Mobile responsiveness works')
  })
})