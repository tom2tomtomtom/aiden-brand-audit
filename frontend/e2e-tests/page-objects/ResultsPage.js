/**
 * Results Page Object Model
 * Encapsulates all results page interactions and validation
 */
export class ResultsPage {
  constructor(page) {
    this.page = page
    
    // Main result sections
    this.executiveSummary = page.locator('text=Executive Summary, [data-testid="executive-summary"]')
    this.strategicContext = page.locator('text=Strategic Context, [data-testid="strategic-context"]')
    this.visualAnalysis = page.locator('text=Visual Analysis, [data-testid="visual-analysis"]')
    this.competitiveAnalysis = page.locator('text=Competitive Analysis, [data-testid="competitive-analysis"]')
    this.brandHealth = page.locator('text=Brand Health, [data-testid="brand-health"]')
    this.recommendations = page.locator('text=Recommendations, [data-testid="recommendations"]')
    
    // Visual elements
    this.colorPalette = page.locator('[data-testid="color-palette"]')
    this.metricsDashboard = page.locator('[data-testid="metrics-dashboard"]')
    this.charts = page.locator('.chart-container, canvas, svg')
    this.brandScore = page.locator('[data-testid="brand-score"]')
    this.logoDisplay = page.locator('img[src*="logo"], .logo-display')
    
    // Interactive elements
    this.exportButton = page.locator('button:has-text("Export"), button:has-text("Download"), [data-testid="export-button"]')
    this.pdfButton = page.locator('button:has-text("PDF")')
    this.shareButton = page.locator('button:has-text("Share")')
    this.printButton = page.locator('button:has-text("Print")')
    
    // Navigation
    this.backToSearchButton = page.locator('button:has-text("New Analysis"), button:has-text("Back to Search")')
    this.historyButton = page.locator('button:has-text("History"), button:has-text("Previous Analyses")')
    
    // Tabs/sections navigation
    this.overviewTab = page.locator('[role="tab"]:has-text("Overview")')
    this.detailsTab = page.locator('[role="tab"]:has-text("Details")')
    this.visualsTab = page.locator('[role="tab"]:has-text("Visuals")')
    this.competitorsTab = page.locator('[role="tab"]:has-text("Competitors")')
  }

  /**
   * Wait for results page to load
   */
  async waitForPageLoad() {
    // Wait for at least one main section to be visible
    const mainSections = [
      this.executiveSummary,
      this.strategicContext,
      this.visualAnalysis,
      this.competitiveAnalysis
    ]
    
    const promises = mainSections.map(section => 
      section.waitFor({ timeout: 30000 }).catch(() => null)
    )
    
    await Promise.race(promises)
    
    // Ensure page is stable
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Validate all required sections are present
   */
  async validateRequiredSections() {
    const sections = {
      'Executive Summary': this.executiveSummary,
      'Strategic Context': this.strategicContext,
      'Visual Analysis': this.visualAnalysis,
      'Competitive Analysis': this.competitiveAnalysis,
      'Brand Health': this.brandHealth,
      'Recommendations': this.recommendations
    }
    
    const results = {}
    
    for (const [name, locator] of Object.entries(sections)) {
      try {
        results[name] = await locator.isVisible({ timeout: 3000 })
      } catch {
        results[name] = false
      }
    }
    
    return results
  }

  /**
   * Validate visual elements are present
   */
  async validateVisualElements() {
    const elements = {
      'Color Palette': this.colorPalette,
      'Metrics Dashboard': this.metricsDashboard,
      'Charts': this.charts,
      'Brand Score': this.brandScore,
      'Logo Display': this.logoDisplay
    }
    
    const results = {}
    
    for (const [name, locator] of Object.entries(elements)) {
      const count = await locator.count()
      results[name] = {
        present: count > 0,
        count: count
      }
    }
    
    return results
  }

  /**
   * Validate brand-specific content
   * @param {string} brandName - Expected brand name
   * @param {Array} expectedKeywords - Industry keywords to look for
   * @param {Array} expectedCompetitors - Competitor names to look for
   */
  async validateBrandContent(brandName, expectedKeywords = [], expectedCompetitors = []) {
    const results = {
      brandMentions: 0,
      foundKeywords: [],
      foundCompetitors: []
    }
    
    // Check brand name mentions
    results.brandMentions = await this.page.locator(`text=${brandName}`).count()
    
    // Check for industry keywords
    for (const keyword of expectedKeywords) {
      const count = await this.page.locator(`text=/${keyword}/i`).count()
      if (count > 0) {
        results.foundKeywords.push({
          keyword,
          mentions: count
        })
      }
    }
    
    // Check for competitor mentions
    for (const competitor of expectedCompetitors) {
      const count = await this.page.locator(`text=${competitor}`).count()
      if (count > 0) {
        results.foundCompetitors.push({
          competitor,
          mentions: count
        })
      }
    }
    
    return results
  }

  /**
   * Get brand health score if available
   */
  async getBrandHealthScore() {
    try {
      const scoreText = await this.brandScore.textContent({ timeout: 5000 })
      const match = scoreText.match(/(\d+(?:\.\d+)?)/g)
      return match ? parseFloat(match[0]) : null
    } catch {
      return null
    }
  }

  /**
   * Test export functionality
   */
  async testExportFunctionality() {
    const exportOptions = {
      general: this.exportButton,
      pdf: this.pdfButton,
      share: this.shareButton,
      print: this.printButton
    }
    
    const results = {}
    
    for (const [type, button] of Object.entries(exportOptions)) {
      const exists = await button.count() > 0
      results[type] = {
        available: exists,
        clickable: exists ? await button.isEnabled() : false
      }
    }
    
    return results
  }

  /**
   * Navigate through different result tabs/sections
   */
  async navigateTabs() {
    const tabs = {
      overview: this.overviewTab,
      details: this.detailsTab,
      visuals: this.visualsTab,
      competitors: this.competitorsTab
    }
    
    const results = {}
    
    for (const [name, tab] of Object.entries(tabs)) {
      const exists = await tab.count() > 0
      if (exists) {
        await tab.click()
        await this.page.waitForTimeout(1000)
        results[name] = {
          available: true,
          activated: await tab.getAttribute('aria-selected') === 'true' ||
                    await tab.getAttribute('data-state') === 'active'
        }
      } else {
        results[name] = { available: false }
      }
    }
    
    return results
  }

  /**
   * Extract executive summary content
   */
  async getExecutiveSummaryContent() {
    try {
      const summarySection = this.page.locator('[data-testid="executive-summary"], .executive-summary')
      if (await summarySection.count() === 0) {
        // Fallback to finding content after "Executive Summary" heading
        const heading = this.page.locator('text=Executive Summary')
        if (await heading.count() > 0) {
          const parent = heading.locator('..')
          return await parent.textContent()
        }
        return null
      }
      
      return await summarySection.textContent()
    } catch {
      return null
    }
  }

  /**
   * Count and analyze competitive analysis content
   */
  async analyzeCompetitiveContent() {
    try {
      const competitiveSection = this.page.locator('[data-testid="competitive-analysis"], .competitive-analysis')
      
      if (await competitiveSection.count() === 0) {
        // Fallback approach
        const heading = this.page.locator('text=Competitive Analysis')
        if (await heading.count() === 0) {
          return { hasContent: false }
        }
      }
      
      // Count competitive elements
      const competitorCards = await this.page.locator('.competitor-card, [data-testid*="competitor"]').count()
      const competitiveCharts = await this.page.locator('.competitive-chart, .positioning-matrix').count()
      const strengthsWeaknesses = await this.page.locator('text=/strengths|weaknesses|opportunities|threats/i').count()
      
      return {
        hasContent: true,
        competitorCards,
        charts: competitiveCharts,
        swotElements: strengthsWeaknesses
      }
    } catch {
      return { hasContent: false }
    }
  }

  /**
   * Take a screenshot of the results page
   */
  async takeScreenshot(path) {
    await this.page.screenshot({ 
      path: path,
      fullPage: true 
    })
  }

  /**
   * Validate data quality and completeness
   */
  async validateDataQuality() {
    const quality = {
      sectionsWithContent: 0,
      visualElements: 0,
      interactiveElements: 0,
      dataPoints: 0
    }
    
    // Check sections have actual content (not just headers)
    const sections = [
      this.executiveSummary,
      this.strategicContext,
      this.visualAnalysis,
      this.competitiveAnalysis
    ]
    
    for (const section of sections) {
      try {
        const content = await section.textContent({ timeout: 2000 })
        if (content && content.trim().length > 50) { // Meaningful content
          quality.sectionsWithContent++
        }
      } catch {
        // Section not found or empty
      }
    }
    
    // Count visual elements
    quality.visualElements = await this.charts.count() + 
                            await this.colorPalette.count() +
                            await this.logoDisplay.count()
    
    // Count interactive elements  
    quality.interactiveElements = await this.exportButton.count() +
                                await this.shareButton.count() +
                                await this.overviewTab.count()
    
    // Count data points (numbers, percentages, etc.)
    const dataPointRegex = /\d+(?:\.\d+)?%|\$[\d,]+|\d+(?:,\d{3})*(?:\.\d+)?/g
    const pageText = await this.page.textContent()
    const dataPoints = pageText.match(dataPointRegex)
    quality.dataPoints = dataPoints ? dataPoints.length : 0
    
    return quality
  }

  /**
   * Start a new analysis from results page
   */
  async startNewAnalysis() {
    const newAnalysisExists = await this.backToSearchButton.count() > 0
    if (newAnalysisExists) {
      await this.backToSearchButton.click()
      await this.page.waitForLoadState('networkidle')
      return true
    }
    return false
  }
}