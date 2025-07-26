/**
 * Landing Page Object Model
 * Encapsulates all landing page interactions and elements
 */
import { expect } from '@playwright/test'
export class LandingPage {
  constructor(page) {
    this.page = page
    
    // Main elements
    this.heading = page.locator('h1')
    this.brandInput = page.locator('input[placeholder*="company name" i]')
    this.websiteInput = page.locator('input[placeholder*="website" i]')
    this.analyzeButton = page.locator('button:has-text("Start AI Brand Audit")')
    
    // Navigation elements
    this.loginLink = page.locator('a:has-text("Login"), button:has-text("Sign In")')
    this.signupLink = page.locator('a:has-text("Sign Up"), button:has-text("Register")')
    
    // Feature sections
    this.featuresSection = page.locator('[data-testid="features"], .features-section')
    this.benefitsSection = page.locator('[data-testid="benefits"], .benefits-section')
  }

  /**
   * Navigate to the landing page
   */
  async goto() {
    await this.page.goto('/')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Verify the landing page has loaded correctly
   */
  async verifyPageLoaded() {
    await this.heading.waitFor()
    const headingText = await this.heading.textContent()
    if (!headingText.toLowerCase().includes('brand') && !headingText.toLowerCase().includes('audit')) {
      throw new Error(`Landing page heading unexpected: ${headingText}`)
    }
  }

  /**
   * Enter brand information and start analysis
   * @param {string} brandName - The brand name to analyze
   * @param {string} website - Optional website URL
   */
  async startBrandAnalysis(brandName, website = null) {
    // Enter brand name
    await this.brandInput.waitFor()
    await this.brandInput.fill(brandName)
    
    // Wait for button to be enabled after entering text
    await this.page.waitForTimeout(500) // Brief pause for UI to update
    
    // Enter website if provided and input exists
    const websiteInputExists = await this.websiteInput.count() > 0
    if (website && websiteInputExists) {
      await this.websiteInput.fill(website)
    }
    
    // Wait for analyze button to be enabled and click it
    await this.analyzeButton.waitFor()
    await expect(this.analyzeButton).toBeEnabled({ timeout: 10000 })
    await this.analyzeButton.click()
  }

  /**
   * Validate input field requirements
   */
  async validateEmptyInput() {
    await this.analyzeButton.click()
    
    // Check for validation messages
    const validationMessage = this.page.locator('text=/required|enter|provide/i')
    return await validationMessage.isVisible({ timeout: 5000 })
  }

  /**
   * Check if the page is responsive on mobile
   */
  async validateMobileLayout() {
    const brandInputVisible = await this.brandInput.isVisible()
    const analyzeButtonVisible = await this.analyzeButton.isVisible()
    const headingVisible = await this.heading.isVisible()
    
    return brandInputVisible && analyzeButtonVisible && headingVisible
  }

  /**
   * Take a screenshot of the landing page
   */
  async takeScreenshot(path) {
    await this.page.screenshot({ 
      path: path,
      fullPage: true 
    })
  }

  /**
   * Check for accessibility features
   */
  async validateAccessibility() {
    const results = {
      inputHasLabel: false,
      buttonHasText: false,
      keyboardNavigable: false
    }
    
    // Check input accessibility
    const inputLabel = await this.brandInput.getAttribute('aria-label') || 
                      await this.brandInput.getAttribute('aria-labelledby') ||
                      await this.page.locator('label[for]').count() > 0
    results.inputHasLabel = !!inputLabel
    
    // Check button accessibility
    const buttonText = await this.analyzeButton.textContent()
    results.buttonHasText = !!buttonText && buttonText.trim().length > 0
    
    // Check keyboard navigation
    await this.brandInput.focus()
    await this.page.keyboard.press('Tab')
    const buttonFocused = await this.analyzeButton.evaluate(el => document.activeElement === el)
    results.keyboardNavigable = buttonFocused
    
    return results
  }
}