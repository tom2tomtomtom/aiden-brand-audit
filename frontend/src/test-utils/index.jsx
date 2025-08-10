/**
 * Testing Utilities
 * Enhanced render functions and test helpers for comprehensive testing
 */
import { render, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { ErrorProvider } from '../components/ErrorHandling/ErrorContext'

// Mock data for testing
export const mockAnalysisResults = {
  api_responses: {
    llm_analysis: {
      analysis: 'This is a mock analysis for testing purposes. The brand shows strong market positioning with clear value propositions.'
    }
  },
  competitor_analysis: {
    competitors_identified: {
      competitors: [
        { id: 'comp-1', name: 'Test Competitor 1', market_share: 25 },
        { id: 'comp-2', name: 'Test Competitor 2', market_share: 18 }
      ]
    }
  },
  campaign_analysis: {
    campaigns_discovered: {
      campaigns: [
        { id: 'camp-1', name: 'Test Campaign 1', engagement: 75 }
      ]
    }
  },
  strategic_synthesis: {
    strategic_recommendations: [
      'Recommendation 1: Focus on digital transformation',
      'Recommendation 2: Expand into emerging markets'
    ]
  },
  visual_analysis: {
    color_palette: ['#FF0000', '#00FF00', '#0000FF'],
    dominant_colors: [
      { color: '#FF0000', percentage: 45 },
      { color: '#00FF00', percentage: 30 },
      { color: '#0000FF', percentage: 25 }
    ],
    screenshots_captured: 5,
    logos_found: 3
  },
  key_metrics: {
    brand_health_score: 78,
    competitive_strength: 85,
    market_presence: 72
  },
  data_sources: {
    news_articles: 150,
    social_mentions: 2340,
    competitor_data: 25
  }
}

// Mock brand data
export const mockBrandData = {
  name: 'Test Brand',
  industry: 'Technology',
  website: 'https://testbrand.com',
  description: 'A test brand for comprehensive testing'
}

// Enhanced render function with providers
export const renderWithProviders = (ui, options = {}) => {
  const {
    initialEntries = ['/'],
    errorProviderProps = {},
    ...renderOptions
  } = options

  const Wrapper = ({ children }) => (
    <ErrorProvider {...errorProviderProps}>
      <BrowserRouter>
        {children}
      </BrowserRouter>
    </ErrorProvider>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    // Additional utilities can be returned here
  }
}

// Mock API response helper
export const createMockApiResponse = (data, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => data,
  text: async () => JSON.stringify(data)
})

// Component testing utilities
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react')
  await waitFor(() => {
    expect(document.querySelector('[data-testid="loading"]')).not.toBeInTheDocument()
  }, { timeout: 5000 })
}

// Performance testing helper
export const measureRenderTime = async (renderFn) => {
  const startTime = performance.now()
  const result = await renderFn()
  const endTime = performance.now()
  return {
    ...result,
    renderTime: endTime - startTime
  }
}

// Mock localStorage for tests
export const mockLocalStorage = () => {
  let store = {}
  
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString()
    }),
    removeItem: vi.fn(key => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    })
  }
}

// Mock WebSocket for real-time testing
export const mockWebSocket = () => {
  const mockWs = {
    send: vi.fn(),
    close: vi.fn(),
    readyState: WebSocket.OPEN,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
  
  global.WebSocket = vi.fn(() => mockWs)
  return mockWs
}

// Test data generators
export const generateMockAnalyticsData = (overrides = {}) => ({
  metrics: {
    pageViews: 10000,
    uniqueVisitors: 7500,
    conversionRate: 3.2,
    bounceRate: 45.6,
    avgSessionDuration: '4:23',
    ...overrides.metrics
  },
  trends: {
    growth: 15.7,
    engagement: 68.4,
    retention: 82.1,
    ...overrides.trends
  },
  competitors: [
    { name: 'Competitor A', score: 85 },
    { name: 'Competitor B', score: 78 },
    { name: 'Competitor C', score: 72 },
    ...(overrides.competitors || [])
  ]
})

// Error testing utilities
export const simulateApiError = (status = 500, message = 'Internal Server Error') => {
  const error = new Error(message)
  error.response = { status, statusText: message }
  return error
}

export const simulateNetworkError = () => {
  const error = new Error('Network Error')
  error.code = 'NETWORK_ERROR'
  return error
}

// Export all utilities
export * from '@testing-library/react'

// Simple userEvent fallback using fireEvent
export const userEvent = {
  click: (element) => fireEvent.click(element),
  type: (element, text) => fireEvent.change(element, { target: { value: text } }),
  hover: (element) => fireEvent.mouseEnter(element),
  keyboard: (keys) => console.log('keyboard interaction:', keys),
  setup: () => ({
    click: (element) => fireEvent.click(element),
    type: (element, text) => fireEvent.change(element, { target: { value: text } }),
    hover: (element) => fireEvent.mouseEnter(element),
  })
}