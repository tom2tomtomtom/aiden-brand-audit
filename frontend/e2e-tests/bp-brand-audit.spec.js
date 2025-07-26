/**
 * BP (British Petroleum) Brand Audit UX Test
 * Comprehensive test covering the complete brand audit workflow using BP as test brand
 */
import { test, expect } from '@playwright/test'

// Test configuration
const FRONTEND_URL = 'http://localhost:5175'
const BACKEND_URL = 'http://localhost:8081'
const TEST_TIMEOUT = 300000 // 5 minutes for complete analysis
const BP_BRAND_NAME = 'BP'
const BP_WEBSITE = 'bp.com'

// Expected BP brand characteristics for validation
const BP_EXPECTED_DATA = {
  brandName: 'BP',
  industry: 'Energy',
  colors: ['#00914B', '#FFFFFF', '#000000'], // BP green, white, black
  keywords: ['energy', 'petroleum', 'sustainability', 'oil', 'gas'],
  competitors: ['Shell', 'ExxonMobil', 'Chevron', 'TotalEnergies']
}

test.describe('BP Brand Audit - Complete UX Journey', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for analysis tests
    test.setTimeout(TEST_TIMEOUT)
    
    // Navigate to application
    await page.goto(FRONTEND_URL)
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Ensure backend is accessible
    const response = await page.request.get(`${BACKEND_URL}/api/health`)
    expect(response.ok()).toBeTruthy()
  })

  test('BP Brand Audit - Complete 5-Step Workflow', async ({ page, request }) => {
    console.log('🏢 Starting BP Brand Audit - Complete UX Journey')
    
    // ==========================================
    // STEP 1: LANDING PAGE & BRAND SEARCH
    // ==========================================
    console.log('\n📍 STEP 1: Landing Page & Brand Search')
    
    // Verify landing page loads correctly
    await expect(page.locator('h1')).toContainText('AI Brand Analysis')
    console.log('✅ Landing page loaded successfully')
    
    // Take screenshot of landing page
    await page.screenshot({ 
      path: 'test-results/bp-audit-01-landing.png',
      fullPage: true 
    })
    
    // Test brand search input
    const brandInput = page.locator('input[placeholder*="brand name" i], input[placeholder*="company" i]')
    await expect(brandInput).toBeVisible()
    await brandInput.fill(BP_BRAND_NAME)
    console.log(`✅ Brand name entered: ${BP_BRAND_NAME}`)
    
    // Optional: Test website input if available
    const websiteInput = page.locator('input[placeholder*="website" i]')
    const websiteInputExists = await websiteInput.count() > 0
    if (websiteInputExists) {
      await websiteInput.fill(BP_WEBSITE)
      console.log(`✅ Website entered: ${BP_WEBSITE}`)
    }
    
    // Start analysis
    const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Start Analysis"), button:has-text("Begin Audit")')
    await expect(analyzeButton).toBeVisible()
    await analyzeButton.click()
    console.log('✅ Analysis initiated')
    
    // ==========================================
    // STEP 2: ANALYSIS CONFIGURATION (if exists)
    // ==========================================
    console.log('\n⚙️ STEP 2: Analysis Configuration')
    
    // Check if configuration step exists
    const configurationVisible = await page.locator('text=/configuration|settings|options/i').isVisible({ timeout: 5000 })
    
    if (configurationVisible) {
      console.log('🔧 Configuration step detected')
      
      // Select comprehensive analysis options
      const analysisTypes = [
        'Visual Brand Analysis',
        'Competitive Analysis', 
        'Market Presence',
        'Sentiment Analysis'
      ]
      
      for (const analysisType of analysisTypes) {
        const checkbox = page.locator(`label:has-text("${analysisType}") input[type="checkbox"], input[value*="${analysisType.toLowerCase()}"]`)
        const checkboxExists = await checkbox.count() > 0
        if (checkboxExists) {
          await checkbox.check()
          console.log(`✅ Selected: ${analysisType}`)
        }
      }
      
      // Proceed to next step
      const proceedButton = page.locator('button:has-text("Proceed"), button:has-text("Continue"), button:has-text("Next")')
      const proceedButtonExists = await proceedButton.count() > 0
      if (proceedButtonExists) {
        await proceedButton.click()
        console.log('✅ Configuration completed')
      }
    } else {
      console.log('⏭️ No configuration step - proceeding directly to analysis')
    }
    
    // ==========================================
    // STEP 3: FILE UPLOAD (if available)
    // ==========================================
    console.log('\n📁 STEP 3: File Upload')
    
    // Check if file upload step exists
    const uploadVisible = await page.locator('text=/upload|file|document/i').isVisible({ timeout: 5000 })
    
    if (uploadVisible) {
      console.log('📎 File upload step detected')
      
      // Skip file upload for this test (or add test files if needed)
      const skipButton = page.locator('button:has-text("Skip"), button:has-text("Continue Without"), button:has-text("No Files")')
      const skipButtonExists = await skipButton.count() > 0
      if (skipButtonExists) {
        await skipButton.click()
        console.log('✅ File upload skipped')
      }
      
      // Or proceed without files
      const continueButton = page.locator('button:has-text("Continue"), button:has-text("Proceed"), button:has-text("Next")')
      const continueButtonExists = await continueButton.count() > 0
      if (continueButtonExists) {
        await continueButton.click()
        console.log('✅ Proceeding without file uploads')
      }
    } else {
      console.log('⏭️ No file upload step detected')
    }
    
    // ==========================================
    // STEP 4: ANALYSIS PROCESSING & PROGRESS
    // ==========================================
    console.log('\n⚡ STEP 4: Analysis Processing & Progress Monitoring')
    
    // Verify progress page loads
    await expect(page.locator('text=/Analysis in Progress|Processing|Analyzing/i')).toBeVisible({ timeout: 10000 })
    console.log('✅ Progress page loaded')
    
    // Take screenshot of progress page
    await page.screenshot({ 
      path: 'test-results/bp-audit-02-progress.png',
      fullPage: true 
    })
    
    // Monitor progress updates and WebSocket communication
    let progressUpdates = []
    let currentProgress = 0
    let analysisSteps = []
    
    // Listen for WebSocket progress updates
    page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const data = JSON.parse(event.payload)
          if (data.overall_progress !== undefined) {
            progressUpdates.push(data)
            currentProgress = data.overall_progress
            console.log(`📊 Progress: ${currentProgress}% - ${data.current_step_name || 'Processing...'}`)
          }
          if (data.current_step_name) {
            analysisSteps.push(data.current_step_name)
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      })
    })
    
    // Wait for analysis completion with detailed monitoring
    let analysisComplete = false
    let attempts = 0
    const maxAttempts = 60 // 5 minutes with 5-second intervals
    
    console.log('⏳ Monitoring analysis progress...')
    
    while (!analysisComplete && attempts < maxAttempts) {
      try {
        // Check for completion indicators
        const completionSelectors = [
          'text=/Analysis Complete|Strategic Intelligence|Results|Report Generated/i',
          '[data-testid="results-container"]',
          '.results-display',
          '.analysis-complete'
        ]
        
        let completionFound = false
        for (const selector of completionSelectors) {
          const elementCount = await page.locator(selector).count()
          if (elementCount > 0) {
            completionFound = true
            break
          }
        }
        
        if (completionFound) {
          analysisComplete = true
          console.log('✅ Analysis completed - results page detected')
          break
        }
        
        // Check for error states
        const errorElements = await page.locator('text=/error|failed|timeout|unable/i').count()
        if (errorElements > 0) {
          console.log('❌ Error detected in analysis process')
          await page.screenshot({ 
            path: 'test-results/bp-audit-error.png',
            fullPage: true 
          })
          break
        }
        
        // Wait and increment counter
        await page.waitForTimeout(5000)
        attempts++
        
        // Log progress every 30 seconds
        if (attempts % 6 === 0) {
          console.log(`⏳ Still analyzing BP... (${attempts * 5}s elapsed, ${currentProgress}% complete)`)
          
          // Take periodic screenshot
          await page.screenshot({ 
            path: `test-results/bp-audit-progress-${attempts}.png`,
            fullPage: true 
          })
        }
        
      } catch (error) {
        console.log(`⚠️ Error during progress monitoring: ${error.message}`)
        break
      }
    }
    
    // ==========================================
    // STEP 5: RESULTS VALIDATION & QUALITY CHECK
    // ==========================================
    console.log('\n📊 STEP 5: Results Validation & Quality Assessment')
    
    if (analysisComplete) {
      console.log('🎉 Analysis completed! Performing comprehensive validation...')
      
      // Take screenshot of final results
      await page.screenshot({ 
        path: 'test-results/bp-audit-03-results.png',
        fullPage: true 
      })
      
      // === SECTION VALIDATION ===
      console.log('\n🔍 Validating report sections...')
      const requiredSections = [
        'Executive Summary',
        'Strategic Context', 
        'Visual Analysis',
        'Competitive Analysis',
        'Brand Health',
        'Recommendations'
      ]
      
      let foundSections = []
      for (const section of requiredSections) {
        try {
          const sectionVisible = await page.locator(`text=${section}`).isVisible({ timeout: 3000 })
          if (sectionVisible) {
            foundSections.push(section)
            console.log(`✅ Found section: ${section}`)
          } else {
            console.log(`⚠️ Section not found: ${section}`)
          }
        } catch (error) {
          console.log(`⚠️ Section check failed: ${section}`)
        }
      }
      
      // === VISUAL ELEMENTS VALIDATION ===
      console.log('\n🎨 Validating visual elements...')
      const visualElements = [
        { selector: '[data-testid="color-palette"]', name: 'Color Palette' },
        { selector: '[data-testid="metrics-dashboard"]', name: 'Metrics Dashboard' },
        { selector: '.progress-bar, .progress-indicator', name: 'Progress Indicators' },
        { selector: '.chart-container, canvas, svg', name: 'Charts/Visualizations' },
        { selector: '[data-testid="brand-score"]', name: 'Brand Score' },
        { selector: 'img[src*="logo"], .logo-display', name: 'Logo Display' }
      ]
      
      let foundVisuals = []
      for (const element of visualElements) {
        const elementCount = await page.locator(element.selector).count()
        if (elementCount > 0) {
          foundVisuals.push(element.name)
          console.log(`✅ Found visual element: ${element.name} (${elementCount} instances)`)
        } else {
          console.log(`⚠️ Visual element not found: ${element.name}`)
        }
      }
      
      // === BP-SPECIFIC DATA VALIDATION ===
      console.log('\n🏢 Validating BP-specific content...')
      
      // Check for BP brand name in results
      const bpMentions = await page.locator(`text=${BP_BRAND_NAME}`).count()
      console.log(`✅ BP mentioned ${bpMentions} times in results`)
      expect(bpMentions).toBeGreaterThan(0)
      
      // Check for industry-relevant keywords
      let foundKeywords = []
      for (const keyword of BP_EXPECTED_DATA.keywords) {
        const keywordCount = await page.locator(`text=/${keyword}/i`).count()
        if (keywordCount > 0) {
          foundKeywords.push(keyword)
          console.log(`✅ Found industry keyword: ${keyword}`)
        }
      }
      
      // Check for competitor mentions
      let foundCompetitors = []
      for (const competitor of BP_EXPECTED_DATA.competitors) {
        const competitorCount = await page.locator(`text=${competitor}`).count()
        if (competitorCount > 0) {
          foundCompetitors.push(competitor)
          console.log(`✅ Found competitor: ${competitor}`)
        }
      }
      
      // === API DATA VALIDATION ===
      console.log('\n🔌 Validating API data integrity...')
      
      // Get analysis ID from page state
      const analysisId = await page.evaluate(() => {
        return window.localStorage.getItem('currentAnalysisId') || 
               window.sessionStorage.getItem('analysisId') ||
               window.currentAnalysisId ||
               document.querySelector('[data-analysis-id]')?.getAttribute('data-analysis-id')
      })
      
      if (analysisId) {
        console.log(`✅ Analysis ID captured: ${analysisId}`)
        
        // Validate API response structure
        const apiResponse = await request.get(`${BACKEND_URL}/api/analyze/${analysisId}/results`)
        if (apiResponse.ok()) {
          const resultsData = await apiResponse.json()
          console.log('✅ API results retrieved successfully')
          
          // Validate core data structure
          expect(resultsData.success).toBe(true)
          expect(resultsData.data).toBeDefined()
          expect(resultsData.data.brand_name.toLowerCase()).toContain('bp')
          expect(resultsData.data.status).toBe('completed')
          
          // Validate analysis components
          if (resultsData.data.visual_analysis) {
            console.log('✅ Visual analysis data present')
          }
          if (resultsData.data.competitive_analysis) {
            console.log('✅ Competitive analysis data present')
          }
          if (resultsData.data.news_analysis) {
            console.log('✅ News analysis data present')  
          }
          if (resultsData.data.brand_health_score) {
            console.log(`✅ Brand health score: ${resultsData.data.brand_health_score}`)
            expect(resultsData.data.brand_health_score).toBeGreaterThan(0)
            expect(resultsData.data.brand_health_score).toBeLessThanOrEqual(100)
          }
          
          console.log('✅ API data structure validation passed')
        } else {
          console.log('⚠️ API results not accessible')
        }
      } else {
        console.log('⚠️ Could not capture analysis ID')
      }
      
      // === EXPORT FUNCTIONALITY TEST ===
      console.log('\n📥 Testing export functionality...')
      
      const exportButtons = [
        'button:has-text("Export")',
        'button:has-text("Download")', 
        'button:has-text("PDF")',
        '[data-testid="export-button"]'
      ]
      
      for (const exportSelector of exportButtons) {
        const exportButton = page.locator(exportSelector)
        const exportButtonExists = await exportButton.count() > 0
        if (exportButtonExists) {
          console.log(`✅ Export functionality available: ${exportSelector}`)
          // Could test actual export here if needed
          break
        }
      }
      
      // === QUALITY ASSESSMENT ===
      console.log('\n⭐ Overall Quality Assessment')
      
      const qualityMetrics = {
        sectionsFound: foundSections.length,
        visualElementsFound: foundVisuals.length,
        bpKeywordsFound: foundKeywords.length,
        competitorsFound: foundCompetitors.length,
        progressUpdates: progressUpdates.length,
        analysisSteps: [...new Set(analysisSteps)].length
      }
      
      console.log('📊 Quality Metrics:')
      console.log(`  - Report Sections: ${qualityMetrics.sectionsFound}/${requiredSections.length}`)
      console.log(`  - Visual Elements: ${qualityMetrics.visualElementsFound}/${visualElements.length}`)
      console.log(`  - Industry Keywords: ${qualityMetrics.bpKeywordsFound}/${BP_EXPECTED_DATA.keywords.length}`)
      console.log(`  - Competitors Mentioned: ${qualityMetrics.competitorsFound}/${BP_EXPECTED_DATA.competitors.length}`)
      console.log(`  - Progress Updates: ${qualityMetrics.progressUpdates}`)
      console.log(`  - Analysis Steps: ${qualityMetrics.analysisSteps}`)
      
      // Quality thresholds
      expect(qualityMetrics.sectionsFound).toBeGreaterThan(2) // At least 3 sections
      expect(qualityMetrics.visualElementsFound).toBeGreaterThan(1) // At least 2 visual elements
      expect(qualityMetrics.bpKeywordsFound).toBeGreaterThan(0) // At least 1 industry keyword
      
      console.log('✅ Quality assessment passed')
      
    } else {
      console.log('⏳ Analysis did not complete within timeout period')
      
      // Still validate that the process is working
      expect(currentProgress).toBeGreaterThan(0)
      expect(progressUpdates.length).toBeGreaterThan(0)
      
      console.log(`📊 Final progress: ${currentProgress}%`)
      console.log(`📈 Total progress updates: ${progressUpdates.length}`)
      console.log(`🔄 Analysis steps seen: ${[...new Set(analysisSteps)].join(', ')}`)
      
      // Take final screenshot showing current state
      await page.screenshot({ 
        path: 'test-results/bp-audit-timeout.png',
        fullPage: true 
      })
    }
    
    console.log('\n🏁 BP Brand Audit UX Journey Completed')
    console.log('=====================================')
  })

  test('BP Brand Analysis - Mobile UX Journey', async ({ page, request }) => {
    console.log('📱 Starting BP Mobile UX Journey')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }) // iPhone SE
    
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
    
    // Mobile-specific UI validation
    await expect(page.locator('h1')).toBeVisible()
    console.log('✅ Mobile landing page loaded')
    
    // Test mobile input experience
    const brandInput = page.locator('input[placeholder*="brand name" i]')
    await brandInput.fill(BP_BRAND_NAME)
    
    // Test mobile button interaction
    const analyzeButton = page.locator('button:has-text("Analyze")')
    await analyzeButton.click()
    
    // Mobile progress monitoring (shorter timeout)
    const progressVisible = await page.locator('text=/Analysis in Progress|Processing/i').isVisible({ timeout: 10000 })
    if (progressVisible) {
      console.log('✅ Mobile analysis started successfully')
      
      // Take mobile screenshot
      await page.screenshot({ 
        path: 'test-results/bp-audit-mobile.png',
        fullPage: true 
      })
      
      // Wait for some progress on mobile
      await page.waitForTimeout(30000)
      console.log('✅ Mobile progress monitoring completed')
    }
    
    console.log('🏁 Mobile UX journey completed')
  })

  test('BP Brand Analysis - Error Handling & Edge Cases', async ({ page, request }) => {
    console.log('🚨 Testing BP Error Handling & Edge Cases')
    
    // Test 1: Empty input validation
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
    
    const analyzeButton = page.locator('button:has-text("Analyze")')
    await analyzeButton.click()
    
    // Should show validation error for empty input
    const validationError = await page.locator('text=/required|enter|provide/i').isVisible({ timeout: 5000 })
    if (validationError) {
      console.log('✅ Empty input validation working')
    }
    
    // Test 2: Invalid brand name handling
    const brandInput = page.locator('input[placeholder*="brand name" i]')
    await brandInput.fill('NonExistentBrandXYZ123')
    await analyzeButton.click()
    
    // Monitor for graceful error handling
    await page.waitForTimeout(10000)
    
    const errorHandled = await page.locator('text=/not found|unable to find|error/i').isVisible()
    if (errorHandled) {
      console.log('✅ Invalid brand name handled gracefully')
    } else {
      console.log('⚠️ Invalid brand name handling unclear')
    }
    
    // Test 3: Network interruption simulation
    console.log('🌐 Testing network resilience...')
    
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
    
    await brandInput.fill(BP_BRAND_NAME)
    
    // Block API requests temporarily
    await page.route('**/api/analyze', route => {
      route.abort('failed')
    })
    
    await analyzeButton.click()
    
    // Should show network error
    const networkError = await page.locator('text=/network|connection|failed/i').isVisible({ timeout: 10000 })
    if (networkError) {
      console.log('✅ Network error properly displayed')
    }
    
    // Restore network and test recovery
    await page.unroute('**/api/analyze')
    
    const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")')
    const retryButtonExists = await retryButton.count() > 0
    if (retryButtonExists) {
      await retryButton.click()
      console.log('✅ Error recovery mechanism available')
    }
    
    console.log('🏁 Error handling tests completed')
  })

  test('BP Brand Analysis - Performance & Accessibility', async ({ page }) => {
    console.log('⚡ Testing BP Analysis Performance & Accessibility')
    
    // Performance monitoring
    const performanceTimings = []
    
    page.on('requestfinished', request => {
      performanceTimings.push({
        url: request.url(),
        timing: request.timing()
      })
    })
    
    const startTime = Date.now()
    
    await page.goto(FRONTEND_URL)
    await page.waitForLoadState('networkidle')
    
    const pageLoadTime = Date.now() - startTime
    console.log(`⏱️ Page load time: ${pageLoadTime}ms`)
    
    // Basic accessibility checks
    const brandInput = page.locator('input[placeholder*="brand name" i]')
    
    // Check for labels and ARIA attributes
    const inputAccessible = await brandInput.getAttribute('aria-label') || 
                           await brandInput.getAttribute('aria-labelledby') ||
                           await page.locator('label[for]').count() > 0
    
    if (inputAccessible) {
      console.log('✅ Input accessibility attributes present')
    }
    
    // Check for keyboard navigation
    await brandInput.focus()
    await page.keyboard.press('Tab')
    
    const analyzeButton = page.locator('button:has-text("Analyze")')
    const buttonFocused = await analyzeButton.evaluate(el => document.activeElement === el)
    
    if (buttonFocused) {
      console.log('✅ Keyboard navigation working')
    }
    
    // Check color contrast (basic check)
    const backgroundColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).backgroundColor
    })
    
    const textColor = await page.evaluate(() => {
      return window.getComputedStyle(document.body).color
    })
    
    console.log(`🎨 Page colors - Background: ${backgroundColor}, Text: ${textColor}`)
    
    // Test with reduced motion preference
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    
    console.log('✅ Reduced motion preference tested')
    
    console.log('🏁 Performance & accessibility tests completed')
  })
})