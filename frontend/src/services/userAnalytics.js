/**
 * User Analytics Service for Brand Audit App
 * Tracks user behavior, performance, and provides feedback mechanisms
 */

class UserAnalyticsService {
  constructor() {
    this.sessionId = this.generateSessionId()
    this.userId = null
    this.events = []
    this.startTime = Date.now()
    this.apiEndpoint = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000'
    
    // Initialize session tracking
    this.initializeSession()
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  initializeSession() {
    this.trackEvent('session_started', {
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    })
  }

  /**
   * Track user events for analytics
   */
  trackEvent(eventName, data = {}) {
    const event = {
      eventId: `event_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      sessionId: this.sessionId,
      userId: this.userId,
      eventName,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      data
    }

    this.events.push(event)

    // Send to backend (non-blocking)
    this.sendEventToBackend(event).catch(error => {
      console.warn('Failed to send analytics event:', error)
    })

    return event.eventId
  }

  /**
   * Track brand analysis workflow progress
   */
  trackBrandAnalysis(stage, brandName, data = {}) {
    return this.trackEvent('brand_analysis', {
      stage,
      brandName,
      ...data
    })
  }

  /**
   * Track user interaction with UI components
   */
  trackInteraction(component, action, data = {}) {
    return this.trackEvent('user_interaction', {
      component,
      action,
      ...data
    })
  }

  /**
   * Track performance metrics
   */
  trackPerformance(operation, duration, success = true, data = {}) {
    return this.trackEvent('performance', {
      operation,
      duration,
      success,
      ...data
    })
  }

  /**
   * Track errors with context
   */
  trackError(error, context = {}, severity = 'error') {
    const errorData = {
      message: error.message,
      stack: error.stack,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Store locally for debugging
    this.trackEvent('error_occurred', errorData)

    // Send to monitoring endpoint
    this.reportError(errorData)

    return errorData.errorId
  }

  /**
   * Track user feedback and satisfaction
   */
  trackFeedback(type, rating, comment, data = {}) {
    return this.trackEvent('user_feedback', {
      type,
      rating,
      comment,
      ...data
    })
  }

  /**
   * Track feature usage patterns
   */
  trackFeatureUsage(feature, action, data = {}) {
    return this.trackEvent('feature_usage', {
      feature,
      action,
      ...data
    })
  }

  /**
   * Track page views and navigation
   */
  trackPageView(page, data = {}) {
    return this.trackEvent('page_view', {
      page,
      referrer: document.referrer,
      ...data
    })
  }

  /**
   * Track conversion events (successful analysis completion)
   */
  trackConversion(type, data = {}) {
    const conversionEvent = this.trackEvent('conversion', {
      type,
      sessionDuration: Date.now() - this.startTime,
      ...data
    })

    // Send immediately for conversion tracking
    this.flush()

    return conversionEvent
  }

  /**
   * Set user identifier
   */
  setUserId(userId) {
    this.userId = userId
    this.trackEvent('user_identified', { userId })
  }

  /**
   * Send event to backend
   */
  async sendEventToBackend(event) {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/analytics/event`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event)
      })
    } catch (error) {
      // Store for retry if network fails
      this.storeEventForRetry(event)
      throw error
    }
  }

  /**
   * Report error to monitoring endpoint
   */
  async reportError(errorData) {
    try {
      await fetch(`${this.apiEndpoint}/api/monitoring/errors/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(errorData)
      })
    } catch (error) {
      console.error('Failed to report error to monitoring:', error)
    }
  }

  /**
   * Store event for retry on network recovery
   */
  storeEventForRetry(event) {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_retry') || '[]')
      storedEvents.push(event)
      
      // Keep only last 50 events
      if (storedEvents.length > 50) {
        storedEvents.splice(0, storedEvents.length - 50)
      }
      
      localStorage.setItem('analytics_retry', JSON.stringify(storedEvents))
    } catch (error) {
      console.warn('Failed to store analytics event for retry:', error)
    }
  }

  /**
   * Retry failed events
   */
  async retryFailedEvents() {
    try {
      const storedEvents = JSON.parse(localStorage.getItem('analytics_retry') || '[]')
      
      for (const event of storedEvents) {
        await this.sendEventToBackend(event)
      }
      
      localStorage.removeItem('analytics_retry')
    } catch (error) {
      console.warn('Failed to retry analytics events:', error)
    }
  }

  /**
   * Flush all pending events
   */
  async flush() {
    const pendingEvents = [...this.events]
    this.events = []

    for (const event of pendingEvents) {
      try {
        await this.sendEventToBackend(event)
      } catch (error) {
        this.storeEventForRetry(event)
      }
    }

    // Also retry any failed events
    await this.retryFailedEvents()
  }

  /**
   * Get session analytics summary
   */
  getSessionSummary() {
    const duration = Date.now() - this.startTime
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.eventName] = (acc[event.eventName] || 0) + 1
      return acc
    }, {})

    return {
      sessionId: this.sessionId,
      userId: this.userId,
      duration,
      eventCount: this.events.length,
      eventTypes: eventCounts,
      startTime: new Date(this.startTime).toISOString()
    }
  }

  /**
   * Clean up on page unload
   */
  cleanup() {
    // Track session end
    this.trackEvent('session_ended', {
      duration: Date.now() - this.startTime,
      eventCount: this.events.length
    })

    // Flush any remaining events
    this.flush()
  }
}

// Create singleton instance
const userAnalytics = new UserAnalyticsService()

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  userAnalytics.cleanup()
})

// Auto-retry failed events on network recovery
window.addEventListener('online', () => {
  userAnalytics.retryFailedEvents()
})

export default userAnalytics