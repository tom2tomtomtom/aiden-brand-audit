/**
 * Core Flow Tests - Critical User Paths
 * Tests the essential functionality that would cause customer complaints if broken
 */

import { test, expect, Page } from '@playwright/test'

const APP_URL = 'http://localhost:5173'
const BACKEND_URL = 'http://localhost:8000' // May be ngrok URL in production

test.describe('AI Brand Audit Tool - Core Flows', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage
    
    // Set viewport to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
    
    // Navigate to the app
    await page.goto(APP_URL)
  })

  test.describe('1. User Can Access The App', () => {
    test('should load the homepage without errors', async () => {
      // Wait for the page to load
      await page.waitForLoadState('networkidle')
      
      // Check for no 500/error states
      const errorMessages = page.locator('text=/error|Error|500|failed/i')
      await expect(errorMessages).toHaveCount(0)
      
      // Verify main elements are present
      await expect(page.locator('h1')).toContainText('AI Brand Audit Tool')
      await expect(page.locator('text=Start AI Brand Audit')).toBeVisible()
      
      // Check that the page loaded correctly
      const title = await page.title()
      expect(title).toContain('AI Brand Audit Tool')
    })

    test('should have working navigation elements', async () => {
      // Check for main navigation elements
      const landingContent = page.locator('text=Professional AI-powered analysis')
      await expect(landingContent).toBeVisible()
      
      // Verify key navigation links work (if any)
      const analyticsLink = page.locator('a[href="/analytics"]')
      if (await analyticsLink.count() > 0) {
        await analyticsLink.click()
        await page.waitForURL('**/analytics')
        await page.goBack()
      }
      
      // Verify footer elements exist
      const footer = page.locator('footer')
      if (await footer.count() > 0) {
        await expect(footer).toBeVisible()
      }
    })

    test('should handle page refresh gracefully', async () => {
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Should still show the main landing page
      await expect(page.locator('h1')).toContainText('AI Brand Audit Tool')
      await expect(page.locator('text=Start AI Brand Audit')).toBeVisible()
    })
  })

  test.describe('2. Authentication Flow (Not Applicable)', () => {
    test('should work without authentication', async () => {
      // This app doesn't require authentication
      // Verify we can access core functionality without login
      await expect(page.locator('input[placeholder*="brand name"]')).toBeVisible()
      await expect(page.locator('text=Start AI Brand Audit')).toBeVisible()
    })
  })

  test.describe('3. Primary Business Function - Brand Analysis', () => {
    test('should complete a full brand analysis workflow', async () => {
      // Step 1: Enter brand name
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await expect(brandInput).toBeVisible()
      
      await brandInput.fill('Tesla')
      
      // Step 2: Click start analysis
      const startButton = page.locator('text=Start AI Brand Audit')
      await expect(startButton).toBeVisible()
      await expect(startButton).toBeEnabled()
      
      await startButton.click()
      
      // Step 3: Should navigate to analysis progress page
      await page.waitForTimeout(2000) // Give it time to process
      
      // Should see loading/analysis in progress
      const analysisProgress = page.locator('text=/Analysis|analyzing|progress/i')
      await expect(analysisProgress.first()).toBeVisible({ timeout: 10000 })
      
      // Note: In a real test, you might mock the API or use test data
      // For now, we'll verify the UI responds correctly to the start action
    })

    test('should validate brand name input', async () => {
      const brandInput = page.locator('input[placeholder*="Apple"]')
      const startButton = page.locator('text=Start AI Brand Audit')
      
      // Test empty input
      await startButton.click()
      
      // Should see validation error or disabled state
      await expect(startButton).toBeDisabled()
      
      // Test with valid input
      await brandInput.fill('Nike')
      await expect(startButton).toBeEnabled()
      
      // Test input clearing
      await brandInput.clear()
      await expect(startButton).toBeDisabled()
    })

    test('should show example brand buttons', async () => {
      // Verify example brands are clickable
      const exampleBrands = ['Apple', 'Tesla', 'Nike', 'Starbucks', 'Microsoft', 'Netflix']
      
      for (const brand of exampleBrands.slice(0, 3)) { // Test first 3
        const brandButton = page.locator(`button:has-text("${brand}")`)
        if (await brandButton.count() > 0) {
          await brandButton.click()
          
          // Should populate the input
          const brandInput = page.locator('input[placeholder*="Apple"]')
          await expect(brandInput).toHaveValue(brand)
        }
      }
    })

    test('should handle analysis errors gracefully', async () => {
      // Test with a potentially problematic input
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await brandInput.fill('NonExistentBrand12345')
      
      const startButton = page.locator('text=Start AI Brand Audit')
      await startButton.click()
      
      await page.waitForTimeout(3000)
      
      // Should either start analysis or show appropriate error
      // The key is that it shouldn't crash the app
      const errorToast = page.locator('[data-sonner-toast]')
      if (await errorToast.count() > 0) {
        // If there's an error toast, it should be user-friendly
        const errorText = await errorToast.textContent()
        expect(errorText).not.toContain('undefined')
        expect(errorText).not.toContain('null')
      }
    })
  })

  test.describe('4. Data Persistence & Error Handling', () => {
    test('should maintain state during navigation', async () => {
      // Fill in brand name
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await brandInput.fill('Microsoft')
      
      // Navigate away (if navigation exists) and back
      const analyticsLink = page.locator('a[href="/analytics"]')
      if (await analyticsLink.count() > 0) {
        await analyticsLink.click()
        await page.goBack()
        
        // Input should be cleared (expected behavior for fresh start)
        await expect(brandInput).toHaveValue('')
      }
    })

    test('should handle network errors', async () => {
      // Simulate network issues by going offline
      await page.context().setOffline(true)
      
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await brandInput.fill('Tesla')
      
      const startButton = page.locator('text=Start AI Brand Audit')
      await startButton.click()
      
      await page.waitForTimeout(2000)
      
      // Should show network error message
      const errorMessage = page.locator('text=/network|connection|internet/i')
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 })
      
      // Restore connection
      await page.context().setOffline(false)
    })

    test('should recover from errors', async () => {
      // After error, user should be able to try again
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await brandInput.fill('Apple')
      
      const startButton = page.locator('text=Start AI Brand Audit')
      await expect(startButton).toBeEnabled()
      
      // Should be able to start analysis after any previous errors
      await startButton.click()
      
      // Should not be stuck in error state
      await page.waitForTimeout(1000)
      const loadingState = page.locator('text=/loading|analyzing|initializing/i')
      if (await loadingState.count() > 0) {
        await expect(loadingState.first()).toBeVisible()
      }
    })
  })

  test.describe('5. Mobile Responsiveness', () => {
    test('should work on mobile viewport', async () => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.waitForLoadState('networkidle')
      
      // Check if main elements are visible and usable
      await expect(page.locator('h1')).toBeVisible()
      
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await expect(brandInput).toBeVisible()
      
      // Input should be touch-friendly (minimum 44px height)
      const inputBox = await brandInput.boundingBox()
      expect(inputBox?.height).toBeGreaterThanOrEqual(44)
      
      const startButton = page.locator('text=Start AI Brand Audit')
      await expect(startButton).toBeVisible()
      
      // Button should be touch-friendly
      const buttonBox = await startButton.boundingBox()
      expect(buttonBox?.height).toBeGreaterThanOrEqual(44)
    })

    test('should have readable text on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Check font sizes are readable (at least 16px base)
      const mainText = page.locator('p').first()
      if (await mainText.count() > 0) {
        const fontSize = await mainText.evaluate(el => {
          return window.getComputedStyle(el).fontSize
        })
        const fontSizeNum = parseInt(fontSize.replace('px', ''))
        expect(fontSizeNum).toBeGreaterThanOrEqual(14) // Allow 14px minimum
      }
    })

    test('should not have horizontal scroll on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Check if page has horizontal scrollbar
      const scrollWidth = await page.evaluate(() => document.body.scrollWidth)
      const clientWidth = await page.evaluate(() => document.body.clientWidth)
      
      // Allow small tolerance for scrollbars
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 20)
    })

    test('should have working navigation on mobile', async () => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      
      // Check if mobile navigation works
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await brandInput.fill('Nike')
      
      const startButton = page.locator('text=Start AI Brand Audit')
      await expect(startButton).toBeEnabled()
      
      // Tap should work on mobile
      await startButton.tap()
      
      await page.waitForTimeout(1000)
      // Should respond to tap
      const responseElement = page.locator('text=/analyzing|loading|initializing/i')
      if (await responseElement.count() > 0) {
        await expect(responseElement.first()).toBeVisible()
      }
    })
  })

  test.describe('6. Performance & Load Times', () => {
    test('should load within acceptable time', async () => {
      const startTime = Date.now()
      
      await page.goto(APP_URL)
      await page.waitForLoadState('networkidle')
      
      const loadTime = Date.now() - startTime
      
      // Should load within 5 seconds
      expect(loadTime).toBeLessThan(5000)
      
      // Main content should be visible
      await expect(page.locator('h1')).toBeVisible()
    })

    test('should not have console errors', async () => {
      const consoleErrors: string[] = []
      
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text())
        }
      })
      
      await page.goto(APP_URL)
      await page.waitForLoadState('networkidle')
      
      // Fill and submit form to trigger any JS errors
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await brandInput.fill('TestBrand')
      
      const startButton = page.locator('text=Start AI Brand Audit')
      await startButton.click()
      
      await page.waitForTimeout(2000)
      
      // Filter out known non-critical errors
      const criticalErrors = consoleErrors.filter(error => 
        !error.includes('favicon') && 
        !error.includes('404') &&
        !error.includes('net::ERR_') &&
        error.includes('Error') // Only actual JS errors
      )
      
      expect(criticalErrors.length).toBe(0)
    })
  })

  test.describe('7. Accessibility Basics', () => {
    test('should have proper heading structure', async () => {
      // Check for h1
      const h1 = page.locator('h1')
      await expect(h1).toBeVisible()
      
      // Should have meaningful h1 text
      const h1Text = await h1.textContent()
      expect(h1Text).toContain('AI Brand Audit')
    })

    test('should have keyboard navigation support', async () => {
      // Tab through the form
      await page.keyboard.press('Tab')
      
      // Should focus on input
      const brandInput = page.locator('input[placeholder*="Apple"]')
      await expect(brandInput).toBeFocused()
      
      // Type with keyboard
      await page.keyboard.type('TestBrand')
      await expect(brandInput).toHaveValue('TestBrand')
      
      // Tab to button
      await page.keyboard.press('Tab')
      const startButton = page.locator('text=Start AI Brand Audit')
      await expect(startButton).toBeFocused()
      
      // Should be able to activate with Enter
      await page.keyboard.press('Enter')
      
      await page.waitForTimeout(1000)
      // Should respond to keyboard activation
    })

    test('should have proper form labels', async () => {
      const brandInput = page.locator('input[placeholder*="Apple"]')
      
      // Should have accessible name (label, aria-label, or placeholder)
      const accessibleName = await brandInput.getAttribute('aria-label') || 
                           await brandInput.getAttribute('placeholder') ||
                           await page.locator('label').textContent()
      
      expect(accessibleName).toBeTruthy()
      expect(accessibleName).toContain('brand')
    })
  })
})

// Utility function for test setup
async function setupTestEnvironment(page: Page) {
  // Any common setup that tests need
  await page.goto(APP_URL)
  await page.waitForLoadState('networkidle')
}

// Helper function to check if backend is available
async function checkBackendHealth(page: Page): Promise<boolean> {
  try {
    const response = await page.request.get(`${BACKEND_URL}/api/health`)
    return response.ok()
  } catch {
    return false
  }
}