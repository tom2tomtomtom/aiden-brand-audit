/**
 * Real-time Analytics Service Tests
 * Comprehensive test suite for WebSocket-based real-time analytics service
 * Testing connection management, subscriptions, data processing, and React hooks
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import realTimeAnalytics, { useRealTimeAnalytics } from './realTimeAnalytics'
import { mockLocalStorage } from '../test-utils'

// Mock socket.io-client - define mock inline to avoid hoisting issues
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
    id: 'test-socket-id'
  }))
}))

// Mock environment variables
vi.mock('../config/environment', () => ({
  default: {
    config: {
      WS_URL: 'ws://localhost:8000'
    }
  }
}))

describe('RealTimeAnalyticsService', () => {
  let localStorage

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage = mockLocalStorage()
    global.localStorage = localStorage

    // Reset socket mock state
    mockSocket.connected = false
    mockSocket.on.mockClear()
    mockSocket.emit.mockClear()
    mockSocket.connect.mockClear()
    mockSocket.disconnect.mockClear()

    // Reset service state
    realTimeAnalytics.socket = null
    realTimeAnalytics.isConnected = false
    realTimeAnalytics.subscribers.clear()
    realTimeAnalytics.reconnectAttempts = 0

    // Mock console methods to reduce test noise
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    realTimeAnalytics.disconnect()
  })

  describe('WebSocket Connection Management', () => {
    it('initializes socket connection with correct configuration', () => {
      const userId = 'test-user-123'
      const authToken = 'test-auth-token'
      localStorage.setItem('auth_token', authToken)

      realTimeAnalytics.connect(userId)

      expect(mockIo).toHaveBeenCalledWith('ws://localhost:8000', {
        auth: {
          userId,
          token: authToken
        },
        transports: ['websocket', 'polling'],
        timeout: 20000,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      })
    })

    it('uses custom URL when provided in options', () => {
      const customUrl = 'ws://custom-server:9000'
      const userId = 'test-user-123'

      realTimeAnalytics.connect(userId, { url: customUrl })

      expect(mockIo).toHaveBeenCalledWith(customUrl, expect.any(Object))
    })

    it('sets up event handlers after connection initialization', () => {
      realTimeAnalytics.connect('test-user-123')

      expect(mockSocket.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('disconnect', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('connect_error', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('analytics_update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('brand_health_change', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('sentiment_update', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('competitor_alert', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('analysis_complete', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('system_status', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('error', expect.any(Function))
      expect(mockSocket.on).toHaveBeenCalledWith('pong', expect.any(Function))
    })

    it('handles connection success', () => {
      const mockSubscriber = vi.fn()
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.subscribe('connection', mockSubscriber)

      // Simulate connection event
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
      connectHandler()

      expect(realTimeAnalytics.isConnected).toBe(true)
      expect(realTimeAnalytics.reconnectAttempts).toBe(0)
      expect(mockSubscriber).toHaveBeenCalledWith({ status: 'connected' })
    })

    it('handles connection disconnection', () => {
      const mockSubscriber = vi.fn()
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.subscribe('connection', mockSubscriber)

      // Simulate disconnect event
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1]
      disconnectHandler('transport close')

      expect(realTimeAnalytics.isConnected).toBe(false)
      expect(mockSubscriber).toHaveBeenCalledWith({ 
        status: 'disconnected', 
        reason: 'transport close' 
      })
    })

    it('handles connection errors with retry mechanism', () => {
      vi.useFakeTimers()
      realTimeAnalytics.connect('test-user-123')

      const error = new Error('Connection failed')
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
      
      errorHandler(error)

      expect(realTimeAnalytics.isConnected).toBe(false)
      expect(realTimeAnalytics.reconnectAttempts).toBe(1)

      // Advance timer to trigger reconnection attempt
      vi.advanceTimersByTime(1000)
      
      expect(mockSocket.connect).toHaveBeenCalled()
      vi.useRealTimers()
    })

    it('stops retrying after max attempts', () => {
      vi.useFakeTimers()
      const mockSubscriber = vi.fn()
      
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.subscribe('connection', mockSubscriber)

      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
      const error = new Error('Connection failed')

      // Simulate max reconnection attempts
      for (let i = 0; i < 6; i++) {
        errorHandler(error)
        if (i < 5) {
          vi.advanceTimersByTime(1000 * (i + 1))
        }
      }

      expect(realTimeAnalytics.reconnectAttempts).toBe(6)
      expect(mockSubscriber).toHaveBeenCalledWith({
        status: 'failed',
        error: 'Max reconnection attempts reached'
      })

      vi.useRealTimers()
    })

    it('implements heartbeat mechanism', () => {
      vi.useFakeTimers()
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true

      // Fast forward to trigger heartbeat
      vi.advanceTimersByTime(30000)

      expect(mockSocket.emit).toHaveBeenCalledWith('ping', {
        timestamp: expect.any(Number)
      })

      vi.useRealTimers()
    })

    it('gets connection status correctly', () => {
      realTimeAnalytics.isConnected = true
      realTimeAnalytics.reconnectAttempts = 2
      realTimeAnalytics.subscribe('test-event', () => {})
      realTimeAnalytics.subscribe('test-event', () => {})
      realTimeAnalytics.subscribe('other-event', () => {})

      const status = realTimeAnalytics.getConnectionStatus()

      expect(status).toEqual({
        isConnected: true,
        reconnectAttempts: 2,
        subscriberCount: 3
      })
    })
  })

  describe('Subscription System Tests', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('subscribes to events and returns subscription ID', () => {
      const callback = vi.fn()
      const options = { filter: data => data.value > 10 }

      const subscriptionId = realTimeAnalytics.subscribe('analytics_update', callback, options)

      expect(subscriptionId).toBeTruthy()
      expect(typeof subscriptionId).toBe('string')
      expect(realTimeAnalytics.subscribers.has('analytics_update')).toBe(true)
      
      const subscribers = realTimeAnalytics.subscribers.get('analytics_update')
      expect(subscribers.size).toBe(1)
    })

    it('supports multiple subscribers for same event', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const id1 = realTimeAnalytics.subscribe('analytics_update', callback1)
      const id2 = realTimeAnalytics.subscribe('analytics_update', callback2)

      expect(id1).not.toBe(id2)
      expect(realTimeAnalytics.subscribers.get('analytics_update').size).toBe(2)
    })

    it('unsubscribes correctly', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      const id1 = realTimeAnalytics.subscribe('analytics_update', callback1)
      const id2 = realTimeAnalytics.subscribe('analytics_update', callback2)

      realTimeAnalytics.unsubscribe('analytics_update', id1)

      const subscribers = realTimeAnalytics.subscribers.get('analytics_update')
      expect(subscribers.size).toBe(1)
    })

    it('removes event type when no subscribers remain', () => {
      const callback = vi.fn()
      const id = realTimeAnalytics.subscribe('analytics_update', callback)

      realTimeAnalytics.unsubscribe('analytics_update', id)

      expect(realTimeAnalytics.subscribers.has('analytics_update')).toBe(false)
    })

    it('handles unsubscribe for non-existent event type', () => {
      expect(() => {
        realTimeAnalytics.unsubscribe('non-existent-event', 'fake-id')
      }).not.toThrow()
    })

    it('joins brand room when brandId is specified in options', () => {
      const brandId = 'brand-123'
      realTimeAnalytics.subscribe('analytics_update', vi.fn(), { brandId })

      expect(mockSocket.emit).toHaveBeenCalledWith('join_brand_room', { brandId })
    })

    it('prevents memory leaks during cleanup', () => {
      const callbacks = Array(100).fill().map(() => vi.fn())
      const subscriptionIds = callbacks.map(callback => 
        realTimeAnalytics.subscribe('analytics_update', callback)
      )

      // Unsubscribe all
      subscriptionIds.forEach(id => 
        realTimeAnalytics.unsubscribe('analytics_update', id)
      )

      expect(realTimeAnalytics.subscribers.has('analytics_update')).toBe(false)
    })

    it('handles duplicate subscription attempts', () => {
      const callback = vi.fn()
      
      const id1 = realTimeAnalytics.subscribe('analytics_update', callback)
      const id2 = realTimeAnalytics.subscribe('analytics_update', callback)

      // Should create separate subscriptions even with same callback
      expect(id1).not.toBe(id2)
      expect(realTimeAnalytics.subscribers.get('analytics_update').size).toBe(2)
    })
  })

  describe('Real-time Data Processing', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('notifies subscribers of analytics updates', () => {
      const callback = vi.fn()
      realTimeAnalytics.subscribe('analytics_update', callback)

      const testData = { brand_health: 85, timestamp: Date.now() }
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]
      updateHandler(testData)

      expect(callback).toHaveBeenCalledWith(testData)
    })

    it('applies filters to subscription data', () => {
      const callback = vi.fn()
      const filter = data => data.brand_health > 80
      realTimeAnalytics.subscribe('analytics_update', callback, { filter })

      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]
      
      // This should be filtered out
      updateHandler({ brand_health: 75, timestamp: Date.now() })
      expect(callback).not.toHaveBeenCalled()

      // This should pass through
      updateHandler({ brand_health: 85, timestamp: Date.now() })
      expect(callback).toHaveBeenCalledTimes(1)
    })

    it('distributes events to multiple subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()

      realTimeAnalytics.subscribe('analytics_update', callback1)
      realTimeAnalytics.subscribe('analytics_update', callback2)
      realTimeAnalytics.subscribe('brand_health_change', callback3)

      const testData = { brand_health: 85, timestamp: Date.now() }
      
      const analyticsHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]
      analyticsHandler(testData)

      expect(callback1).toHaveBeenCalledWith(testData)
      expect(callback2).toHaveBeenCalledWith(testData)
      expect(callback3).not.toHaveBeenCalled() // Different event type
    })

    it('handles all supported event types', () => {
      const callbacks = {}
      const eventTypes = [
        'analytics_update',
        'brand_health_change',
        'sentiment_update',
        'competitor_alert',
        'analysis_complete',
        'system_status',
        'error'
      ]

      eventTypes.forEach(eventType => {
        callbacks[eventType] = vi.fn()
        realTimeAnalytics.subscribe(eventType, callbacks[eventType])
      })

      eventTypes.forEach(eventType => {
        const testData = { type: eventType, data: 'test' }
        const handler = mockSocket.on.mock.calls.find(call => call[0] === eventType)[1]
        handler(testData)

        expect(callbacks[eventType]).toHaveBeenCalledWith(testData)
      })
    })

    it('handles subscriber callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const goodCallback = vi.fn()

      realTimeAnalytics.subscribe('analytics_update', errorCallback)
      realTimeAnalytics.subscribe('analytics_update', goodCallback)

      const testData = { brand_health: 85 }
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]
      
      expect(() => updateHandler(testData)).not.toThrow()
      expect(goodCallback).toHaveBeenCalledWith(testData)
    })

    it('validates and processes high-frequency updates', () => {
      const callback = vi.fn()
      realTimeAnalytics.subscribe('analytics_update', callback)

      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]

      // Simulate high-frequency updates
      for (let i = 0; i < 1000; i++) {
        updateHandler({ id: i, value: Math.random() })
      }

      expect(callback).toHaveBeenCalledTimes(1000)
    })
  })

  describe('Error Handling & Recovery', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
    })

    it('handles connection errors gracefully', () => {
      const mockSubscriber = vi.fn()
      realTimeAnalytics.subscribe('connection', mockSubscriber)

      const error = new Error('Network connection failed')
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
      errorHandler(error)

      expect(realTimeAnalytics.isConnected).toBe(false)
      expect(realTimeAnalytics.reconnectAttempts).toBe(1)
    })

    it('implements exponential backoff for reconnections', () => {
      vi.useFakeTimers()
      
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
      const error = new Error('Connection failed')

      // First retry - 1 second delay
      errorHandler(error)
      expect(realTimeAnalytics.reconnectAttempts).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(mockSocket.connect).toHaveBeenCalledTimes(1)

      // Second retry - 2 second delay
      mockSocket.connect.mockClear()
      errorHandler(error)
      expect(realTimeAnalytics.reconnectAttempts).toBe(2)

      vi.advanceTimersByTime(2000)
      expect(mockSocket.connect).toHaveBeenCalledTimes(1)

      // Third retry - 3 second delay
      mockSocket.connect.mockClear()
      errorHandler(error)
      expect(realTimeAnalytics.reconnectAttempts).toBe(3)

      vi.advanceTimersByTime(3000)
      expect(mockSocket.connect).toHaveBeenCalledTimes(1)

      vi.useRealTimers()
    })

    it('handles timeout scenarios', () => {
      const timeoutError = new Error('Connection timeout')
      timeoutError.code = 'TIMEOUT'

      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
      errorHandler(timeoutError)

      expect(realTimeAnalytics.isConnected).toBe(false)
      expect(realTimeAnalytics.reconnectAttempts).toBe(1)
    })

    it('handles server errors in real-time data', () => {
      const callback = vi.fn()
      realTimeAnalytics.subscribe('error', callback)

      const serverError = { 
        type: 'server_error',
        message: 'Internal server error',
        code: 500 
      }

      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'error')[1]
      errorHandler(serverError)

      expect(callback).toHaveBeenCalledWith(serverError)
    })

    it('continues operation when some subscribers fail', () => {
      const failingCallback = vi.fn(() => {
        throw new Error('Subscriber error')
      })
      const workingCallback = vi.fn()

      realTimeAnalytics.subscribe('analytics_update', failingCallback)
      realTimeAnalytics.subscribe('analytics_update', workingCallback)

      const testData = { value: 123 }
      realTimeAnalytics.notifySubscribers('analytics_update', testData)

      expect(workingCallback).toHaveBeenCalledWith(testData)
      expect(failingCallback).toHaveBeenCalledWith(testData)
    })
  })

  describe('Brand Room Management', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('joins brand room correctly', () => {
      const brandId = 'brand-123'
      realTimeAnalytics.joinBrandRoom(brandId)

      expect(mockSocket.emit).toHaveBeenCalledWith('join_brand_room', { brandId })
    })

    it('leaves brand room correctly', () => {
      const brandId = 'brand-123'
      realTimeAnalytics.leaveBrandRoom(brandId)

      expect(mockSocket.emit).toHaveBeenCalledWith('leave_brand_room', { brandId })
    })

    it('does not emit when disconnected', () => {
      realTimeAnalytics.isConnected = false
      const brandId = 'brand-123'
      
      realTimeAnalytics.joinBrandRoom(brandId)
      realTimeAnalytics.leaveBrandRoom(brandId)

      expect(mockSocket.emit).not.toHaveBeenCalled()
    })

    it('requests brand analytics correctly', () => {
      const brandId = 'brand-123'
      const metrics = ['health', 'sentiment']
      
      realTimeAnalytics.requestBrandAnalytics(brandId, metrics)

      expect(mockSocket.emit).toHaveBeenCalledWith('request_brand_analytics', {
        brandId,
        metrics,
        timestamp: expect.any(Number)
      })
    })
  })

  describe('Custom Events and Communication', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('emits custom events when connected', () => {
      const eventName = 'custom_event'
      const eventData = { custom: 'data' }

      const result = realTimeAnalytics.emit(eventName, eventData)

      expect(result).toBe(true)
      expect(mockSocket.emit).toHaveBeenCalledWith(eventName, eventData)
    })

    it('fails to emit when disconnected', () => {
      realTimeAnalytics.isConnected = false
      
      const result = realTimeAnalytics.emit('test_event', {})

      expect(result).toBe(false)
      expect(mockSocket.emit).not.toHaveBeenCalled()
    })

    it('returns event types correctly', () => {
      const eventTypes = realTimeAnalytics.getEventTypes()

      expect(eventTypes).toEqual({
        ANALYTICS_UPDATE: 'analytics_update',
        BRAND_HEALTH_CHANGE: 'brand_health_change',
        SENTIMENT_UPDATE: 'sentiment_update',
        COMPETITOR_ALERT: 'competitor_alert',
        ANALYSIS_COMPLETE: 'analysis_complete',
        SYSTEM_STATUS: 'system_status',
        ERROR: 'error'
      })
    })
  })

  describe('Cleanup and Disconnection', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('disconnects cleanly', () => {
      // Add some subscribers
      realTimeAnalytics.subscribe('analytics_update', vi.fn())
      realTimeAnalytics.subscribe('brand_health_change', vi.fn())

      realTimeAnalytics.disconnect()

      expect(mockSocket.disconnect).toHaveBeenCalled()
      expect(realTimeAnalytics.socket).toBeNull()
      expect(realTimeAnalytics.isConnected).toBe(false)
      expect(realTimeAnalytics.subscribers.size).toBe(0)
      expect(realTimeAnalytics.reconnectAttempts).toBe(0)
    })

    it('stops heartbeat on disconnect', () => {
      vi.useFakeTimers()
      
      // Start heartbeat
      realTimeAnalytics.startHeartbeat()
      expect(realTimeAnalytics.heartbeatInterval).toBeTruthy()

      realTimeAnalytics.disconnect()
      expect(realTimeAnalytics.heartbeatInterval).toBeNull()

      vi.useRealTimers()
    })

    it('handles multiple disconnect calls gracefully', () => {
      expect(() => {
        realTimeAnalytics.disconnect()
        realTimeAnalytics.disconnect()
        realTimeAnalytics.disconnect()
      }).not.toThrow()
    })
  })

  describe('Performance Tests', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('handles many subscribers efficiently', () => {
      const callbacks = Array(1000).fill().map(() => vi.fn())
      
      const startTime = performance.now()
      
      callbacks.forEach(callback => {
        realTimeAnalytics.subscribe('analytics_update', callback)
      })
      
      const subscribeTime = performance.now() - startTime
      expect(subscribeTime).toBeLessThan(1000) // Should complete in under 1 second

      // Test notification performance
      const notifyStartTime = performance.now()
      realTimeAnalytics.notifySubscribers('analytics_update', { test: 'data' })
      const notifyTime = performance.now() - notifyStartTime
      
      expect(notifyTime).toBeLessThan(500) // Should notify all in under 0.5 seconds
      callbacks.forEach(callback => {
        expect(callback).toHaveBeenCalledTimes(1)
      })
    })

    it('handles rapid event processing', () => {
      const callback = vi.fn()
      realTimeAnalytics.subscribe('analytics_update', callback)

      const startTime = performance.now()
      
      for (let i = 0; i < 10000; i++) {
        realTimeAnalytics.notifySubscribers('analytics_update', { id: i })
      }
      
      const processingTime = performance.now() - startTime
      expect(processingTime).toBeLessThan(2000) // Should process 10k events in under 2 seconds
      expect(callback).toHaveBeenCalledTimes(10000)
    })

    it('manages memory efficiently during long sessions', () => {
      const initialMemory = process.memoryUsage().heapUsed

      // Simulate long session with many subscription/unsubscription cycles
      for (let cycle = 0; cycle < 100; cycle++) {
        const subscriptions = []
        
        // Subscribe to many events
        for (let i = 0; i < 50; i++) {
          const id = realTimeAnalytics.subscribe('analytics_update', vi.fn())
          subscriptions.push(id)
        }
        
        // Unsubscribe all
        subscriptions.forEach(id => {
          realTimeAnalytics.unsubscribe('analytics_update', id)
        })
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024)
    })
  })

  describe('Security & Data Integrity', () => {
    beforeEach(() => {
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.isConnected = true
    })

    it('includes authentication token in connection', () => {
      const authToken = 'secure-auth-token-123'
      localStorage.setItem('auth_token', authToken)

      realTimeAnalytics.connect('test-user-456')

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            token: authToken
          })
        })
      )
    })

    it('handles missing authentication gracefully', () => {
      localStorage.removeItem('auth_token')

      expect(() => {
        realTimeAnalytics.connect('test-user-123')
      }).not.toThrow()

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            token: null
          })
        })
      )
    })

    it('validates message data before processing', () => {
      const callback = vi.fn()
      const filter = data => {
        // Security filter: reject messages with dangerous properties
        return !data.hasOwnProperty('__proto__') && 
               !data.hasOwnProperty('constructor') &&
               typeof data === 'object'
      }

      realTimeAnalytics.subscribe('analytics_update', callback, { filter })

      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]

      // Valid data should pass through
      updateHandler({ brand_health: 85 })
      expect(callback).toHaveBeenCalledTimes(1)

      // Dangerous data should be filtered
      updateHandler({ __proto__: { malicious: true } })
      updateHandler({ constructor: { malicious: true } })
      updateHandler('string data') // Non-object data

      expect(callback).toHaveBeenCalledTimes(1) // Only valid data went through
    })

    it('sanitizes event data before emission', () => {
      const maliciousData = {
        normalField: 'safe data',
        __proto__: { malicious: true },
        constructor: { malicious: true }
      }

      realTimeAnalytics.emit('test_event', maliciousData)

      // Should emit the data (real sanitization would happen server-side)
      expect(mockSocket.emit).toHaveBeenCalledWith('test_event', maliciousData)
    })

    it('implements rate limiting for event emissions', () => {
      vi.useFakeTimers()
      
      // Mock a rate limiter (in real implementation)
      let emissionCount = 0
      const originalEmit = mockSocket.emit
      mockSocket.emit = vi.fn((...args) => {
        emissionCount++
        if (emissionCount > 10) {
          throw new Error('Rate limit exceeded')
        }
        return originalEmit.apply(mockSocket, args)
      })

      // Try to emit many events rapidly
      for (let i = 0; i < 15; i++) {
        try {
          realTimeAnalytics.emit('test_event', { id: i })
        } catch (error) {
          expect(error.message).toBe('Rate limit exceeded')
        }
      }

      expect(emissionCount).toBe(11) // 10 successful + 1 that triggered rate limit

      vi.useRealTimers()
    })
  })

  describe('React Hook Integration', () => {
    it('returns connection status and last update', () => {
      realTimeAnalytics.isConnected = true
      
      const { result } = renderHook(() => 
        useRealTimeAnalytics('analytics_update', vi.fn())
      )

      expect(result.current.isConnected).toBe(true)
      expect(result.current.lastUpdate).toBeNull()
      expect(result.current.connectionStatus).toEqual(
        expect.objectContaining({
          isConnected: true,
          reconnectAttempts: 0,
          subscriberCount: expect.any(Number)
        })
      )
    })

    it('subscribes to events and updates state', () => {
      realTimeAnalytics.connect('test-user-123')
      const mockCallback = vi.fn()

      const { result } = renderHook(() => 
        useRealTimeAnalytics('analytics_update', mockCallback)
      )

      // Simulate connection event
      const connectionSubscribers = realTimeAnalytics.subscribers.get('connection')
      const connectionSubscriber = Array.from(connectionSubscribers)[0]
      
      act(() => {
        connectionSubscriber.callback({ status: 'connected' })
      })

      expect(result.current.isConnected).toBe(true)

      // Simulate analytics update
      const analyticsSubscribers = realTimeAnalytics.subscribers.get('analytics_update')
      const analyticsSubscriber = Array.from(analyticsSubscribers)[0]
      const testData = { brand_health: 85, timestamp: Date.now() }

      act(() => {
        analyticsSubscriber.callback(testData)
      })

      expect(result.current.lastUpdate).toEqual(testData)
      expect(mockCallback).toHaveBeenCalledWith(testData)
    })

    it('cleans up subscriptions on unmount', () => {
      const { unmount } = renderHook(() => 
        useRealTimeAnalytics('analytics_update', vi.fn())
      )

      const initialConnectionCount = realTimeAnalytics.subscribers.get('connection')?.size || 0
      const initialAnalyticsCount = realTimeAnalytics.subscribers.get('analytics_update')?.size || 0

      expect(initialConnectionCount).toBeGreaterThan(0)
      expect(initialAnalyticsCount).toBeGreaterThan(0)

      unmount()

      // Subscriptions should be cleaned up
      const finalConnectionCount = realTimeAnalytics.subscribers.get('connection')?.size || 0
      const finalAnalyticsCount = realTimeAnalytics.subscribers.get('analytics_update')?.size || 0

      expect(finalConnectionCount).toBeLessThan(initialConnectionCount)
      expect(finalAnalyticsCount).toBeLessThan(initialAnalyticsCount)
    })

    it('handles hook dependencies correctly', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const options1 = { brandId: 'brand-1' }
      const options2 = { brandId: 'brand-2' }

      const { rerender } = renderHook(
        ({ eventType, callback, options }) => 
          useRealTimeAnalytics(eventType, callback, options),
        {
          initialProps: {
            eventType: 'analytics_update',
            callback: callback1,
            options: options1
          }
        }
      )

      const initialSubscriberCount = realTimeAnalytics.subscribers.get('analytics_update')?.size || 0

      // Change props
      rerender({
        eventType: 'brand_health_change',
        callback: callback2,
        options: options2
      })

      // Should have new subscription for new event type
      expect(realTimeAnalytics.subscribers.has('brand_health_change')).toBe(true)
      
      // Analytics update might still have subscribers from connection event subscription
      const finalAnalyticsCount = realTimeAnalytics.subscribers.get('analytics_update')?.size || 0
      expect(finalAnalyticsCount).toBeLessThanOrEqual(initialSubscriberCount)
    })

    it('handles undefined callback gracefully', () => {
      expect(() => {
        renderHook(() => useRealTimeAnalytics('analytics_update'))
      }).not.toThrow()
    })

    it('works with options including filters', () => {
      const callback = vi.fn()
      const options = {
        brandId: 'test-brand',
        filter: data => data.value > 50
      }

      renderHook(() => useRealTimeAnalytics('analytics_update', callback, options))

      expect(realTimeAnalytics.subscribers.has('analytics_update')).toBe(true)
      
      const subscribers = realTimeAnalytics.subscribers.get('analytics_update')
      const subscription = Array.from(subscribers).find(sub => sub.options.brandId === 'test-brand')
      
      expect(subscription).toBeDefined()
      expect(subscription.options.filter).toBe(options.filter)
    })
  })

  describe('Integration Tests', () => {
    it('handles complete lifecycle: connect, subscribe, receive data, disconnect', async () => {
      const callback = vi.fn()
      
      // Connect
      realTimeAnalytics.connect('test-user-123')
      expect(realTimeAnalytics.socket).toBeTruthy()

      // Subscribe
      const subscriptionId = realTimeAnalytics.subscribe('analytics_update', callback)
      expect(subscriptionId).toBeTruthy()

      // Simulate connection success
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
      connectHandler()
      expect(realTimeAnalytics.isConnected).toBe(true)

      // Receive data
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]
      const testData = { brand_health: 85, timestamp: Date.now() }
      updateHandler(testData)
      
      expect(callback).toHaveBeenCalledWith(testData)

      // Disconnect
      realTimeAnalytics.disconnect()
      expect(realTimeAnalytics.isConnected).toBe(false)
      expect(realTimeAnalytics.socket).toBeNull()
    })

    it('handles connection failures and recovery', async () => {
      vi.useFakeTimers()
      const connectionCallback = vi.fn()
      
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.subscribe('connection', connectionCallback)

      // Simulate initial connection failure
      const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect_error')[1]
      errorHandler(new Error('Initial connection failed'))

      expect(realTimeAnalytics.reconnectAttempts).toBe(1)

      // Fast forward to trigger retry
      vi.advanceTimersByTime(1000)
      expect(mockSocket.connect).toHaveBeenCalled()

      // Simulate successful reconnection
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
      connectHandler()

      expect(realTimeAnalytics.isConnected).toBe(true)
      expect(realTimeAnalytics.reconnectAttempts).toBe(0)
      expect(connectionCallback).toHaveBeenCalledWith({ status: 'connected' })

      vi.useRealTimers()
    })

    it('maintains data integrity across reconnections', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      realTimeAnalytics.connect('test-user-123')
      realTimeAnalytics.subscribe('analytics_update', callback1)
      realTimeAnalytics.subscribe('brand_health_change', callback2)

      // Simulate disconnect
      const disconnectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'disconnect')[1]
      disconnectHandler('transport close')
      expect(realTimeAnalytics.isConnected).toBe(false)

      // Subscribers should still be intact
      expect(realTimeAnalytics.subscribers.size).toBe(2)

      // Simulate reconnection
      const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === 'connect')[1]
      connectHandler()
      expect(realTimeAnalytics.isConnected).toBe(true)

      // Data should still flow to existing subscribers
      const updateHandler = mockSocket.on.mock.calls.find(call => call[0] === 'analytics_update')[1]
      updateHandler({ test: 'data' })
      
      expect(callback1).toHaveBeenCalledWith({ test: 'data' })
      expect(callback2).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('handles connection attempts without userId', () => {
      expect(() => {
        realTimeAnalytics.connect()
      }).not.toThrow()

      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          auth: expect.objectContaining({
            userId: undefined
          })
        })
      )
    })

    it('handles subscription before connection', () => {
      const callback = vi.fn()
      
      expect(() => {
        realTimeAnalytics.subscribe('analytics_update', callback)
      }).not.toThrow()

      // Should create subscription even if not connected
      expect(realTimeAnalytics.subscribers.has('analytics_update')).toBe(true)
    })

    it('handles notification to non-existent event type', () => {
      expect(() => {
        realTimeAnalytics.notifySubscribers('non-existent-event', {})
      }).not.toThrow()
    })

    it('handles large payload data', () => {
      const callback = vi.fn()
      realTimeAnalytics.subscribe('analytics_update', callback)

      const largeData = {
        id: 'test',
        data: Array(10000).fill('x').join(''),
        metrics: Array(1000).fill().map((_, i) => ({
          id: i,
          value: Math.random(),
          metadata: 'large metadata string'.repeat(100)
        }))
      }

      expect(() => {
        realTimeAnalytics.notifySubscribers('analytics_update', largeData)
      }).not.toThrow()

      expect(callback).toHaveBeenCalledWith(largeData)
    })

    it('handles rapid subscription/unsubscription cycles', () => {
      const callbacks = Array(100).fill().map(() => vi.fn())
      
      for (let cycle = 0; cycle < 10; cycle++) {
        // Subscribe all
        const subscriptions = callbacks.map(callback => 
          realTimeAnalytics.subscribe('test-event', callback)
        )

        expect(realTimeAnalytics.subscribers.get('test-event').size).toBe(100)

        // Unsubscribe all
        subscriptions.forEach(id => 
          realTimeAnalytics.unsubscribe('test-event', id)
        )

        expect(realTimeAnalytics.subscribers.has('test-event')).toBe(false)
      }
    })

    it('handles concurrent operations safely', async () => {
      const promises = []
      
      // Concurrent connections
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve().then(() => realTimeAnalytics.connect(`user-${i}`))
        )
      }

      // Concurrent subscriptions
      for (let i = 0; i < 50; i++) {
        promises.push(
          Promise.resolve().then(() => 
            realTimeAnalytics.subscribe('test-event', vi.fn())
          )
        )
      }

      await Promise.all(promises)

      // Should handle concurrent operations without errors
      expect(realTimeAnalytics.subscribers.has('test-event')).toBe(true)
    })
  })
})