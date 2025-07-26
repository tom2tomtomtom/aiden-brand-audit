/**
 * API Type Definitions and Validators
 * Centralized type definitions for API responses
 */

// Analysis request types
export const ANALYSIS_OPTIONS = {
  BRAND_PERCEPTION: 'brandPerception',
  COMPETITIVE_ANALYSIS: 'competitiveAnalysis',
  VISUAL_ANALYSIS: 'visualAnalysis',
  PRESS_COVERAGE: 'pressCoverage',
  SOCIAL_SENTIMENT: 'socialSentiment',
}

// Analysis status types
export const ANALYSIS_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

// API response validators
export const validateApiResponse = (response, expectedShape) => {
  if (!response) {
    throw new Error('API response is null or undefined')
  }

  if (typeof response !== 'object') {
    throw new Error('API response is not an object')
  }

  // Check required fields
  if (expectedShape.requiresSuccess && !response.hasOwnProperty('success')) {
    throw new Error('API response missing success field')
  }

  if (expectedShape.requiresData && response.success && !response.data) {
    throw new Error('API response missing data field')
  }

  if (expectedShape.requiresMessage && !response.success && !response.message && !response.error) {
    throw new Error('API response missing error message')
  }

  return true
}

// Response shape definitions
export const API_SHAPES = {
  ANALYSIS_START: {
    requiresSuccess: true,
    requiresData: true,
    expectedData: {
      analysis_id: 'string',
    },
  },
  ANALYSIS_RESULTS: {
    requiresSuccess: true,
    requiresData: true,
    expectedData: {
      brand_name: 'string',
      analysis_id: 'string',
      status: 'string',
      results: 'object',
    },
  },
  ANALYSIS_STATUS: {
    requiresSuccess: true,
    requiresData: true,
    expectedData: {
      status: 'string',
      progress: 'number',
    },
  },
  HEALTH_CHECK: {
    requiresSuccess: true,
    expectedData: {
      status: 'string',
      timestamp: 'string',
    },
  },
}

// API endpoint definitions
export const API_ENDPOINTS = {
  // Health
  HEALTH: '/health',
  HEALTH_DETAILED: '/health/detailed',
  
  // Authentication
  AUTH_LOGIN: '/auth/login',
  AUTH_REGISTER: '/auth/register',
  AUTH_ME: '/auth/me',
  AUTH_LOGOUT: '/auth/logout',
  
  // Brand operations
  BRAND_SEARCH: '/brand/search',
  BRAND_ASSETS: '/brand/assets',
  
  // Analysis operations
  ANALYSIS_START: '/analyze',
  ANALYSIS_STATUS: (id) => `/analyze/${id}/status`,
  ANALYSIS_RESULTS: (id) => `/analyze/${id}/results`,
  ANALYSIS_LIST: '/analyses',
  
  // File operations
  FILE_UPLOAD: '/upload',
  
  // Report operations
  REPORT_GENERATE: '/report/generate',
}

// Request configuration templates
export const REQUEST_CONFIGS = {
  DEFAULT: {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    maxRetries: 3,
    showToast: true,
  },
  
  FILE_UPLOAD: {
    headers: {
      'ngrok-skip-browser-warning': 'true',
      // Don't set Content-Type for FormData
    },
    maxRetries: 1,
    showToast: true,
  },
  
  HEALTH_CHECK: {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
    maxRetries: 1,
    showToast: false,
  },
  
  BACKGROUND: {
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    maxRetries: 2,
    showToast: false,
  },
}

export default {
  ANALYSIS_OPTIONS,
  ANALYSIS_STATUS,
  validateApiResponse,
  API_SHAPES,
  API_ENDPOINTS,
  REQUEST_CONFIGS,
}