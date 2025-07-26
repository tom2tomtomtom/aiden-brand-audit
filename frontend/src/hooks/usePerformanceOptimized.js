/**
 * Performance optimization hook
 * Provides memoization and performance utilities
 */

import { useMemo, useCallback, useRef, useEffect } from 'react'

export const usePerformanceOptimized = () => {
  const performanceRef = useRef({
    renderCount: 0,
    lastRenderTime: performance.now(),
  })

  useEffect(() => {
    performanceRef.current.renderCount++
    performanceRef.current.lastRenderTime = performance.now()
  })

  // Memoized data processing
  const memoizeData = useCallback((data, processor) => {
    return useMemo(() => {
      if (!data || !processor) return null
      const startTime = performance.now()
      const result = processor(data)
      const endTime = performance.now()
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`Data processing took ${endTime - startTime} milliseconds`)
      }
      
      return result
    }, [data, processor])
  }, [])

  // Debounced callback for expensive operations
  const useDebouncedCallback = useCallback((callback, delay = 300) => {
    const timeoutRef = useRef(null)
    
    return useCallback((...args) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      
      timeoutRef.current = setTimeout(() => {
        callback(...args)
      }, delay)
    }, [callback, delay])
  }, [])

  // Throttled callback for high-frequency events
  const useThrottledCallback = useCallback((callback, limit = 100) => {
    const inThrottle = useRef(false)
    
    return useCallback((...args) => {
      if (!inThrottle.current) {
        callback(...args)
        inThrottle.current = true
        setTimeout(() => {
          inThrottle.current = false
        }, limit)
      }
    }, [callback, limit])
  }, [])

  // Performance metrics
  const getPerformanceMetrics = useCallback(() => {
    return {
      renderCount: performanceRef.current.renderCount,
      lastRenderTime: performanceRef.current.lastRenderTime,
      memoryUsage: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576 * 100) / 100,
        total: Math.round(performance.memory.totalJSHeapSize / 1048576 * 100) / 100,
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576 * 100) / 100,
      } : null,
    }
  }, [])

  return {
    memoizeData,
    useDebouncedCallback,
    useThrottledCallback,
    getPerformanceMetrics,
  }
}

export default usePerformanceOptimized