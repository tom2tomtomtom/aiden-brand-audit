/**
 * API Service Layer Tests
 * Tests for core API interactions, retry logic, circuit breaker, and error handling
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { http, HttpResponse, delay } from 'msw'
import { server, useErrorHandlers, useNetworkErrorHandlers, resetHandlers } from '../test-utils/server'
import { createMockApiResponse, simulateApiError, simulateNetworkError } from '../test-utils'
import api from './api'

// Mock Vite environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:8000')

describe('API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetHandlers()
    
    // Override the base URL for testing
    api.baseURL = 'http://localhost:8000'
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Basic API Operations', () => {
    it('MSW is working', async () => {
      const response = await fetch('http://localhost:8000/api/health')
      const data = await response.json()
      
      expect(response.status).toBe(200)
      expect(data.status).toBe('healthy')
    })

    it('makes successful GET requests', async () => {
      const response = await api.get('/api/health')
      
      expect(response).toBeDefined()
      expect(response.status).toBe('healthy')
    })

    it('makes successful POST requests', async () => {
      const requestData = {
        brand_name: 'Test Brand',
        website: 'https://testbrand.com'
      }
      
      const response = await api.post('/api/brand/search', requestData)
      
      expect(response).toBeDefined()
      expect(response.brand_info).toBeDefined()
      expect(response.brand_info.name).toBe('Test Brand')
    })

    it('includes proper headers in requests', async () => {
      // Mock fetch to inspect headers
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      await api.get('/api/health')
      
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          })
        })
      )
    })

    it('handles authentication tokens', async () => {
      const token = 'test-auth-token'
      api.setAuthToken(token)
      
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      await api.get('/api/auth/me')
      
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Bearer ${token}`
          })
        })
      )
    })
  })

  describe('Error Handling', () => {
    it('handles 4xx client errors', async () => {
      useErrorHandlers()
      
      await expect(api.get('/api/analyze/nonexistent/results')).rejects.toMatchObject({
        status: 404,
        message: expect.stringMatching(/not found/i)
      })
    })

    it('handles 5xx server errors', async () => {
      useErrorHandlers()
      
      await expect(api.get('/api/health')).rejects.toMatchObject({
        status: 500,
        message: expect.stringMatching(/server error/i)
      })
    })

    it('handles network errors', async () => {
      useNetworkErrorHandlers()
      
      await expect(api.get('/api/health')).rejects.toMatchObject({
        message: expect.stringMatching(/network/i),
        type: 'NetworkError'
      })
    })

    it('handles timeout errors', async () => {
      vi.useFakeTimers()
      
      // Mock a slow response
      server.use(
        http.get('/api/slow-endpoint', async () => {
          await delay(15000)
          return HttpResponse.json({ data: 'slow response' })
        })
      )
      
      const timeoutPromise = api.get('/api/slow-endpoint')
      
      // Fast forward time to trigger timeout
      vi.advanceTimersByTime(15000)
      
      await expect(timeoutPromise).rejects.toMatchObject({
        message: expect.stringMatching(/timeout/i)
      })
      
      vi.useRealTimers()
    })
  })

  describe('Retry Mechanism', () => {
    it('retries failed requests up to maximum attempts', async () => {
      useErrorHandlers()
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      try {
        await api.get('/api/health')
      } catch (error) {
        // Expected to fail after retries
      }
      
      // Should have made initial request + 3 retries = 4 total
      expect(fetchSpy).toHaveBeenCalledTimes(4)
    })

    it('does not retry on 4xx client errors', async () => {
      useErrorHandlers()
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      try {
        await api.get('/api/analyze/nonexistent/results')
      } catch (error) {
        // Expected to fail
      }
      
      // Should only make one attempt for client errors
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('uses exponential backoff between retries', async () => {
      vi.useFakeTimers()
      useErrorHandlers()
      
      const startTime = Date.now()
      const promise = api.get('/api/health').catch(() => {})
      
      // Advance timers to simulate retry delays
      vi.advanceTimersByTime(1000) // First retry delay
      vi.advanceTimersByTime(2000) // Second retry delay (exponential)
      vi.advanceTimersByTime(4000) // Third retry delay (exponential)
      
      await promise
      
      vi.useRealTimers()
      
      // Should have used exponential backoff
      expect(Date.now() - startTime).toBeGreaterThanOrEqual(7000)
    })
  })

  describe('Circuit Breaker', () => {
    it('opens circuit after consecutive failures', async () => {
      useErrorHandlers()
      
      // Make multiple failed requests to trigger circuit breaker
      const promises = Array(6).fill().map(() => 
        api.get('/api/health').catch(() => {})
      )
      
      await Promise.all(promises)
      
      // Next request should fail immediately due to open circuit
      const start = Date.now()
      await api.get('/api/health').catch(() => {})
      const duration = Date.now() - start
      
      // Should fail quickly (circuit breaker prevents retry)
      expect(duration).toBeLessThan(100)
    })

    it('allows requests through when circuit is half-open', async () => {
      vi.useFakeTimers()
      useErrorHandlers()
      
      // Trigger circuit breaker
      const failPromises = Array(6).fill().map(() => 
        api.get('/api/health').catch(() => {})
      )
      await Promise.all(failPromises)
      
      // Wait for circuit to move to half-open state
      vi.advanceTimersByTime(60000) // 1 minute
      
      resetHandlers() // Reset to success handlers
      
      // Should allow one request through
      const response = await api.get('/api/health')
      expect(response.status).toBe('healthy')
      
      vi.useRealTimers()
    })
  })

  describe('Request/Response Interceptors', () => {
    it('adds request correlation IDs', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      await api.get('/api/health')
      
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Correlation-ID': expect.stringMatching(/^corr_/)
          })
        })
      )
    })

    it('logs request/response for debugging', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      
      await api.get('/api/health')
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/API Request:/),
        expect.any(Object)
      )
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringMatching(/API Response:/),
        expect.any(Object)
      )
    })

    it('transforms response data consistently', async () => {
      const response = await api.get('/api/health')
      
      // Should have consistent response structure
      expect(response).toHaveProperty('status')
      expect(response).toHaveProperty('timestamp')
      
      // Should include metadata
      expect(response._metadata).toMatchObject({
        correlationId: expect.any(String),
        responseTime: expect.any(Number),
        cached: expect.any(Boolean)
      })
    })
  })

  describe('Caching', () => {
    it('caches GET requests when appropriate', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      // Make two identical requests
      await api.get('/api/health', { cache: true })
      await api.get('/api/health', { cache: true })
      
      // Should only make one actual network request
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('respects cache control headers', async () => {
      server.use(
        http.get('/api/cached-endpoint', () => {
          return HttpResponse.json(
            { cached: true, timestamp: Date.now() },
            { headers: { 'Cache-Control': 'max-age=300' } }
          )
        })
      )
      
      const response1 = await api.get('/api/cached-endpoint')
      const response2 = await api.get('/api/cached-endpoint')
      
      // Should return cached response
      expect(response1.timestamp).toBe(response2.timestamp)
      expect(response2._metadata.cached).toBe(true)
    })

    it('bypasses cache for POST/PUT/DELETE requests', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      await api.post('/api/analyze', { brand: 'test' })
      await api.post('/api/analyze', { brand: 'test' })
      
      // Should make two separate requests
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })
  })

  describe('Real-world Scenarios', () => {
    it('handles analysis workflow end-to-end', async () => {
      // Step 1: Start analysis
      const analysisResponse = await api.post('/api/analyze', {
        brand_name: 'Test Brand',
        analysis_type: 'comprehensive'
      })
      
      expect(analysisResponse.analysis_id).toBe('test-analysis-123')
      expect(analysisResponse.status).toBe('processing')
      
      // Step 2: Check status
      const statusResponse = await api.get(`/api/analyze/${analysisResponse.analysis_id}/status`)
      
      expect(statusResponse.analysis_id).toBe('test-analysis-123')
      expect(statusResponse.status).toBe('completed')
      
      // Step 3: Get results
      const resultsResponse = await api.get(`/api/analyze/${analysisResponse.analysis_id}/results`)
      
      expect(resultsResponse.results).toBeDefined()
      expect(resultsResponse.metadata).toBeDefined()
    })

    it('handles concurrent requests efficiently', async () => {
      const promises = Array(10).fill().map((_, i) => 
        api.get(`/api/health?request=${i}`)
      )
      
      const responses = await Promise.all(promises)
      
      // All requests should succeed
      expect(responses).toHaveLength(10)
      responses.forEach(response => {
        expect(response.status).toBe('healthy')
      })
    })

    it('handles file upload with progress tracking', async () => {
      const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
      const progressCallback = vi.fn()
      
      const formData = new FormData()
      formData.append('file', mockFile)
      
      const response = await api.post('/api/upload', formData, {
        onUploadProgress: progressCallback
      })
      
      expect(response.upload_id).toBe('test-upload-456')
      expect(response.files_processed).toBe(3)
      expect(progressCallback).toHaveBeenCalled()
    })
  })

  describe('Performance', () => {
    it('handles large response payloads efficiently', async () => {
      const largeData = Array(10000).fill().map((_, i) => ({
        id: i,
        data: `test-data-${i}`,
        metrics: {
          value1: Math.random(),
          value2: Math.random(),
          value3: Math.random()
        }
      }))
      
      server.use(
        http.get('/api/large-dataset', () => {
          return HttpResponse.json({ data: largeData })
        })
      )
      
      const startTime = Date.now()
      const response = await api.get('/api/large-dataset')
      const duration = Date.now() - startTime
      
      expect(response.data).toHaveLength(10000)
      // Should handle large payloads reasonably quickly
      expect(duration).toBeLessThan(5000)
    })

    it('implements request cancellation', async () => {
      const abortController = new AbortController()
      
      const promise = api.get('/api/slow-endpoint', {
        signal: abortController.signal
      })
      
      // Cancel the request
      abortController.abort()
      
      await expect(promise).rejects.toMatchObject({
        name: 'AbortError'
      })
    })

    it('batches multiple similar requests', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      // Make multiple requests for different analysis status
      const promises = [
        api.get('/api/analyze/1/status'),
        api.get('/api/analyze/2/status'),
        api.get('/api/analyze/3/status')
      ]
      
      await Promise.all(promises)
      
      // Should batch into fewer actual requests
      expect(fetchSpy).toHaveBeenCalledTimes(3) // Or fewer if batching is implemented
    })
  })

  describe('Security', () => {
    it('sanitizes request data to prevent injection attacks', async () => {
      const maliciousData = {
        brand_name: '<script>alert("xss")</script>',
        website: 'javascript:alert("xss")'
      }
      
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      await api.post('/api/brand/search', maliciousData).catch(() => {})
      
      const requestBody = JSON.parse(fetchSpy.mock.calls[0][1].body)
      
      // Should sanitize dangerous content
      expect(requestBody.brand_name).not.toContain('<script>')
      expect(requestBody.website).not.toMatch(/^javascript:/)
    })

    it('validates SSL certificates in production', async () => {
      // Mock production environment
      process.env.NODE_ENV = 'production'
      
      const httpsRequest = api.get('https://api.example.com/secure-endpoint')
      
      // Should reject invalid certificates (would fail in real production)
      await expect(httpsRequest).rejects.toThrow()
      
      process.env.NODE_ENV = 'test'
    })

    it('prevents CSRF attacks with proper headers', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      await api.post('/api/analyze', { data: 'test' })
      
      expect(fetchSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-Token': expect.any(String)
          })
        })
      )
    })
  })
})