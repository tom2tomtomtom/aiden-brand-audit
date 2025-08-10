/**
 * Mock Service Worker setup for testing
 * This file sets up MSW to intercept and mock API calls during testing
 * 
 * MSW v2.0.0 Configuration
 */

import { http, HttpResponse } from 'msw'
import { setupServer } from 'msw/node'

import { mockAnalysisResults, mockBrandData } from './index.jsx'

// Define request handlers for different API endpoints using MSW v2.0.0 syntax
const handlers = [
  // Health check endpoint - match all possible patterns
  http.get('/api/health', () => {
    console.log('MSW Handler: Health check called')
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  }),
  
  // Wildcard health check handler for any base URL
  http.get('*/api/health', () => {
    console.log('MSW Handler: Wildcard health check called')
    return HttpResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  }),

  // Brand search endpoint - with wildcard
  http.post('/api/brand/search', () => {
    return HttpResponse.json({
      brand_info: mockBrandData,
      search_results: {
        found: true,
        confidence: 95,
        sources: ['official_website', 'business_directory']
      }
    })
  }),
  
  http.post('*/api/brand/search', () => {
    return HttpResponse.json({
      brand_info: mockBrandData,
      search_results: {
        found: true,
        confidence: 95,
        sources: ['official_website', 'business_directory']
      }
    })
  }),

  // Analysis endpoint - with wildcard
  http.post('/api/analyze', () => {
    return HttpResponse.json({
      analysis_id: 'test-analysis-123',
      status: 'processing',
      estimated_completion: '2024-08-06T10:30:00Z'
    }, { status: 202 })
  }),
  
  http.post('*/api/analyze', () => {
    return HttpResponse.json({
      analysis_id: 'test-analysis-123',
      status: 'processing',
      estimated_completion: '2024-08-06T10:30:00Z'
    }, { status: 202 })
  }),

  // Analysis status endpoint
  http.get('/api/analyze/:id/status', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      analysis_id: id,
      status: 'completed',
      progress: 100,
      completion_time: '2024-08-06T10:25:00Z'
    })
  }),

  // Analysis results endpoint
  http.get('/api/analyze/:id/results', ({ params }) => {
    const { id } = params
    return HttpResponse.json({
      analysis_id: id,
      results: mockAnalysisResults,
      metadata: {
        processing_time_seconds: 145,
        data_sources_used: 5,
        confidence_score: 92
      }
    })
  }),

  // Analytics API endpoints
  http.get('/api/analytics/metrics', () => {
    return HttpResponse.json({
      brand_health: 78,
      competitive_position: 85,
      market_presence: 72,
      sentiment_score: 68,
      engagement_rate: 15.4,
      growth_trend: 12.8
    })
  }),

  // Upload endpoint
  http.post('/api/upload', () => {
    return HttpResponse.json({
      upload_id: 'test-upload-456',
      files_processed: 3,
      status: 'success',
      message: 'Files uploaded successfully'
    })
  }),

  // Error logging endpoint
  http.post('/api/errors/log', () => {
    return HttpResponse.json({
      logged: true,
      error_id: 'logged-error-789'
    })
  }),

  // User authentication endpoints
  http.post('/api/auth/login', () => {
    return HttpResponse.json({
      token: 'mock-jwt-token-123',
      user: {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com'
      },
      expires_at: '2024-08-06T23:59:59Z'
    })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    return HttpResponse.json({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com'
    })
  }),

  // Historical analysis endpoints
  http.get('/api/analyses', () => {
    return HttpResponse.json([
      {
        id: 'analysis-1',
        brand_name: 'Test Brand',
        created_at: '2024-08-05T14:30:00Z',
        status: 'completed',
        health_score: 78
      },
      {
        id: 'analysis-2', 
        brand_name: 'Another Brand',
        created_at: '2024-08-04T09:15:00Z',
        status: 'completed',
        health_score: 82
      }
    ])
  })
]

// Error simulation handlers for testing error scenarios
export const errorHandlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }),

  http.post('/api/analyze', () => {
    return HttpResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }),

  http.get('/api/analyze/:id/results', () => {
    return HttpResponse.json({ error: 'Analysis not found' }, { status: 404 })
  })
]

// Network error handlers
export const networkErrorHandlers = [
  http.get('/api/health', () => {
    return HttpResponse.error()
  })
]

// Create server instance
export const server = setupServer(...handlers)

// Helper functions for tests
export const useErrorHandlers = () => {
  server.use(...errorHandlers)
}

export const useNetworkErrorHandlers = () => {
  server.use(...networkErrorHandlers)
}

export const resetHandlers = () => {
  server.resetHandlers(...handlers)
}

// Export for manual setup in individual tests
export { handlers }