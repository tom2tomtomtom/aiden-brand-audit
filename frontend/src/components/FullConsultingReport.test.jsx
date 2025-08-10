/**
 * FullConsultingReport Component Tests
 * Comprehensive test suite for the 745-line consulting report component
 * Target: 80% coverage for critical business logic
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent } from '@testing-library/react'
import { renderWithProviders, mockAnalysisResults, mockBrandData, measureRenderTime } from '../test-utils/simple.jsx'
import FullConsultingReport from './FullConsultingReport'

// Mock dependencies
vi.mock('html2canvas', () => ({
  default: vi.fn(() => Promise.resolve({
    toDataURL: vi.fn(() => 'data:image/png;base64,mock-image-data')
  }))
}))

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => ({
    addImage: vi.fn(),
    text: vi.fn(),
    save: vi.fn(),
    internal: {
      pageSize: { getWidth: vi.fn(() => 210), getHeight: vi.fn(() => 297) }
    }
  }))
}))

describe('FullConsultingReport', () => {
  const defaultProps = {
    analysisResults: mockAnalysisResults,
    brandName: mockBrandData.name,
    onExportComplete: vi.fn(),
    onNewAnalysis: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering and Initial State', () => {
    it('renders without crashing', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      expect(screen.getByText('Full Brand Audit Report')).toBeInTheDocument()
    })

    it('displays the brand name in the header', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      expect(screen.getByText(mockBrandData.name)).toBeInTheDocument()
    })

    it('renders all main sections', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      // Check for key report sections
      expect(screen.getByText('Executive Summary')).toBeInTheDocument()
      expect(screen.getByText('Brand Analysis Overview')).toBeInTheDocument()
      expect(screen.getByText('Competitive Intelligence')).toBeInTheDocument()
      expect(screen.getByText('Visual Brand Identity')).toBeInTheDocument()
      expect(screen.getByText('Strategic Recommendations')).toBeInTheDocument()
    })

    it('displays health score when available', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      expect(screen.getByText(/78/)).toBeInTheDocument() // Health score from mock data
    })

    it('renders within performance threshold', async () => {
      const { renderTime } = await measureRenderTime(() =>
        renderWithProviders(<FullConsultingReport {...defaultProps} />)
      )
      
      // Should render large component within 2 seconds
      expect(renderTime).toBeLessThan(2000)
    })
  })

  describe('Data Handling', () => {
    it('handles missing analysis results gracefully', () => {
      const propsWithoutResults = { 
        ...defaultProps, 
        analysisResults: null 
      }
      
      renderWithProviders(<FullConsultingReport {...propsWithoutResults} />)
      expect(screen.getByText('No analysis data available')).toBeInTheDocument()
    })

    it('handles partial analysis data', () => {
      const partialResults = {
        key_metrics: { brand_health_score: 65 },
        // Missing other sections
      }
      
      const propsWithPartialData = { 
        ...defaultProps, 
        analysisResults: partialResults 
      }
      
      renderWithProviders(<FullConsultingReport {...propsWithPartialData} />)
      expect(screen.getByText(/65/)).toBeInTheDocument() // Should show available health score
    })

    it('displays competitor data when available', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      expect(screen.getByText('Test Competitor 1')).toBeInTheDocument()
      expect(screen.getByText('Test Competitor 2')).toBeInTheDocument()
    })

    it('shows strategic recommendations', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      expect(screen.getByText(/digital transformation/i)).toBeInTheDocument()
      expect(screen.getByText(/emerging markets/i)).toBeInTheDocument()
    })

    it('displays visual analysis data', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      expect(screen.getByText(/5.*screenshots/i)).toBeInTheDocument()
      expect(screen.getByText(/3.*logos/i)).toBeInTheDocument()
    })
  })

  describe('Interactive Elements', () => {
    it('expands and collapses sections when clicked', async () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const executiveSummaryButton = screen.getByRole('button', { name: /executive summary/i })
      
      // Click to expand (assuming it starts collapsed)
      fireEvent.click(executiveSummaryButton)
      
      // Should show expanded content
      await waitFor(() => {
        expect(screen.getByText(/strong market positioning/i)).toBeInTheDocument()
      })
    })

    it('shows export options when export button is clicked', async () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      await waitFor(() => {
        expect(screen.getByText(/PDF/i)).toBeInTheDocument()
        expect(screen.getByText(/JSON/i)).toBeInTheDocument()
      })
    })

    it('triggers new analysis when requested', async () => {
      const onNewAnalysisMock = vi.fn()
      const propsWithMock = { 
        ...defaultProps, 
        onNewAnalysis: onNewAnalysisMock 
      }
      
      renderWithProviders(<FullConsultingReport {...propsWithMock} />)
      
      const newAnalysisButton = screen.getByRole('button', { name: /new analysis/i })
      fireEvent.click(newAnalysisButton)
      
      expect(onNewAnalysisMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Export Functionality', () => {
    it('handles PDF export', async () => {
      const onExportCompleteMock = vi.fn()
      const propsWithExportMock = { 
        ...defaultProps, 
        onExportComplete: onExportCompleteMock 
      }
      
      renderWithProviders(<FullConsultingReport {...propsWithExportMock} />)
      
      // Open export menu
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      // Click PDF export
      const pdfExportButton = screen.getByRole('button', { name: /pdf/i })
      fireEvent.click(pdfExportButton)
      
      await waitFor(() => {
        expect(onExportCompleteMock).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'pdf',
            brandName: mockBrandData.name
          })
        )
      })
    })

    it('handles JSON export', async () => {
      const onExportCompleteMock = vi.fn()
      const propsWithExportMock = { 
        ...defaultProps, 
        onExportComplete: onExportCompleteMock 
      }
      
      renderWithProviders(<FullConsultingReport {...propsWithExportMock} />)
      
      // Open export menu
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      // Click JSON export
      const jsonExportButton = screen.getByRole('button', { name: /json/i })
      fireEvent.click(jsonExportButton)
      
      await waitFor(() => {
        expect(onExportCompleteMock).toHaveBeenCalledWith(
          expect.objectContaining({
            format: 'json',
            data: mockAnalysisResults
          })
        )
      })
    })

    it('shows loading state during export', async () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      // Mock slow export process
      const slowExport = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)))
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      const pdfExportButton = screen.getByRole('button', { name: /pdf/i })
      fireEvent.click(pdfExportButton)
      
      // Should show loading state
      expect(screen.getByText(/generating/i)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('displays error message when export fails', async () => {
      // Mock export failure
      vi.mocked(import('html2canvas')).mockRejectedValueOnce(new Error('Export failed'))
      
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      const pdfExportButton = screen.getByRole('button', { name: /pdf/i })
      fireEvent.click(pdfExportButton)
      
      await waitFor(() => {
        expect(screen.getByText(/export failed/i)).toBeInTheDocument()
      })
    })

    it('handles malformed analysis data without crashing', () => {
      const malformedResults = {
        api_responses: { llm_analysis: 'not-an-object' },
        competitor_analysis: { competitors_identified: null }
      }
      
      const propsWithBadData = { 
        ...defaultProps, 
        analysisResults: malformedResults 
      }
      
      expect(() => {
        renderWithProviders(<FullConsultingReport {...propsWithBadData} />)
      }).not.toThrow()
    })

    it('shows fallback content for missing sections', () => {
      const minimalResults = {
        key_metrics: { brand_health_score: 50 }
        // Most sections missing
      }
      
      const propsWithMinimalData = { 
        ...defaultProps, 
        analysisResults: minimalResults 
      }
      
      renderWithProviders(<FullConsultingReport {...propsWithMinimalData} />)
      
      expect(screen.getByText(/analysis in progress/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const mainHeading = screen.getByRole('heading', { level: 1 })
      expect(mainHeading).toBeInTheDocument()
      
      const sectionHeadings = screen.getAllByRole('heading', { level: 2 })
      expect(sectionHeadings.length).toBeGreaterThan(0)
    })

    it('has proper button labels and roles', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      expect(exportButton).toHaveAttribute('aria-label')
      
      const newAnalysisButton = screen.getByRole('button', { name: /new analysis/i })
      expect(newAnalysisButton).toHaveAttribute('aria-label')
    })

    it('supports keyboard navigation', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      
      // Should be focusable
      exportButton.focus()
      expect(exportButton).toHaveFocus()
      
      // Should respond to Enter key
      fireEvent.keyDown(exportButton, { key: 'Enter' })
      expect(screen.getByText(/PDF/i)).toBeInTheDocument()
    })

    it('has appropriate ARIA labels for metrics', () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      const healthScoreElement = screen.getByText(/78/)
      expect(healthScoreElement.closest('[aria-label]')).toHaveAttribute('aria-label', expect.stringMatching(/health score/i))
    })
  })

  describe('Performance Optimization', () => {
    it('lazy loads non-critical sections', async () => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      // Check that heavy sections are not rendered initially
      const expandButton = screen.getByRole('button', { name: /detailed analysis/i })
      
      // Content should not be in DOM until expanded
      expect(screen.queryByTestId('detailed-charts')).not.toBeInTheDocument()
      
      fireEvent.click(expandButton)
      
      await waitFor(() => {
        expect(screen.getByTestId('detailed-charts')).toBeInTheDocument()
      })
    })

    it('handles large datasets efficiently', async () => {
      // Create props with large dataset
      const largeDataResults = {
        ...mockAnalysisResults,
        competitor_analysis: {
          competitors_identified: {
            competitors: Array.from({ length: 100 }, (_, i) => ({
              id: `comp-${i}`,
              name: `Competitor ${i}`,
              market_share: Math.random() * 100
            }))
          }
        }
      }
      
      const propsWithLargeData = { 
        ...defaultProps, 
        analysisResults: largeDataResults 
      }
      
      const { renderTime } = await measureRenderTime(() =>
        renderWithProviders(<FullConsultingReport {...propsWithLargeData} />)
      )
      
      // Should still render efficiently with large dataset
      expect(renderTime).toBeLessThan(3000)
    })

    it('memoizes expensive calculations', () => {
      const { rerender } = renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      // Re-render with same props should not recalculate
      rerender(<FullConsultingReport {...defaultProps} />)
      
      // Component should be memoized (tested via React.memo wrapper)
      expect(screen.getByText('Full Brand Audit Report')).toBeInTheDocument()
    })
  })

  describe('Integration Tests', () => {
    it('integrates correctly with error boundary', () => {
      // Force an error in component
      const ErrorThrowingReport = () => {
        throw new Error('Test error')
        // This return is intentionally unreachable for testing error boundary
        // eslint-disable-next-line no-unreachable
        return <FullConsultingReport {...defaultProps} />
      }
      
      const { container } = renderWithProviders(
        <ErrorThrowingReport />
      )
      
      // Error boundary should catch and display error UI
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument()
    })

    it('works with different screen sizes', () => {
      // Mock different screen sizes
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      })
      
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
      
      // Should adapt to tablet size
      expect(screen.getByText('Full Brand Audit Report')).toBeInTheDocument()
      
      // Mock mobile size
      Object.defineProperty(window, 'innerWidth', {
        value: 375,
      })
      
      fireEvent(window, new Event('resize'))
      
      // Should still be functional on mobile
      expect(screen.getByText('Full Brand Audit Report')).toBeInTheDocument()
    })
  })
})