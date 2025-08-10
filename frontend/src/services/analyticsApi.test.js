/**
 * Analytics API Service Tests
 * Tests for analytics-specific API interactions and data transformations
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { server, resetHandlers } from '../test-utils/server'
import { generateMockAnalyticsData } from '../test-utils'
import analyticsApi from './analyticsApi'
import { rest } from 'msw'

describe('Analytics API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    resetHandlers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Metrics Retrieval', () => {
    it('fetches brand health metrics successfully', async () => {
      const metrics = await analyticsApi.getBrandHealthMetrics('test-brand')
      
      expect(metrics).toMatchObject({
        brand_health: expect.any(Number),
        competitive_position: expect.any(Number),
        market_presence: expect.any(Number),
        sentiment_score: expect.any(Number),
        engagement_rate: expect.any(Number),
        growth_trend: expect.any(Number)
      })
      
      expect(metrics.brand_health).toBeGreaterThanOrEqual(0)
      expect(metrics.brand_health).toBeLessThanOrEqual(100)
    })

    it('fetches competitive analysis data', async () => {
      const competitiveData = await analyticsApi.getCompetitiveAnalysis('test-brand')
      
      expect(competitiveData).toHaveProperty('competitors')
      expect(Array.isArray(competitiveData.competitors)).toBe(true)
      expect(competitiveData.market_position).toBeDefined()
      expect(competitiveData.strengths).toBeDefined()
      expect(competitiveData.opportunities).toBeDefined()
    })

    it('retrieves performance trends over time', async () => {
      const trends = await analyticsApi.getPerformanceTrends('test-brand', '30d')
      
      expect(trends).toHaveProperty('period', '30d')
      expect(trends).toHaveProperty('data_points')
      expect(Array.isArray(trends.data_points)).toBe(true)
      expect(trends.data_points.length).toBeGreaterThan(0)
      
      // Validate data point structure
      const firstDataPoint = trends.data_points[0]
      expect(firstDataPoint).toHaveProperty('timestamp')
      expect(firstDataPoint).toHaveProperty('metrics')
      expect(typeof firstDataPoint.timestamp).toBe('string')
    })

    it('handles different time periods for trends', async () => {
      const periods = ['7d', '30d', '90d', '365d']
      
      for (const period of periods) {
        const trends = await analyticsApi.getPerformanceTrends('test-brand', period)
        expect(trends.period).toBe(period)
      }
    })
  })

  describe('Real-time Analytics', () => {
    it('establishes real-time connection successfully', async () => {
      const connectionSpy = vi.fn()
      const disconnectionSpy = vi.fn()
      
      await analyticsApi.startRealTimeAnalytics('test-brand', {
        onConnect: connectionSpy,
        onDisconnect: disconnectionSpy,
        onData: vi.fn()
      })
      
      expect(connectionSpy).toHaveBeenCalled()
    })

    it('receives real-time metric updates', async () => {
      const dataCallback = vi.fn()
      
      await analyticsApi.startRealTimeAnalytics('test-brand', {
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onData: dataCallback
      })
      
      // Simulate real-time data
      const mockRealTimeData = {
        brand_health: 82,
        timestamp: new Date().toISOString(),
        change: '+2.5%'
      }
      
      // Trigger simulated update
      await analyticsApi.simulateRealTimeUpdate(mockRealTimeData)
      
      expect(dataCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          brand_health: 82,
          timestamp: expect.any(String),
          change: '+2.5%'
        })
      )
    })

    it('handles real-time connection failures gracefully', async () => {
      const errorCallback = vi.fn()
      const reconnectCallback = vi.fn()
      
      // Mock WebSocket failure
      const mockWebSocket = {
        readyState: WebSocket.CONNECTING,
        close: vi.fn(),
        addEventListener: vi.fn((event, callback) => {
          if (event === 'error') {
            setTimeout(() => callback(new Error('Connection failed')), 100)
          }
        }),
        removeEventListener: vi.fn()
      }
      
      global.WebSocket = vi.fn(() => mockWebSocket)
      
      await analyticsApi.startRealTimeAnalytics('test-brand', {
        onConnect: vi.fn(),
        onDisconnect: vi.fn(),
        onData: vi.fn(),
        onError: errorCallback,
        onReconnect: reconnectCallback
      })
      
      // Wait for error to be triggered
      await new Promise(resolve => setTimeout(resolve, 150))
      
      expect(errorCallback).toHaveBeenCalled()
    })
  })

  describe('Data Export', () => {
    it('exports analytics data as JSON', async () => {
      const exportData = await analyticsApi.exportAnalytics('test-brand', 'json')
      
      expect(exportData).toHaveProperty('format', 'json')
      expect(exportData).toHaveProperty('data')
      expect(exportData).toHaveProperty('metadata')
      
      // Validate exported data structure
      expect(exportData.data.metrics).toBeDefined()
      expect(exportData.data.trends).toBeDefined()
      expect(exportData.metadata.export_timestamp).toBeDefined()
      expect(exportData.metadata.brand_name).toBe('test-brand')
    })

    it('exports analytics data as CSV', async () => {
      const exportData = await analyticsApi.exportAnalytics('test-brand', 'csv')
      
      expect(exportData).toHaveProperty('format', 'csv')
      expect(exportData).toHaveProperty('data')
      expect(typeof exportData.data).toBe('string')
      
      // Should contain CSV headers
      expect(exportData.data).toMatch(/timestamp,metric,value/)
    })

    it('handles large dataset exports efficiently', async () => {
      // Mock large dataset
      server.use(
        rest.get('/api/analytics/export', (req, res, ctx) => {
          const largeDataset = {
            metrics: Array(10000).fill().map((_, i) => ({
              timestamp: new Date(Date.now() - i * 86400000).toISOString(),
              brand_health: Math.random() * 100,
              engagement: Math.random() * 50,
              sentiment: Math.random() * 10
            }))
          }
          return res(ctx.json(largeDataset))
        })
      )
      
      const startTime = Date.now()
      const exportData = await analyticsApi.exportAnalytics('test-brand', 'json')
      const exportTime = Date.now() - startTime
      
      expect(exportData.data.metrics.length).toBe(10000)
      expect(exportTime).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('Brand Comparison', () => {
    it('compares multiple brands effectively', async () => {
      const comparisonData = await analyticsApi.compareBrands([
        'brand-a',
        'brand-b', 
        'brand-c'
      ])
      
      expect(comparisonData).toHaveProperty('brands')
      expect(comparisonData.brands).toHaveLength(3)
      
      // Each brand should have consistent metrics
      comparisonData.brands.forEach(brand => {
        expect(brand).toHaveProperty('name')
        expect(brand).toHaveProperty('metrics')
        expect(brand.metrics).toHaveProperty('brand_health')
        expect(brand.metrics).toHaveProperty('market_share')
      })
      
      expect(comparisonData).toHaveProperty('comparison_matrix')
      expect(comparisonData).toHaveProperty('insights')
    })

    it('handles comparison with insufficient data', async () => {
      const comparisonData = await analyticsApi.compareBrands(['unknown-brand'])
      
      expect(comparisonData.brands).toHaveLength(1)
      expect(comparisonData.brands[0].metrics.brand_health).toBe(null)
      expect(comparisonData.insights).toContain('insufficient data')
    })

    it('calculates competitive positioning accurately', async () => {
      const positioning = await analyticsApi.getCompetitivePositioning('test-brand')
      
      expect(positioning).toHaveProperty('quadrant')
      expect(positioning).toHaveProperty('x_axis') // Market share
      expect(positioning).toHaveProperty('y_axis') // Brand strength
      expect(positioning).toHaveProperty('competitors')
      
      // Quadrant should be valid
      expect(['leader', 'challenger', 'follower', 'niche']).toContain(positioning.quadrant)
      
      // Coordinates should be normalized (0-100)
      expect(positioning.x_axis).toBeGreaterThanOrEqual(0)
      expect(positioning.x_axis).toBeLessThanOrEqual(100)
      expect(positioning.y_axis).toBeGreaterThanOrEqual(0)
      expect(positioning.y_axis).toBeLessThanOrEqual(100)
    })
  })

  describe('Predictive Analytics', () => {
    it('generates brand health forecasts', async () => {
      const forecast = await analyticsApi.getForecast('test-brand', 'brand_health', '90d')
      
      expect(forecast).toHaveProperty('metric', 'brand_health')
      expect(forecast).toHaveProperty('forecast_period', '90d')
      expect(forecast).toHaveProperty('predictions')
      expect(Array.isArray(forecast.predictions)).toBe(true)
      
      // Predictions should have proper structure
      const firstPrediction = forecast.predictions[0]
      expect(firstPrediction).toHaveProperty('date')
      expect(firstPrediction).toHaveProperty('predicted_value')
      expect(firstPrediction).toHaveProperty('confidence_interval')
    })

    it('identifies trend patterns and anomalies', async () => {
      const analysis = await analyticsApi.getTrendAnalysis('test-brand', '30d')
      
      expect(analysis).toHaveProperty('trends')
      expect(analysis).toHaveProperty('anomalies')
      expect(analysis).toHaveProperty('patterns')
      
      // Trends should have direction and strength
      analysis.trends.forEach(trend => {
        expect(trend).toHaveProperty('metric')
        expect(trend).toHaveProperty('direction') // 'up', 'down', 'stable'
        expect(trend).toHaveProperty('strength') // 0-1
        expect(['up', 'down', 'stable']).toContain(trend.direction)
      })
      
      // Anomalies should have timestamps and severity
      analysis.anomalies.forEach(anomaly => {
        expect(anomaly).toHaveProperty('timestamp')
        expect(anomaly).toHaveProperty('severity')
        expect(anomaly).toHaveProperty('description')
      })
    })

    it('provides actionable insights based on data', async () => {
      const insights = await analyticsApi.getActionableInsights('test-brand')
      
      expect(insights).toHaveProperty('priority_actions')
      expect(insights).toHaveProperty('opportunities')
      expect(insights).toHaveProperty('risks')
      
      // Priority actions should have implementation guidance
      insights.priority_actions.forEach(action => {
        expect(action).toHaveProperty('title')
        expect(action).toHaveProperty('description')
        expect(action).toHaveProperty('impact_score')
        expect(action).toHaveProperty('effort_required')
        expect(action).toHaveProperty('timeline')
        
        expect(action.impact_score).toBeGreaterThanOrEqual(1)
        expect(action.impact_score).toBeLessThanOrEqual(10)
      })
    })
  })

  describe('Performance & Caching', () => {
    it('caches expensive analytics calculations', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      // Make two identical requests
      await analyticsApi.getBrandHealthMetrics('test-brand')
      await analyticsApi.getBrandHealthMetrics('test-brand')
      
      // Should use cache for second request
      expect(fetchSpy).toHaveBeenCalledTimes(1)
    })

    it('invalidates cache when new data is available', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      // Initial request
      await analyticsApi.getBrandHealthMetrics('test-brand')
      
      // Simulate data update
      await analyticsApi.invalidateCache('test-brand')
      
      // Next request should fetch fresh data
      await analyticsApi.getBrandHealthMetrics('test-brand')
      
      expect(fetchSpy).toHaveBeenCalledTimes(2)
    })

    it('handles concurrent requests for same data efficiently', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch')
      
      // Make multiple concurrent requests for same data
      const promises = Array(5).fill().map(() =>
        analyticsApi.getBrandHealthMetrics('test-brand')
      )
      
      const results = await Promise.all(promises)
      
      // Should deduplicate requests
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      
      // All results should be identical
      results.forEach(result => {
        expect(result).toEqual(results[0])
      })
    })
  })

  describe('Error Scenarios', () => {
    it('handles analytics service unavailability', async () => {
      server.use(
        rest.get('/api/analytics/metrics', (req, res, ctx) => {
          return res(ctx.status(503), ctx.json({ error: 'Analytics service unavailable' }))
        })
      )
      
      await expect(analyticsApi.getBrandHealthMetrics('test-brand')).rejects.toMatchObject({
        status: 503,
        message: expect.stringMatching(/unavailable/i)
      })
    })

    it('provides fallback data when analytics fail', async () => {
      server.use(
        rest.get('/api/analytics/metrics', (req, res, ctx) => {
          return res(ctx.status(500))
        })
      )
      
      const fallbackData = await analyticsApi.getBrandHealthMetrics('test-brand', {
        useFallback: true
      })
      
      expect(fallbackData).toBeDefined()
      expect(fallbackData.brand_health).toBeDefined()
      expect(fallbackData._fallback).toBe(true)
    })

    it('validates metric data integrity', async () => {
      server.use(
        rest.get('/api/analytics/metrics', (req, res, ctx) => {
          return res(ctx.json({
            brand_health: 'invalid-number',
            competitive_position: null,
            market_presence: 150 // Invalid range
          }))
        })
      )
      
      await expect(analyticsApi.getBrandHealthMetrics('test-brand')).rejects.toMatchObject({
        message: expect.stringMatching(/data validation/i)
      })
    })

    it('handles partial metric data gracefully', async () => {
      server.use(
        rest.get('/api/analytics/metrics', (req, res, ctx) => {
          return res(ctx.json({
            brand_health: 75,
            // Missing other metrics
          }))
        })
      )
      
      const metrics = await analyticsApi.getBrandHealthMetrics('test-brand')
      
      expect(metrics.brand_health).toBe(75)
      expect(metrics.competitive_position).toBeNull()
      expect(metrics.market_presence).toBeNull()
    })
  })

  describe('Data Transformation', () => {
    it('normalizes metric values consistently', async () => {
      const metrics = await analyticsApi.getBrandHealthMetrics('test-brand')
      
      // All percentage-based metrics should be 0-100
      expect(metrics.brand_health).toBeGreaterThanOrEqual(0)
      expect(metrics.brand_health).toBeLessThanOrEqual(100)
      expect(metrics.competitive_position).toBeGreaterThanOrEqual(0)
      expect(metrics.competitive_position).toBeLessThanOrEqual(100)
    })

    it('formats time-series data consistently', async () => {
      const trends = await analyticsApi.getPerformanceTrends('test-brand', '30d')
      
      trends.data_points.forEach(point => {
        expect(point.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
        expect(typeof point.metrics).toBe('object')
        expect(point.metrics).not.toBeNull()
      })
    })

    it('calculates derived metrics accurately', async () => {
      const analysis = await analyticsApi.getTrendAnalysis('test-brand', '30d')
      
      // Verify growth rate calculations
      if (analysis.growth_metrics) {
        expect(analysis.growth_metrics.month_over_month).toBeTypeOf('number')
        expect(analysis.growth_metrics.year_over_year).toBeTypeOf('number')
        
        // Growth rates should be reasonable (-100% to +1000%)
        expect(analysis.growth_metrics.month_over_month).toBeGreaterThanOrEqual(-100)
        expect(analysis.growth_metrics.month_over_month).toBeLessThanOrEqual(1000)
      }
    })
  })

  describe('Security & Privacy', () => {
    it('does not expose sensitive brand data in logs', async () => {
      const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
      
      await analyticsApi.getBrandHealthMetrics('confidential-brand')
      
      const logCalls = consoleSpy.mock.calls.flat()
      const logContent = logCalls.join(' ')
      
      // Should not contain sensitive identifiers
      expect(logContent).not.toContain('confidential-brand')
      expect(logContent).not.toContain('api-key')
      expect(logContent).not.toContain('password')
    })

    it('respects data retention policies', async () => {
      const retentionTest = await analyticsApi.getPerformanceTrends('test-brand', '2y')
      
      // Should not return data older than retention policy
      if (retentionTest.data_points.length > 0) {
        const oldestPoint = retentionTest.data_points[retentionTest.data_points.length - 1]
        const oldestDate = new Date(oldestPoint.timestamp)
        const twoYearsAgo = new Date()
        twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
        
        expect(oldestDate.getTime()).toBeGreaterThanOrEqual(twoYearsAgo.getTime())
      }
    })

    it('validates user permissions for brand access', async () => {
      // Mock unauthorized access
      server.use(
        rest.get('/api/analytics/metrics', (req, res, ctx) => {
          const brandId = req.url.searchParams.get('brand')
          if (brandId === 'unauthorized-brand') {
            return res(ctx.status(403), ctx.json({ error: 'Insufficient permissions' }))
          }
          return res(ctx.json({ brand_health: 75 }))
        })
      )
      
      await expect(analyticsApi.getBrandHealthMetrics('unauthorized-brand')).rejects.toMatchObject({
        status: 403,
        message: expect.stringMatching(/permission/i)
      })
    })
  })
})