/**
 * Test Helper Utilities
 * Common functions and utilities for Playwright tests
 */

/**
 * Test configuration and constants
 */
export const TEST_CONFIG = {
  FRONTEND_URL: 'http://localhost:5175',
  BACKEND_URL: 'http://localhost:8000',
  DEFAULT_TIMEOUT: 30000,
  ANALYSIS_TIMEOUT: 300000, // 5 minutes
  SCREENSHOT_PATH: 'test-results/',
  
  // Test data
  BRANDS: {
    BP: {
      name: 'BP',
      website: 'bp.com',
      industry: 'Energy',
      colors: ['#00914B', '#FFFFFF', '#000000'],
      keywords: ['energy', 'petroleum', 'sustainability', 'oil', 'gas'],
      competitors: ['Shell', 'ExxonMobil', 'Chevron', 'TotalEnergies']
    },
    REDBULL: {
      name: 'Red Bull',
      website: 'redbull.com',
      industry: 'Beverages & Energy Drinks',
      colors: ['#1E4CB5', '#FFCC00', '#DC143C', '#FFFFFF'],
      keywords: ['energy drink', 'wings', 'extreme sports', 'caffeine', 'beverage', 'sports'],
      competitors: ['Monster Energy', 'Rockstar', '5-hour Energy', 'Bang Energy']
    },
    APPLE: {
      name: 'Apple',
      website: 'apple.com',
      industry: 'Technology',
      colors: ['#000000', '#FFFFFF', '#007AFF'],
      keywords: ['technology', 'innovation', 'iphone', 'mac', 'ios'],
      competitors: ['Samsung', 'Google', 'Microsoft', 'Sony']
    },
    NIKE: {
      name: 'Nike',
      website: 'nike.com',
      industry: 'Sports & Apparel',
      colors: ['#000000', '#FFFFFF', '#FF6900'],
      keywords: ['sports', 'athletic', 'footwear', 'apparel', 'fitness'],
      competitors: ['Adidas', 'Puma', 'Under Armour', 'Reebok']
    }
  }
}

/**
 * Screenshot utilities
 */
export class ScreenshotHelper {
  static async takePageScreenshot(page, testName, step) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${testName}-${step}-${timestamp}.png`
    const path = `${TEST_CONFIG.SCREENSHOT_PATH}${filename}`
    
    await page.screenshot({ 
      path: path,
      fullPage: true 
    })
    
    console.log(`📸 Screenshot saved: ${filename}`)
    return path
  }

  static async takeElementScreenshot(page, selector, testName, elementName) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `${testName}-${elementName}-${timestamp}.png`
    const path = `${TEST_CONFIG.SCREENSHOT_PATH}${filename}`
    
    const element = page.locator(selector)
    if (await element.count() > 0) {
      await element.screenshot({ path: path })
      console.log(`📸 Element screenshot saved: ${filename}`)
      return path
    }
    
    return null
  }

  static async takeComparisonScreenshots(page, testName, beforeAction, afterAction) {
    const beforePath = await this.takePageScreenshot(page, testName, 'before')
    await beforeAction()
    const afterPath = await this.takePageScreenshot(page, testName, 'after')
    
    return { beforePath, afterPath }
  }
}

/**
 * Wait and retry utilities
 */
export class WaitHelper {
  /**
   * Wait for element with multiple selectors
   */
  static async waitForAnyElement(page, selectors, timeout = TEST_CONFIG.DEFAULT_TIMEOUT) {
    const promises = selectors.map(selector => 
      page.locator(selector).waitFor({ timeout }).catch(() => null)
    )
    
    return await Promise.race(promises)
  }

  /**
   * Wait for condition with retry logic
   */
  static async waitForCondition(conditionFn, options = {}) {
    const {
      timeout = TEST_CONFIG.DEFAULT_TIMEOUT,
      interval = 1000,
      description = 'condition'
    } = options
    
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      try {
        const result = await conditionFn()
        if (result) {
          return result
        }
      } catch (error) {
        // Continue trying
      }
      
      await this.sleep(interval)
    }
    
    throw new Error(`Timeout waiting for ${description} after ${timeout}ms`)
  }

  /**
   * Smart sleep that accounts for page activity
   */
  static async smartSleep(page, duration = 1000) {
    await page.waitForTimeout(duration)
    await page.waitForLoadState('networkidle', { timeout: 5000 }).catch(() => {})
  }

  /**
   * Basic sleep utility
   */
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * API testing utilities
 */
export class APIHelper {
  /**
   * Test backend health
   */
  static async testBackendHealth(request) {
    try {
      const response = await request.get(`${TEST_CONFIG.BACKEND_URL}/api/health`)
      return {
        healthy: response.ok(),
        status: response.status(),
        data: response.ok() ? await response.json().catch(() => null) : null
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      }
    }
  }

  /**
   * Get analysis results via API
   */
  static async getAnalysisResults(request, analysisId) {
    try {
      const response = await request.get(`${TEST_CONFIG.BACKEND_URL}/api/analyze/${analysisId}/results`)
      
      if (response.ok()) {
        return {
          success: true,
          data: await response.json()
        }
      } else {
        return {
          success: false,
          status: response.status(),
          error: await response.text()
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Monitor analysis status via API
   */
  static async monitorAnalysisStatus(request, analysisId, maxWaitTime = 300000) {
    const startTime = Date.now()
    const statusHistory = []
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const response = await request.get(`${TEST_CONFIG.BACKEND_URL}/api/analyze/${analysisId}/status`)
        
        if (response.ok()) {
          const statusData = await response.json()
          statusHistory.push({
            timestamp: Date.now(),
            ...statusData
          })
          
          if (statusData.data && statusData.data.status === 'completed') {
            return {
              completed: true,
              statusHistory,
              finalStatus: statusData
            }
          }
          
          if (statusData.data && statusData.data.status === 'failed') {
            return {
              completed: false,
              failed: true,
              statusHistory,
              finalStatus: statusData
            }
          }
        }
        
        await WaitHelper.sleep(5000) // Check every 5 seconds
        
      } catch (error) {
        console.log(`API monitoring error: ${error.message}`)
        break
      }
    }
    
    return {
      completed: false,
      timeout: true,
      statusHistory
    }
  }
}

/**
 * Data validation utilities
 */
export class ValidationHelper {
  /**
   * Validate brand data structure
   */
  static validateBrandData(data, expectedBrand) {
    const errors = []
    
    if (!data.brand_name || !data.brand_name.toLowerCase().includes(expectedBrand.name.toLowerCase())) {
      errors.push(`Brand name mismatch: expected ${expectedBrand.name}, got ${data.brand_name}`)
    }
    
    if (data.brand_health_score !== undefined) {
      if (data.brand_health_score < 0 || data.brand_health_score > 100) {
        errors.push(`Invalid brand health score: ${data.brand_health_score}`)
      }
    }
    
    if (data.status !== 'completed') {
      errors.push(`Analysis not completed: status is ${data.status}`)
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Validate visual analysis data
   */
  static validateVisualAnalysis(visualData) {
    const errors = []
    
    if (!visualData) {
      errors.push('Visual analysis data missing')
      return { valid: false, errors }
    }
    
    if (visualData.colors && Array.isArray(visualData.colors)) {
      if (visualData.colors.length === 0) {
        errors.push('No colors extracted')
      }
    }
    
    if (visualData.logos && Array.isArray(visualData.logos)) {
      if (visualData.logos.length === 0) {
        errors.push('No logos captured')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors,
      stats: {
        colorsFound: visualData.colors ? visualData.colors.length : 0,
        logosFound: visualData.logos ? visualData.logos.length : 0
      }
    }
  }

  /**
   * Validate competitive analysis data
   */
  static validateCompetitiveAnalysis(competitiveData, expectedCompetitors) {
    const errors = []
    const stats = {
      competitorsFound: 0,
      expectedCompetitorsFound: 0
    }
    
    if (!competitiveData) {
      errors.push('Competitive analysis data missing')
      return { valid: false, errors, stats }
    }
    
    if (competitiveData.competitors && Array.isArray(competitiveData.competitors)) {
      stats.competitorsFound = competitiveData.competitors.length
      
      const foundExpectedCompetitors = competitiveData.competitors.filter(comp => 
        expectedCompetitors.some(expected => 
          comp.name && comp.name.toLowerCase().includes(expected.toLowerCase())
        )
      )
      
      stats.expectedCompetitorsFound = foundExpectedCompetitors.length
      
      if (stats.expectedCompetitorsFound === 0) {
        errors.push('None of the expected competitors found in analysis')
      }
    } else {
      errors.push('No competitors data found')
    }
    
    return {
      valid: errors.length === 0,
      errors,
      stats
    }
  }
}

/**
 * Performance measurement utilities
 */
export class PerformanceHelper {
  /**
   * Measure page load performance
   */
  static async measurePageLoad(page, url) {
    const startTime = Date.now()
    
    await page.goto(url)
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const perfData = performance.getEntriesByType('navigation')[0]
      return {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByType('paint')[1]?.startTime || 0
      }
    })
    
    return {
      totalLoadTime: loadTime,
      ...metrics
    }
  }

  /**
   * Monitor network requests during test
   */
  static setupNetworkMonitoring(page) {
    const networkLogs = []
    
    page.on('request', request => {
      networkLogs.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        timestamp: Date.now()
      })
    })
    
    page.on('response', response => {
      networkLogs.push({
        type: 'response',
        url: response.url(),
        status: response.status(),
        timestamp: Date.now()
      })
    })
    
    return {
      getLogs: () => networkLogs,
      getFailedRequests: () => networkLogs.filter(log => 
        log.type === 'response' && log.status >= 400
      ),
      getSlowRequests: (threshold = 5000) => {
        const requests = networkLogs.filter(log => log.type === 'request')
        const responses = networkLogs.filter(log => log.type === 'response')
        
        return requests.map(req => {
          const resp = responses.find(r => r.url === req.url)
          const duration = resp ? resp.timestamp - req.timestamp : null
          return { ...req, duration }
        }).filter(req => req.duration && req.duration > threshold)
      }
    }
  }
}

/**
 * Test data utilities
 */
export class TestDataHelper {
  /**
   * Get random test brand
   */
  static getRandomBrand() {
    const brands = Object.values(TEST_CONFIG.BRANDS)
    return brands[Math.floor(Math.random() * brands.length)]
  }

  /**
   * Generate test analysis data
   */
  static generateTestAnalysisData(brandName) {
    return {
      brand_name: brandName,
      analysis_id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      expected_duration: Math.floor(Math.random() * 180) + 60 // 1-3 minutes
    }
  }

  /**
   * Create test file for upload
   */
  static async createTestFile(page, filename, content) {
    // This would create a temporary file for testing file upload
    // Implementation depends on test environment capabilities
    return {
      name: filename,
      content: content,
      size: content.length
    }
  }
}

/**
 * Accessibility testing utilities
 */
export class AccessibilityHelper {
  /**
   * Basic accessibility checks
   */
  static async checkBasicAccessibility(page) {
    const results = {
      hasAltText: true,
      hasLabels: true,
      hasHeadings: true,
      keyboardNavigable: true,
      colorContrast: 'unknown'
    }
    
    // Check for images without alt text
    const imagesWithoutAlt = await page.locator('img:not([alt])').count()
    results.hasAltText = imagesWithoutAlt === 0
    
    // Check for inputs without labels
    const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([aria-labelledby])').count()
    const labelsCount = await page.locator('label').count()
    results.hasLabels = inputsWithoutLabels === 0 || labelsCount > 0
    
    // Check for heading structure
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').count()
    results.hasHeadings = headings > 0
    
    // Basic keyboard navigation test
    try {
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      results.keyboardNavigable = true
    } catch {
      results.keyboardNavigable = false
    }
    
    return results
  }

  /**
   * Test keyboard navigation flow
   */
  static async testKeyboardNavigation(page, expectedStops = []) {
    const focusedElements = []
    
    for (let i = 0; i < expectedStops.length + 2; i++) {
      await page.keyboard.press('Tab')
      
      const activeElement = await page.evaluate(() => {
        const el = document.activeElement
        return {
          tagName: el.tagName,
          id: el.id,
          className: el.className,
          text: el.textContent?.substring(0, 50)
        }
      })
      
      focusedElements.push(activeElement)
      await WaitHelper.sleep(100)
    }
    
    return focusedElements
  }
}

/**
 * Error handling utilities
 */
export class ErrorHelper {
  /**
   * Capture error information from page
   */
  static async capturePageErrors(page) {
    const errors = []
    
    page.on('pageerror', error => {
      errors.push({
        type: 'javascript',
        message: error.message,
        stack: error.stack,
        timestamp: Date.now()
      })
    })
    
    page.on('requestfailed', request => {
      errors.push({
        type: 'network',
        url: request.url(),
        failure: request.failure()?.errorText,
        timestamp: Date.now()
      })
    })
    
    return {
      getErrors: () => errors,
      hasErrors: () => errors.length > 0,
      getJSErrors: () => errors.filter(e => e.type === 'javascript'),
      getNetworkErrors: () => errors.filter(e => e.type === 'network')
    }
  }

  /**
   * Test error recovery mechanisms
   */
  static async testErrorRecovery(page, errorAction, recoveryAction) {
    const initialState = await page.url()
    
    try {
      await errorAction()
      await WaitHelper.sleep(2000)
      
      const errorPresent = await page.locator('text=/error|failed|unable/i').isVisible({ timeout: 5000 })
      
      if (errorPresent) {
        await recoveryAction()
        await WaitHelper.sleep(1000)
        
        const recovered = await page.locator('text=/error|failed|unable/i').isVisible({ timeout: 2000 })
        
        return {
          errorTriggered: true,
          recoverySuccessful: !recovered,
          finalUrl: await page.url()
        }
      }
      
      return {
        errorTriggered: false,
        recoverySuccessful: false,
        finalUrl: await page.url()
      }
      
    } catch (error) {
      return {
        errorTriggered: true,
        recoverySuccessful: false,
        error: error.message,
        finalUrl: await page.url()
      }
    }
  }
}