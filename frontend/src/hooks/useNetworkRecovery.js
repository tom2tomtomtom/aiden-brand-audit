/**
 * Network Recovery Hook
 * 
 * Provides automatic network error recovery and offline/online detection
 * for improved user experience during network issues.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import apiService from '../services/api.js'

const useNetworkRecovery = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isRecovering, setIsRecovering] = useState(false)
  const [lastFailedRequest, setLastFailedRequest] = useState(null)
  const [connectionQuality, setConnectionQuality] = useState('good') // 'good', 'slow', 'poor'
  
  const recoveryTimeoutRef = useRef(null)
  const qualityCheckIntervalRef = useRef(null)
  const retryCountRef = useRef(0)
  
  // Network status change handlers
  const handleOnline = useCallback(() => {
    setIsOnline(true)
    setIsRecovering(true)
    retryCountRef.current = 0
    
    toast.success('Connection restored! Retrying failed requests...', {
      duration: 3000,
    })
    
    // Attempt to retry last failed request
    if (lastFailedRequest) {
      retryFailedRequest()
    }
    
    // Stop recovery after successful connection
    setTimeout(() => {
      setIsRecovering(false)
    }, 2000)
  }, [lastFailedRequest])
  
  const handleOffline = useCallback(() => {
    setIsOnline(false)
    
    toast.error('Connection lost. Some features may not work properly.', {
      duration: 5000,
      action: {
        label: 'Retry',
        onClick: () => checkConnection()
      }
    })
  }, [])
  
  // Connection quality monitoring
  const checkConnectionQuality = useCallback(async () => {
    if (!isOnline) return
    
    const startTime = Date.now()
    
    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache'
      })
      
      const duration = Date.now() - startTime
      
      if (duration < 500) {
        setConnectionQuality('good')
      } else if (duration < 2000) {
        setConnectionQuality('slow')
      } else {
        setConnectionQuality('poor')
      }
      
    } catch (error) {
      setConnectionQuality('poor')
    }
  }, [isOnline])
  
  // Manual connection check
  const checkConnection = useCallback(async () => {
    try {
      const response = await apiService.healthCheck()
      
      if (response.status === 'healthy' || response.status === 'degraded') {
        if (!isOnline) {
          handleOnline()
        }
        return true
      }
    } catch (error) {
      console.warn('Connection check failed:', error)
      if (isOnline) {
        handleOffline()
      }
    }
    
    return false
  }, [isOnline, handleOnline, handleOffline])
  
  // Retry failed request
  const retryFailedRequest = useCallback(async () => {
    if (!lastFailedRequest || retryCountRef.current >= 3) {
      setLastFailedRequest(null)
      return
    }
    
    try {
      retryCountRef.current++
      
      const { endpoint, options } = lastFailedRequest
      const result = await apiService.request(endpoint, {
        ...options,
        showToast: false // Prevent duplicate toasts during retry
      })
      
      toast.success('Request completed successfully!')
      setLastFailedRequest(null)
      retryCountRef.current = 0
      
      return result
      
    } catch (error) {
      if (retryCountRef.current >= 3) {
        toast.error('Unable to complete request. Please try again manually.')
        setLastFailedRequest(null)
        retryCountRef.current = 0
      } else {
        // Schedule another retry
        recoveryTimeoutRef.current = setTimeout(() => {
          retryFailedRequest()
        }, Math.pow(2, retryCountRef.current) * 1000) // Exponential backoff
      }
    }
  }, [lastFailedRequest])
  
  // Store failed request for retry
  const storeFailedRequest = useCallback((endpoint, options) => {
    setLastFailedRequest({ endpoint, options, timestamp: Date.now() })
  }, [])
  
  // Smart retry with network awareness
  const smartRetry = useCallback(async (retryFunction, maxRetries = 3) => {
    let attempts = 0
    
    while (attempts < maxRetries) {
      try {
        // Wait for network to be available
        if (!isOnline) {
          await new Promise((resolve) => {
            const checkOnline = () => {
              if (navigator.onLine) {
                resolve()
              } else {
                setTimeout(checkOnline, 1000)
              }
            }
            checkOnline()
          })
        }
        
        const result = await retryFunction()
        return result
        
      } catch (error) {
        attempts++
        
        if (attempts >= maxRetries) {
          throw error
        }
        
        // Wait before retry with exponential backoff
        const delay = Math.min(Math.pow(2, attempts) * 1000, 10000)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }, [isOnline])
  
  // Enhanced fetch with network recovery
  const fetchWithRecovery = useCallback(async (endpoint, options = {}) => {
    try {
      return await apiService.request(endpoint, options)
    } catch (error) {
      // Store for potential retry if it's a network error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        storeFailedRequest(endpoint, options)
      }
      
      throw error
    }
  }, [storeFailedRequest])
  
  // Setup event listeners and intervals
  useEffect(() => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Check connection quality periodically
    qualityCheckIntervalRef.current = setInterval(checkConnectionQuality, 30000)
    
    // Initial quality check
    checkConnectionQuality()
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
      
      if (qualityCheckIntervalRef.current) {
        clearInterval(qualityCheckIntervalRef.current)
      }
    }
  }, [handleOnline, handleOffline, checkConnectionQuality])
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recoveryTimeoutRef.current) {
        clearTimeout(recoveryTimeoutRef.current)
      }
    }
  }, [])
  
  return {
    isOnline,
    isRecovering,
    connectionQuality,
    lastFailedRequest: lastFailedRequest !== null,
    checkConnection,
    retryFailedRequest,
    smartRetry,
    fetchWithRecovery,
    storeFailedRequest
  }
}

export default useNetworkRecovery