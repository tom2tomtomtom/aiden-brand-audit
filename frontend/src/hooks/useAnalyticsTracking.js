import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import userAnalytics from '@/services/userAnalytics'

/**
 * Hook for tracking user interactions and page views
 */
export const useAnalyticsTracking = () => {
  let location;
  try {
    location = useLocation()
  } catch (error) {
    // Router context not available, skip location tracking
    location = null
  }
  const previousPath = useRef('')

  // Track page views
  useEffect(() => {
    if (location && location.pathname !== previousPath.current) {
      userAnalytics.trackPageView(location.pathname, {
        search: location.search,
        hash: location.hash,
        previousPath: previousPath.current
      })
      previousPath.current = location.pathname
    }
  }, [location])

  // Track brand analysis workflow
  const trackBrandAnalysisStep = (step, brandName, data = {}) => {
    return userAnalytics.trackBrandAnalysis(step, brandName, {
      path: location?.pathname || window.location.pathname || '/',
      ...data
    })
  }

  // Track user interactions
  const trackInteraction = (component, action, data = {}) => {
    return userAnalytics.trackInteraction(component, action, {
      path: location?.pathname || window.location.pathname || '/',
      ...data
    })
  }

  // Track performance metrics
  const trackPerformance = (operation, startTime, success = true, data = {}) => {
    const duration = Date.now() - startTime
    return userAnalytics.trackPerformance(operation, duration, success, {
      path: location?.pathname || window.location.pathname || '/',
      ...data
    })
  }

  // Track feature usage
  const trackFeature = (feature, action, data = {}) => {
    return userAnalytics.trackFeatureUsage(feature, action, {
      path: location?.pathname || window.location.pathname || '/',
      ...data
    })
  }

  // Track conversions
  const trackConversion = (type, data = {}) => {
    return userAnalytics.trackConversion(type, {
      path: location?.pathname || window.location.pathname || '/',
      ...data
    })
  }

  return {
    trackBrandAnalysisStep,
    trackInteraction,
    trackPerformance,
    trackFeature,
    trackConversion
  }
}