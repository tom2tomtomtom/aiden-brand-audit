/**
 * Analysis Progress Page Object Model
 * Encapsulates all analysis progress page interactions and monitoring
 */
export class AnalysisProgressPage {
  constructor(page) {
    this.page = page
    
    // Progress elements
    this.progressTitle = page.locator('text=/Analysis in Progress|Processing|Analyzing/i')
    this.progressBar = page.locator('.progress-bar, .progress-indicator, [data-testid="progress-bar"]')
    this.progressPercentage = page.locator('.progress-percentage, [data-testid="progress-percentage"]')
    this.currentStep = page.locator('.current-step, [data-testid="current-step"]')
    
    // Status indicators
    this.statusMessage = page.locator('.status-message, [data-testid="status-message"]')
    this.completionIndicator = page.locator('text=/Analysis Complete|Strategic Intelligence|Results|Report Generated/i')
    this.errorIndicator = page.locator('text=/error|failed|timeout|unable/i')
    
    // Control elements
    this.cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stop")')
    this.pauseButton = page.locator('button:has-text("Pause")')
    
    // Progress tracking
    this.progressUpdates = []
    this.analysisSteps = []
    this.websocketMessages = []
  }

  /**
   * Wait for the progress page to load
   */
  async waitForPageLoad() {
    await this.progressTitle.waitFor({ timeout: 10000 })
    return await this.progressTitle.isVisible()
  }

  /**
   * Monitor analysis progress with WebSocket and polling
   * @param {number} maxWaitTime - Maximum time to wait in milliseconds
   * @param {Function} onProgress - Callback for progress updates
   */
  async monitorProgress(maxWaitTime = 300000, onProgress = null) {
    const startTime = Date.now()
    let currentProgress = 0
    
    // Set up WebSocket monitoring
    this.page.on('websocket', ws => {
      ws.on('framereceived', event => {
        try {
          const data = JSON.parse(event.payload)
          this.websocketMessages.push(data)
          
          if (data.overall_progress !== undefined) {
            this.progressUpdates.push(data)
            currentProgress = data.overall_progress
            
            if (onProgress) {
              onProgress(currentProgress, data.current_step_name)
            }
          }
          
          if (data.current_step_name) {
            this.analysisSteps.push(data.current_step_name)
          }
        } catch (e) {
          // Ignore non-JSON messages
        }
      })
    })
    
    // Monitor progress until completion or timeout
    let analysisComplete = false
    let attempts = 0
    const maxAttempts = Math.floor(maxWaitTime / 5000) // 5-second intervals
    
    while (!analysisComplete && attempts < maxAttempts) {
      try {
        // Check for completion
        const completionFound = await this.isAnalysisComplete()
        if (completionFound) {
          analysisComplete = true
          break
        }
        
        // Check for errors
        const errorFound = await this.hasError()
        if (errorFound) {
          throw new Error('Analysis failed with error')
        }
        
        // Wait and increment
        await this.page.waitForTimeout(5000)
        attempts++
        
        // Log progress periodically
        if (attempts % 6 === 0) { // Every 30 seconds
          const elapsed = Date.now() - startTime
          console.log(`⏳ Analysis progress: ${currentProgress}% (${Math.floor(elapsed/1000)}s elapsed)`)
        }
        
      } catch (error) {
        console.log(`⚠️ Error during progress monitoring: ${error.message}`)
        break
      }
    }
    
    return {
      completed: analysisComplete,
      finalProgress: currentProgress,
      totalUpdates: this.progressUpdates.length,
      steps: [...new Set(this.analysisSteps)],
      elapsedTime: Date.now() - startTime
    }
  }

  /**
   * Check if analysis is complete
   */
  async isAnalysisComplete() {
    const completionSelectors = [
      'text=/Analysis Complete|Strategic Intelligence|Results|Report Generated/i',
      '[data-testid="results-container"]',
      '.results-display',
      '.analysis-complete'
    ]
    
    for (const selector of completionSelectors) {
      const elementCount = await this.page.locator(selector).count()
      if (elementCount > 0) {
        return true
      }
    }
    
    return false
  }

  /**
   * Check if there's an error state
   */
  async hasError() {
    return await this.errorIndicator.isVisible()
  }

  /**
   * Get current progress percentage
   */
  async getCurrentProgress() {
    try {
      const progressText = await this.progressPercentage.textContent({ timeout: 1000 })
      const match = progressText.match(/(\d+)%/)
      return match ? parseInt(match[1]) : 0
    } catch {
      return 0
    }
  }

  /**
   * Get current analysis step
   */
  async getCurrentStep() {
    try {
      return await this.currentStep.textContent({ timeout: 1000 })
    } catch {
      return 'Unknown'
    }
  }

  /**
   * Cancel the analysis
   */
  async cancelAnalysis() {
    const cancelButtonExists = await this.cancelButton.count() > 0
    if (cancelButtonExists) {
      await this.cancelButton.click()
      return true
    }
    return false
  }

  /**
   * Take a screenshot of the progress page
   */
  async takeScreenshot(path) {
    await this.page.screenshot({ 
      path: path,
      fullPage: true 
    })
  }

  /**
   * Validate progress page elements are visible
   */
  async validatePageElements() {
    const elements = {
      title: await this.progressTitle.isVisible(),
      progressBar: await this.progressBar.isVisible(),
      statusMessage: await this.statusMessage.isVisible()
    }
    
    return elements
  }

  /**
   * Get analysis ID from page state or URL
   */
  async getAnalysisId() {
    return await this.page.evaluate(() => {
      return window.localStorage.getItem('currentAnalysisId') || 
             window.sessionStorage.getItem('analysisId') ||
             window.currentAnalysisId ||
             document.querySelector('[data-analysis-id]')?.getAttribute('data-analysis-id') ||
             new URLSearchParams(window.location.search).get('id')
    })
  }

  /**
   * Wait for analysis to reach a specific progress percentage
   */
  async waitForProgress(targetProgress, timeout = 60000) {
    const startTime = Date.now()
    
    while (Date.now() - startTime < timeout) {
      const currentProgress = await this.getCurrentProgress()
      if (currentProgress >= targetProgress) {
        return true
      }
      
      await this.page.waitForTimeout(2000)
    }
    
    return false
  }

  /**
   * Get progress statistics
   */
  getProgressStats() {
    return {
      totalUpdates: this.progressUpdates.length,
      uniqueSteps: [...new Set(this.analysisSteps)],
      websocketMessages: this.websocketMessages.length,
      finalProgress: this.progressUpdates.length > 0 ? 
        this.progressUpdates[this.progressUpdates.length - 1].overall_progress : 0
    }
  }
}