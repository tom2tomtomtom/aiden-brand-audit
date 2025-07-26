import React, { createContext, useContext, useReducer, useCallback } from 'react'

// Error Context for managing error state across the application
const ErrorContext = createContext()

// Action types for error management
const ERROR_TYPES = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  UPDATE_ERROR: 'UPDATE_ERROR',
  SET_CORRELATION_ID: 'SET_CORRELATION_ID',
  INCREMENT_RETRY: 'INCREMENT_RETRY'
}

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Error categories
export const ERROR_CATEGORY = {
  API_ERROR: 'api_error',
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  TIMEOUT_ERROR: 'timeout_error',
  DATA_ERROR: 'data_error',
  SYSTEM_ERROR: 'system_error',
  USER_ERROR: 'user_error',
  EXTERNAL_SERVICE_ERROR: 'external_service_error'
}

// Recovery strategies
export const RECOVERY_STRATEGY = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  DEGRADE: 'degrade',
  FAIL: 'fail',
  USER_ACTION: 'user_action'
}

// Initial state
const initialState = {
  errors: [],
  correlationId: null,
  globalErrorCount: 0,
  lastError: null
}

// Error reducer
const errorReducer = (state, action) => {
  switch (action.type) {
    case ERROR_TYPES.ADD_ERROR:
      return {
        ...state,
        errors: [...state.errors, action.payload],
        globalErrorCount: state.globalErrorCount + 1,
        lastError: action.payload
      }
    
    case ERROR_TYPES.REMOVE_ERROR:
      return {
        ...state,
        errors: state.errors.filter(error => error.id !== action.payload)
      }
    
    case ERROR_TYPES.CLEAR_ERRORS:
      return {
        ...state,
        errors: []
      }
    
    case ERROR_TYPES.UPDATE_ERROR:
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload.id
            ? { ...error, ...action.payload.updates }
            : error
        )
      }
    
    case ERROR_TYPES.SET_CORRELATION_ID:
      return {
        ...state,
        correlationId: action.payload
      }
    
    case ERROR_TYPES.INCREMENT_RETRY:
      return {
        ...state,
        errors: state.errors.map(error =>
          error.id === action.payload
            ? { 
                ...error, 
                retryCount: (error.retryCount || 0) + 1,
                lastRetryAt: new Date().toISOString()
              }
            : error
        )
      }
    
    default:
      return state
  }
}

// Generate unique error ID
const generateErrorId = () => {
  return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generate correlation ID
const generateCorrelationId = () => {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Error Context Provider
export const ErrorProvider = ({ children }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState)

  // Add error to context
  const addError = useCallback((errorData) => {
    const error = {
      id: generateErrorId(),
      timestamp: new Date().toISOString(),
      correlationId: state.correlationId || generateCorrelationId(),
      retryCount: 0,
      maxRetries: 3,
      canRetry: true,
      resolved: false,
      ...errorData
    }

    dispatch({
      type: ERROR_TYPES.ADD_ERROR,
      payload: error
    })

    // Send error to backend
    logErrorToBackend(error)

    return error.id
  }, [state.correlationId])

  // Remove error from context
  const removeError = useCallback((errorId) => {
    dispatch({
      type: ERROR_TYPES.REMOVE_ERROR,
      payload: errorId
    })
  }, [])

  // Clear all errors
  const clearErrors = useCallback(() => {
    dispatch({
      type: ERROR_TYPES.CLEAR_ERRORS
    })
  }, [])

  // Update error
  const updateError = useCallback((errorId, updates) => {
    dispatch({
      type: ERROR_TYPES.UPDATE_ERROR,
      payload: { id: errorId, updates }
    })
  }, [])

  // Set correlation ID
  const setCorrelationId = useCallback((correlationId) => {
    dispatch({
      type: ERROR_TYPES.SET_CORRELATION_ID,
      payload: correlationId
    })
  }, [])

  // Retry error
  const retryError = useCallback((errorId) => {
    dispatch({
      type: ERROR_TYPES.INCREMENT_RETRY,
      payload: errorId
    })
  }, [])

  // Handle API errors with automatic categorization
  const handleApiError = useCallback((error, context = {}) => {
    let category = ERROR_CATEGORY.API_ERROR
    let severity = ERROR_SEVERITY.MEDIUM
    let recoveryStrategy = RECOVERY_STRATEGY.RETRY
    let userMessage = 'An error occurred. Please try again.'

    // Categorize based on status code
    if (error.response) {
      const status = error.response.status
      if (status === 401 || status === 403) {
        category = ERROR_CATEGORY.AUTHENTICATION_ERROR
        severity = ERROR_SEVERITY.HIGH
        recoveryStrategy = RECOVERY_STRATEGY.USER_ACTION
        userMessage = 'Authentication failed. Please log in again.'
      } else if (status === 429) {
        category = ERROR_CATEGORY.RATE_LIMIT_ERROR
        severity = ERROR_SEVERITY.MEDIUM
        recoveryStrategy = RECOVERY_STRATEGY.RETRY
        userMessage = 'Too many requests. Please wait a moment and try again.'
      } else if (status >= 500) {
        category = ERROR_CATEGORY.SYSTEM_ERROR
        severity = ERROR_SEVERITY.HIGH
        recoveryStrategy = RECOVERY_STRATEGY.FALLBACK
        userMessage = 'Server error. We\'re working on it.'
      } else if (status === 408) {
        category = ERROR_CATEGORY.TIMEOUT_ERROR
        severity = ERROR_SEVERITY.MEDIUM
        recoveryStrategy = RECOVERY_STRATEGY.RETRY
        userMessage = 'Request timed out. Please try again.'
      }
    } else if (error.code === 'NETWORK_ERROR') {
      category = ERROR_CATEGORY.NETWORK_ERROR
      severity = ERROR_SEVERITY.HIGH
      recoveryStrategy = RECOVERY_STRATEGY.RETRY
      userMessage = 'Network error. Please check your connection.'
    }

    return addError({
      category,
      severity,
      recoveryStrategy,
      errorMessage: error.message || 'Unknown error',
      technicalMessage: error.stack || error.toString(),
      userMessage,
      errorType: error.name || 'Error',
      apiName: context.apiName,
      operation: context.operation,
      requestData: context.requestData,
      responseData: error.response?.data,
      additionalContext: {
        ...context,
        url: error.config?.url,
        method: error.config?.method,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    })
  }, [addError])

  // Handle validation errors
  const handleValidationError = useCallback((validationErrors, context = {}) => {
    const errorMessage = Object.values(validationErrors).flat().join(', ')
    
    return addError({
      category: ERROR_CATEGORY.VALIDATION_ERROR,
      severity: ERROR_SEVERITY.LOW,
      recoveryStrategy: RECOVERY_STRATEGY.USER_ACTION,
      errorMessage,
      userMessage: 'Please check your input and try again.',
      errorType: 'ValidationError',
      additionalContext: {
        ...context,
        validationErrors,
        timestamp: new Date().toISOString()
      }
    })
  }, [addError])

  // Handle component errors
  const handleComponentError = useCallback((error, errorInfo, context = {}) => {
    return addError({
      category: ERROR_CATEGORY.SYSTEM_ERROR,
      severity: ERROR_SEVERITY.CRITICAL,
      recoveryStrategy: RECOVERY_STRATEGY.FAIL,
      errorMessage: error.message,
      technicalMessage: error.stack,
      userMessage: 'A component error occurred. Please refresh the page.',
      errorType: error.name || 'ComponentError',
      additionalContext: {
        ...context,
        componentStack: errorInfo.componentStack,
        errorBoundary: true,
        timestamp: new Date().toISOString()
      }
    })
  }, [addError])

  // Get errors by category
  const getErrorsByCategory = useCallback((category) => {
    return state.errors.filter(error => error.category === category)
  }, [state.errors])

  // Get errors by severity
  const getErrorsBySeverity = useCallback((severity) => {
    return state.errors.filter(error => error.severity === severity)
  }, [state.errors])

  // Get unresolved errors
  const getUnresolvedErrors = useCallback(() => {
    return state.errors.filter(error => !error.resolved)
  }, [state.errors])

  // Mark error as resolved
  const resolveError = useCallback((errorId) => {
    updateError(errorId, {
      resolved: true,
      resolvedAt: new Date().toISOString()
    })
  }, [updateError])

  // Context value
  const value = {
    // State
    errors: state.errors,
    correlationId: state.correlationId,
    globalErrorCount: state.globalErrorCount,
    lastError: state.lastError,
    
    // Actions
    addError,
    removeError,
    clearErrors,
    updateError,
    setCorrelationId,
    retryError,
    resolveError,
    
    // Specialized handlers
    handleApiError,
    handleValidationError,
    handleComponentError,
    
    // Getters
    getErrorsByCategory,
    getErrorsBySeverity,
    getUnresolvedErrors,
    
    // Constants
    ERROR_SEVERITY,
    ERROR_CATEGORY,
    RECOVERY_STRATEGY
  }

  return (
    <ErrorContext.Provider value={value}>
      {children}
    </ErrorContext.Provider>
  )
}

// Hook to use error context
export const useError = () => {
  const context = useContext(ErrorContext)
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider')
  }
  return context
}

// Log error to backend
const logErrorToBackend = async (error) => {
  try {
    const response = await fetch('/api/errors/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-ID': error.correlationId
      },
      body: JSON.stringify({
        error_id: error.id,
        correlation_id: error.correlationId,
        category: error.category,
        severity: error.severity,
        recovery_strategy: error.recoveryStrategy,
        error_message: error.errorMessage,
        technical_message: error.technicalMessage,
        user_message: error.userMessage,
        error_type: error.errorType,
        user_id: error.userId,
        analysis_id: error.analysisId,
        operation: error.operation,
        api_name: error.apiName,
        request_path: window.location.pathname,
        request_method: error.additionalContext?.method?.toUpperCase(),
        user_agent: navigator.userAgent,
        ip_address: null, // Will be set by backend
        request_data: error.requestData,
        response_data: error.responseData,
        additional_context: error.additionalContext,
        retry_count: error.retryCount,
        max_retries: error.maxRetries,
        can_retry: error.canRetry,
        fallback_used: error.fallbackUsed || false
      })
    })

    if (!response.ok) {
      console.warn('Failed to log error to backend:', response.status)
    }
  } catch (backendError) {
    console.warn('Failed to log error to backend:', backendError)
  }
}

export default ErrorContext