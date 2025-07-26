/**
 * Centralized Error Handling Utilities
 * Standardized error processing and user messaging
 */

import { toast } from 'sonner'

// Error categories for consistent handling
export const ERROR_CATEGORIES = {
  NETWORK: 'network_error',
  AUTHENTICATION: 'authentication_error',
  VALIDATION: 'validation_error',
  API: 'api_error',
  RATE_LIMIT: 'rate_limit_error',
  SYSTEM: 'system_error',
}

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical',
}

/**
 * Standardized error processing
 */
export const processError = (error, context = {}) => {
  const processedError = {
    id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    context,
    original: error,
  }

  // Categorize error
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    processedError.category = ERROR_CATEGORIES.NETWORK
    processedError.severity = ERROR_SEVERITY.MEDIUM
    processedError.message = 'Network connection failed. Please check your internet connection.'
    processedError.userActions = ['Check your internet connection', 'Try again in a moment']
    processedError.canRetry = true
  } else if (error.status === 401 || error.status === 403) {
    processedError.category = ERROR_CATEGORIES.AUTHENTICATION
    processedError.severity = ERROR_SEVERITY.HIGH
    processedError.message = 'Authentication failed. Please log in again.'
    processedError.userActions = ['Check your login credentials', 'Try logging out and back in']
    processedError.requiresUserAction = true
  } else if (error.status === 429) {
    processedError.category = ERROR_CATEGORIES.RATE_LIMIT
    processedError.severity = ERROR_SEVERITY.MEDIUM
    processedError.message = 'Too many requests. Please wait before trying again.'
    processedError.userActions = ['Wait a moment before retrying']
    processedError.retryAfter = error.retryAfter || 60
    processedError.canRetry = true
  } else if (error.status >= 400 && error.status < 500) {
    processedError.category = ERROR_CATEGORIES.VALIDATION
    processedError.severity = ERROR_SEVERITY.LOW
    processedError.message = error.message || 'Please check your input and try again.'
    processedError.userActions = ['Review your input', 'Correct any errors and try again']
    processedError.requiresUserAction = true
  } else if (error.status >= 500) {
    processedError.category = ERROR_CATEGORIES.API
    processedError.severity = ERROR_SEVERITY.MEDIUM
    processedError.message = 'Server is experiencing issues. Please try again.'
    processedError.userActions = ['Try again in a few moments', 'Contact support if the issue persists']
    processedError.canRetry = true
  } else if (error.message?.includes('timeout')) {
    processedError.category = ERROR_CATEGORIES.NETWORK
    processedError.severity = ERROR_SEVERITY.MEDIUM
    processedError.message = 'Request timed out. Please try again.'
    processedError.userActions = ['Try again', 'Check your internet connection']
    processedError.canRetry = true
  } else {
    processedError.category = ERROR_CATEGORIES.SYSTEM
    processedError.severity = ERROR_SEVERITY.MEDIUM
    processedError.message = error.message || 'An unexpected error occurred. Please try again.'
    processedError.userActions = ['Try again', 'Contact support if the issue persists']
    processedError.canRetry = true
  }

  return processedError
}

/**
 * Display error toast with consistent styling
 */
export const showErrorToast = (error, options = {}) => {
  const processedError = typeof error === 'string' ? { message: error } : processError(error)
  
  const toastOptions = {
    duration: getToastDuration(processedError.severity),
    ...options,
  }

  switch (processedError.category) {
    case ERROR_CATEGORIES.NETWORK:
      toast.error(processedError.message, {
        ...toastOptions,
        description: 'Network connectivity issue',
      })
      break
    case ERROR_CATEGORIES.AUTHENTICATION:
      toast.error(processedError.message, {
        ...toastOptions,
        description: 'Authentication required',
      })
      break
    case ERROR_CATEGORIES.RATE_LIMIT:
      toast.error(processedError.message, {
        ...toastOptions,
        description: processedError.retryAfter ? `Retry after ${processedError.retryAfter} seconds` : undefined,
      })
      break
    case ERROR_CATEGORIES.VALIDATION:
      toast.error(processedError.message, {
        ...toastOptions,
        description: 'Please check your input',
      })
      break
    case ERROR_CATEGORIES.API:
      toast.error(processedError.message, {
        ...toastOptions,
        description: 'Server error occurred',
      })
      break
    default:
      toast.error(processedError.message, toastOptions)
  }

  // Log error for development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error Details:', processedError)
  }

  return processedError
}

/**
 * Get toast duration based on severity
 */
const getToastDuration = (severity) => {
  switch (severity) {
    case ERROR_SEVERITY.CRITICAL:
      return 12000
    case ERROR_SEVERITY.HIGH:
      return 10000
    case ERROR_SEVERITY.MEDIUM:
      return 8000
    case ERROR_SEVERITY.LOW:
      return 6000
    default:
      return 8000
  }
}

/**
 * Error boundary helpers
 */
export const logError = (error, errorInfo) => {
  const errorDetails = {
    error: error.toString(),
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date().toISOString(),
    url: window.location.href,
    userAgent: navigator.userAgent,
  }

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.error('React Error Boundary:', errorDetails)
  }

  // In production, you might want to send this to an error reporting service
  // Example: Sentry, LogRocket, etc.
  
  return errorDetails
}

/**
 * Validation helpers
 */
export const createValidationError = (field, message, value = null) => {
  return new Error(JSON.stringify({
    type: 'validation',
    field,
    message,
    value,
    timestamp: new Date().toISOString(),
  }))
}

/**
 * API error wrapper
 */
export const handleApiError = async (apiCall, context = {}) => {
  try {
    const result = await apiCall()
    return { success: true, data: result }
  } catch (error) {
    const processedError = processError(error, context)
    return { success: false, error: processedError }
  }
}

/**
 * Form validation wrapper
 */
export const validateForm = (data, rules) => {
  const errors = {}
  
  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field]
    
    if (rule.required && (!value || value.toString().trim() === '')) {
      errors[field] = `${rule.label || field} is required`
    } else if (value && rule.minLength && value.toString().length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters`
    } else if (value && rule.maxLength && value.toString().length > rule.maxLength) {
      errors[field] = `${rule.label || field} must be less than ${rule.maxLength} characters`
    } else if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.patternMessage || `${rule.label || field} format is invalid`
    } else if (rule.custom && typeof rule.custom === 'function') {
      const customError = rule.custom(value, data)
      if (customError) {
        errors[field] = customError
      }
    }
  })
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

export default {
  ERROR_CATEGORIES,
  ERROR_SEVERITY,
  processError,
  showErrorToast,
  logError,
  createValidationError,
  handleApiError,
  validateForm,
}