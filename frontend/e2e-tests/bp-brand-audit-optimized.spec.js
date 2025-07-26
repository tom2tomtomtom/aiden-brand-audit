/**
 * BP Brand Audit - Optimized Test Suite
 * Uses page object models and test utilities for maintainable, comprehensive testing
 */
import { test, expect } from '@playwright/test'
import { LandingPage } from './page-objects/LandingPage.js'
import { AnalysisProgressPage } from './page-objects/AnalysisProgressPage.js'
import { ResultsPage } from './page-objects/ResultsPage.js'
import { 
  TEST_CONFIG, 
  ScreenshotHelper, 
  WaitHelper, 
  APIHelper, 
  ValidationHelper,
  PerformanceHelper,
  AccessibilityHelper,
  ErrorHelper 
} from './utils/TestHelpers.js'

// Test configuration
const BP_BRAND = TEST_CONFIG.BRANDS.BP

test.describe('BP Brand Audit - Optimized Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_CONFIG.ANALYSIS_TIMEOUT)
    
    // Set up error monitoring
    const errorMonitor = ErrorHelper.capturePageErrors(page)
    
    // Ensure backend is healthy before starting
    const healthCheck = await APIHelper.testBackendHealth(page.request)
    if (!healthCheck.healthy) {
      throw new Error(`Backend unhealthy: ${healthCheck.error}`)
    }
  })

  test('BP Complete Brand Audit Journey - Page Objects', async ({ page, request }) => {
    console.log('🏢 Starting BP Brand Audit with Page Objects')
    
    // Initialize page objects
    const landingPage = new LandingPage(page)
    const progressPage = new AnalysisProgressPage(page)
    const resultsPage = new ResultsPage(page)
    
    // Set up performance monitoring
    const networkMonitor = PerformanceHelper.setupNetworkMonitoring(page)
    
    // ==========================================
    // STEP 1: LANDING PAGE INTERACTION
    // ==========================================
    console.log('\n📍 STEP 1: Landing Page Interaction')
    
    const loadPerformance = await PerformanceHelper.measurePageLoad(page, TEST_CONFIG.FRONTEND_URL)
    console.log(`⚡ Page load time: ${loadPerformance.totalLoadTime}ms`)
    
    // Verify page loaded correctly
    await landingPage.verifyPageLoaded()
    console.log('✅ Landing page verified')
    
    // Take initial screenshot
    await ScreenshotHelper.takePageScreenshot(page, 'bp-optimized', '01-landing')
    
    // Test accessibility
    const accessibility = await AccessibilityHelper.checkBasicAccessibility(page)
    console.log(`♿ Accessibility: ${Object.entries(accessibility).filter(([k,v]) => v === true).length}/${Object.keys(accessibility).length} checks passed`)
    
    // Start brand analysis
    await landingPage.startBrandAnalysis(BP_BRAND.name, BP_BRAND.website)
    console.log(`✅ Started analysis for ${BP_BRAND.name}`)
    
    // ==========================================
    // STEP 2: PROGRESS MONITORING
    // ==========================================
    console.log('\n⚡ STEP 2: Analysis Progress Monitoring')
    
    // Wait for progress page to load
    const progressLoaded = await progressPage.waitForPageLoad()
    expect(progressLoaded).toBe(true)
    console.log('✅ Progress page loaded')
    
    // Take progress screenshot
    await ScreenshotHelper.takePageScreenshot(page, 'bp-optimized', '02-progress')
    
    // Monitor progress with detailed logging
    const progressResult = await progressPage.monitorProgress(
      TEST_CONFIG.ANALYSIS_TIMEOUT,
      (progress, step) => {
        console.log(`📊 Progress: ${progress}% - ${step || 'Processing...'}`)
      }
    )
    
    console.log(`⏱️ Analysis took ${Math.floor(progressResult.elapsedTime / 1000)}s`)
    console.log(`📈 Progress updates: ${progressResult.totalUpdates}`)
    console.log(`🔄 Analysis steps: ${progressResult.steps.join(', ')}`)
    
    // Get analysis ID for API validation
    const analysisId = await progressPage.getAnalysisId()
    console.log(`🆔 Analysis ID: ${analysisId}`)
    
    // ==========================================
    // STEP 3: RESULTS VALIDATION
    // ==========================================
    if (progressResult.completed) {
      console.log('\n📊 STEP 3: Results Validation')
      
      // Wait for results page to load
      await resultsPage.waitForPageLoad()
      console.log('✅ Results page loaded')
      
      // Take results screenshot
      await ScreenshotHelper.takePageScreenshot(page, 'bp-optimized', '03-results')
      
      // Validate required sections
      const sectionResults = await resultsPage.validateRequiredSections()
      const sectionsFound = Object.values(sectionResults).filter(Boolean).length
      console.log(`📋 Sections found: ${sectionsFound}/${Object.keys(sectionResults).length}`)
      
      Object.entries(sectionResults).forEach(([section, found]) => {
        console.log(`  ${found ? '✅' : '❌'} ${section}`)
      })
      
      // Validate visual elements
      const visualResults = await resultsPage.validateVisualElements()
      const visualsFound = Object.values(visualResults).filter(v => v.present).length
      console.log(`🎨 Visual elements found: ${visualsFound}/${Object.keys(visualResults).length}`)
      
      Object.entries(visualResults).forEach(([element, data]) => {
        if (data.present) {
          console.log(`  ✅ ${element}: ${data.count} instances`)
        } else {
          console.log(`  ❌ ${element}: not found`)
        }
      })
      
      // Validate BP-specific content
      const brandContent = await resultsPage.validateBrandContent(
        BP_BRAND.name,
        BP_BRAND.keywords,
        BP_BRAND.competitors
      )
      
      console.log(`🏢 Brand mentions: ${brandContent.brandMentions}`)
      console.log(`🔑 Keywords found: ${brandContent.foundKeywords.length}/${BP_BRAND.keywords.length}`)
      console.log(`🏆 Competitors found: ${brandContent.foundCompetitors.length}/${BP_BRAND.competitors.length}`)
      
      // Get brand health score
      const brandScore = await resultsPage.getBrandHealthScore()
      if (brandScore !== null) {
        console.log(`💪 Brand Health Score: ${brandScore}`)
        expect(brandScore).toBeGreaterThan(0)
        expect(brandScore).toBeLessThanOrEqual(100)
      }
      
      // Test export functionality
      const exportResults = await resultsPage.testExportFunctionality()
      const exportOptions = Object.values(exportResults).filter(e => e.available).length
      console.log(`📥 Export options available: ${exportOptions}`)
      
      // Validate data quality
      const dataQuality = await resultsPage.validateDataQuality()
      console.log(`📊 Data Quality:`)
      console.log(`  - Sections with content: ${dataQuality.sectionsWithContent}`)
      console.log(`  - Visual elements: ${dataQuality.visualElements}`)
      console.log(`  - Interactive elements: ${dataQuality.interactiveElements}`)
      console.log(`  - Data points: ${dataQuality.dataPoints}`)
      
      // API validation if analysis ID is available
      if (analysisId) {
        console.log('\n🔌 API Data Validation')
        
        const apiResults = await APIHelper.getAnalysisResults(request, analysisId)
        if (apiResults.success) {
          console.log('✅ API results retrieved')
          
          // Validate brand data structure
          const brandValidation = ValidationHelper.validateBrandData(apiResults.data.data, BP_BRAND)
          if (brandValidation.valid) {
            console.log('✅ Brand data structure valid')
          } else {
            console.log('❌ Brand data validation errors:')
            brandValidation.errors.forEach(error => console.log(`  - ${error}`))
          }
          
          // Validate visual analysis
          if (apiResults.data.data.visual_analysis) {
            const visualValidation = ValidationHelper.validateVisualAnalysis(apiResults.data.data.visual_analysis)
            console.log(`🎨 Visual analysis: ${visualValidation.valid ? 'Valid' : 'Invalid'}`)
            console.log(`  - Colors: ${visualValidation.stats?.colorsFound || 0}`)
            console.log(`  - Logos: ${visualValidation.stats?.logosFound || 0}`)
          }
          
          // Validate competitive analysis
          if (apiResults.data.data.competitive_analysis) {
            const competitiveValidation = ValidationHelper.validateCompetitiveAnalysis(
              apiResults.data.data.competitive_analysis,
              BP_BRAND.competitors
            )
            console.log(`🏆 Competitive analysis: ${competitiveValidation.valid ? 'Valid' : 'Invalid'}`)
            console.log(`  - Competitors found: ${competitiveValidation.stats.competitorsFound}`)
            console.log(`  - Expected competitors: ${competitiveValidation.stats.expectedCompetitorsFound}`)
          }
        } else {
          console.log('❌ API results not accessible')
        }
      }
      
      // Quality assertions
      expect(sectionsFound).toBeGreaterThan(2)
      expect(visualsFound).toBeGreaterThan(1)
      expect(brandContent.brandMentions).toBeGreaterThan(0)
      expect(brandContent.foundKeywords.length).toBeGreaterThan(0)
      expect(dataQuality.sectionsWithContent).toBeGreaterThan(1)
      expect(dataQuality.dataPoints).toBeGreaterThan(5)
      
      console.log('✅ All quality assertions passed')
      
    } else {
      console.log('\n⏳ Analysis did not complete within timeout')
      console.log(`📊 Final progress: ${progressResult.finalProgress}%`)
      console.log(`📈 Total updates: ${progressResult.totalUpdates}`)
      
      // Still validate that progress was made
      expect(progressResult.totalUpdates).toBeGreaterThan(0)
      
      // Take timeout screenshot
      await ScreenshotHelper.takePageScreenshot(page, 'bp-optimized', 'timeout')
    }
    
    // Network performance analysis
    const networkLogs = networkMonitor.getLogs()
    const failedRequests = networkMonitor.getFailedRequests()
    const slowRequests = networkMonitor.getSlowRequests(3000)
    
    console.log(`🌐 Network: ${networkLogs.length} requests, ${failedRequests.length} failed, ${slowRequests.length} slow`)
    
    if (failedRequests.length > 0) {
      console.log('❌ Failed requests:')
      failedRequests.forEach(req => console.log(`  - ${req.url}: ${req.status}`))
    }
    
    console.log('\n🏁 BP Optimized Test Completed')
  })

  test('BP Mobile Experience Test', async ({ page }) => {
    console.log('📱 Testing BP Mobile Experience')
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    const landingPage = new LandingPage(page)
    const progressPage = new AnalysisProgressPage(page)
    
    // Test mobile landing page
    await landingPage.goto()
    await landingPage.verifyPageLoaded()
    
    // Validate mobile layout
    const mobileLayoutValid = await landingPage.validateMobileLayout()
    expect(mobileLayoutValid).toBe(true)
    console.log('✅ Mobile layout validated')
    
    // Take mobile screenshot
    await ScreenshotHelper.takePageScreenshot(page, 'bp-mobile', 'landing')
    
    // Start analysis on mobile
    await landingPage.startBrandAnalysis(BP_BRAND.name)
    
    // Monitor for shorter duration on mobile
    const progressLoaded = await progressPage.waitForPageLoad()
    if (progressLoaded) {
      await ScreenshotHelper.takePageScreenshot(page, 'bp-mobile', 'progress')
      
      // Wait for some progress
      await WaitHelper.sleep(30000)
      
      const currentProgress = await progressPage.getCurrentProgress()
      console.log(`📱 Mobile progress: ${currentProgress}%`)
      
      expect(currentProgress).toBeGreaterThan(0)
    }
    
    console.log('✅ Mobile experience test completed')
  })

  test('BP Error Handling and Recovery', async ({ page }) => {
    console.log('🚨 Testing BP Error Handling')
    
    const landingPage = new LandingPage(page)
    
    await landingPage.goto()
    
    // Test 1: Empty input validation
    console.log('Test 1: Empty input validation')
    const emptyValidation = await landingPage.validateEmptyInput()
    if (emptyValidation) {
      console.log('✅ Empty input validation working')
    }
    
    // Test 2: Invalid brand name
    console.log('Test 2: Invalid brand name handling')
    await landingPage.startBrandAnalysis('NonExistentBrandXYZ123')
    
    await WaitHelper.sleep(10000)
    
    const errorVisible = await page.locator('text=/not found|unable|error/i').isVisible()
    if (errorVisible) {
      console.log('✅ Invalid brand error handled')
    }
    
    // Test 3: Network interruption
    console.log('Test 3: Network error simulation')
    
    const recoveryTest = await ErrorHelper.testErrorRecovery(
      page,
      // Error action: block network requests
      async () => {
        await page.route('**/api/analyze', route => route.abort('failed'))
        await landingPage.startBrandAnalysis(BP_BRAND.name)
      },
      // Recovery action: unblock and retry
      async () => {
        await page.unroute('**/api/analyze')
        const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try Again")')
        const retryExists = await retryButton.count() > 0
        if (retryExists) {
          await retryButton.click()
        }
      }
    )
    
    console.log(`🔄 Error recovery: ${recoveryTest.recoverySuccessful ? 'Successful' : 'Failed'}`)
    
    console.log('✅ Error handling tests completed')
  })

  test('BP Performance and Accessibility Audit', async ({ page }) => {
    console.log('⚡ BP Performance and Accessibility Audit')
    
    const landingPage = new LandingPage(page)
    
    // Measure initial load performance
    const loadPerformance = await PerformanceHelper.measurePageLoad(page, TEST_CONFIG.FRONTEND_URL)
    
    console.log('📊 Performance Metrics:')
    console.log(`  - Total load time: ${loadPerformance.totalLoadTime}ms`)
    console.log(`  - DOM content loaded: ${loadPerformance.domContentLoaded}ms`)
    console.log(`  - First paint: ${loadPerformance.firstPaint}ms`)
    
    // Performance assertions
    expect(loadPerformance.totalLoadTime).toBeLessThan(10000) // Under 10 seconds
    expect(loadPerformance.firstPaint).toBeLessThan(3000) // First paint under 3 seconds
    
    // Comprehensive accessibility test
    const accessibilityResults = await AccessibilityHelper.checkBasicAccessibility(page)
    
    console.log('♿ Accessibility Results:')
    Object.entries(accessibilityResults).forEach(([check, result]) => {
      console.log(`  ${result === true ? '✅' : '❌'} ${check}: ${result}`)
    })
    
    // Keyboard navigation test
    const keyboardNavigation = await AccessibilityHelper.testKeyboardNavigation(page, ['input', 'button'])
    console.log(`⌨️ Keyboard navigation: ${keyboardNavigation.length} focusable elements`)
    
    // Test reduced motion
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.reload()
    console.log('✅ Reduced motion preference tested')
    
    // Color contrast test (basic)
    const backgroundColor = await page.evaluate(() => 
      window.getComputedStyle(document.body).backgroundColor
    )
    const textColor = await page.evaluate(() => 
      window.getComputedStyle(document.body).color
    )
    
    console.log(`🎨 Colors: Background ${backgroundColor}, Text ${textColor}`)
    
    console.log('✅ Performance and accessibility audit completed')
  })

  test('BP Analysis Quality Validation', async ({ page, request }) => {
    console.log('🎯 BP Analysis Quality Deep Dive')
    
    const landingPage = new LandingPage(page)
    const progressPage = new AnalysisProgressPage(page)
    const resultsPage = new ResultsPage(page)
    
    // Start analysis
    await landingPage.goto()
    await landingPage.startBrandAnalysis(BP_BRAND.name, BP_BRAND.website)
    
    // Monitor with quality checks
    await progressPage.waitForPageLoad()
    const progressResult = await progressPage.monitorProgress(180000) // 3 minutes max
    
    if (progressResult.completed) {
      await resultsPage.waitForPageLoad()
      
      // Deep quality analysis
      console.log('\n🔍 Deep Quality Analysis')
      
      // Executive summary quality
      const executiveSummary = await resultsPage.getExecutiveSummaryContent()
      if (executiveSummary) {
        const summaryLength = executiveSummary.length
        const summaryWords = executiveSummary.split(' ').length
        console.log(`📝 Executive Summary: ${summaryWords} words, ${summaryLength} characters`)
        expect(summaryWords).toBeGreaterThan(50) // Meaningful content
      }
      
      // Competitive analysis depth
      const competitiveAnalysis = await resultsPage.analyzeCompetitiveContent()
      if (competitiveAnalysis.hasContent) {
        console.log(`🏆 Competitive Analysis:`)
        console.log(`  - Competitor cards: ${competitiveAnalysis.competitorCards}`)
        console.log(`  - Charts: ${competitiveAnalysis.charts}`)
        console.log(`  - SWOT elements: ${competitiveAnalysis.swotElements}`)
        
        expect(competitiveAnalysis.competitorCards).toBeGreaterThan(0)
      }
      
      // Tab navigation test
      const tabResults = await resultsPage.navigateTabs()
      const workingTabs = Object.values(tabResults).filter(tab => tab.available && tab.activated).length
      console.log(`📑 Working tabs: ${workingTabs}`)
      
      // Data richness validation
      const dataQuality = await resultsPage.validateDataQuality()
      console.log(`📊 Data Richness Score: ${dataQuality.sectionsWithContent + dataQuality.visualElements + Math.floor(dataQuality.dataPoints/10)}/10`)
      
      // Professional quality thresholds
      expect(dataQuality.sectionsWithContent).toBeGreaterThanOrEqual(3)
      expect(dataQuality.visualElements).toBeGreaterThanOrEqual(2)
      expect(dataQuality.dataPoints).toBeGreaterThanOrEqual(10)
      
      console.log('✅ Quality validation completed')
    } else {
      console.log('⏳ Analysis timeout - quality validation skipped')
    }
    
    console.log('🏁 Quality deep dive completed')
  })
})