/**
 * Simplified Testing Utilities
 * Basic utilities without external dependencies
 */
import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'

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
  strategic_synthesis: {
    strategic_recommendations: [
      'Recommendation 1: Focus on digital transformation',
      'Recommendation 2: Expand into emerging markets'
    ]
  },
  visual_analysis: {
    screenshots_captured: 5,
    logos_found: 3
  },
  key_metrics: {
    brand_health_score: 78,
    competitive_strength: 85,
    market_presence: 72
  }
}

// Mock brand data
export const mockBrandData = {
  name: 'Test Brand',
  industry: 'Technology',
  website: 'https://testbrand.com',
  description: 'A test brand for comprehensive testing'
}

// Simple render function with Router
export const renderWithProviders = (ui, options = {}) => {
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )

  return render(ui, { wrapper: Wrapper, ...options })
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

// Re-export testing library functions
export * from '@testing-library/react'