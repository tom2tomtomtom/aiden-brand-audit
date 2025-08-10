/**
 * AdvancedAnalyticsDashboard Component Tests
 * Performance-critical component tests (839KB chunk)
 * Focus on performance, user interactions, and data visualization
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { screen, waitFor, fireEvent, act } from '@testing-library/react'
import { renderWithProviders, generateMockAnalyticsData, measureRenderTime } from '../../test-utils'
import AdvancedAnalyticsDashboard from './AdvancedAnalyticsDashboard'

// Mock chart libraries to prevent rendering issues in tests
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }) => <div data-testid="line-chart" {...props}>{children}</div>,
  BarChart: ({ children, ...props }) => <div data-testid="bar-chart" {...props}>{children}</div>,
  PieChart: ({ children, ...props }) => <div data-testid="pie-chart" {...props}>{children}</div>,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Cell: () => <div data-testid="cell" />,
  ResponsiveContainer: ({ children }) => <div data-testid="responsive-container">{children}</div>
}))

// Mock framer-motion to prevent animation issues
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
    span: ({ children, ...props }) => <span {...props}>{children}</span>
  },
  AnimatePresence: ({ children }) => <>{children}</>
}))

describe('AdvancedAnalyticsDashboard', () => {
  const mockAnalyticsData = generateMockAnalyticsData()
  
  const defaultProps = {
    brandName: 'Test Brand',
    analyticsData: mockAnalyticsData,
    onDataUpdate: vi.fn(),
    onExport: vi.fn(),
    onRefresh: vi.fn(),
    filters: {
      dateRange: '30d',
      metrics: ['brand_health', 'engagement'],
      compareMode: false
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('Performance Tests', () => {
    it('renders within performance threshold', async () => {
      const { renderTime } = await measureRenderTime(() =>
        renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      )
      
      // Critical: Should render large analytics component within 1.5s
      expect(renderTime).toBeLessThan(1500)
    })

    it('handles large datasets efficiently', async () => {
      const largeDataset = {
        ...mockAnalyticsData,
        metrics: {
          ...mockAnalyticsData.metrics,
          // Simulate large dataset
          detailedMetrics: Array.from({ length: 1000 }, (_, i) => ({
            timestamp: Date.now() - i * 86400000,
            value: Math.random() * 100
          }))
        }
      }

      const propsWithLargeData = { 
        ...defaultProps, 
        analyticsData: largeDataset 
      }

      const { renderTime } = await measureRenderTime(() =>
        renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithLargeData} />)
      )

      // Should handle large datasets within reasonable time
      expect(renderTime).toBeLessThan(2000)
    })

    it('lazy loads chart components', async () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Charts should not be rendered until tabs are active
      expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument()
      
      // Click on a tab to activate charts
      const trendsTab = screen.getByRole('tab', { name: /trends/i })
      fireEvent.click(trendsTab)
      
      await waitFor(() => {
        expect(screen.getByTestId('line-chart')).toBeInTheDocument()
      })
    })

    it('debounces data updates to prevent excessive re-renders', async () => {
      const onDataUpdateSpy = vi.fn()
      const propsWithSpy = { 
        ...defaultProps, 
        onDataUpdate: onDataUpdateSpy 
      }

      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithSpy} />)
      
      // Simulate rapid data updates
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      
      fireEvent.click(refreshButton)
      fireEvent.click(refreshButton)
      fireEvent.click(refreshButton)
      
      // Should be debounced
      act(() => {
        vi.advanceTimersByTime(500)
      })
      
      expect(onDataUpdateSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('Rendering and Layout', () => {
    it('renders main dashboard elements', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Test Brand')).toBeInTheDocument()
      expect(screen.getByRole('tablist')).toBeInTheDocument()
    })

    it('displays key metrics cards', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Check for metric displays
      expect(screen.getByText('10,000')).toBeInTheDocument() // pageViews
      expect(screen.getByText('7,500')).toBeInTheDocument() // uniqueVisitors
      expect(screen.getByText('3.2%')).toBeInTheDocument() // conversionRate
    })

    it('shows loading state when data is being fetched', () => {
      const propsWithoutData = { 
        ...defaultProps, 
        analyticsData: null 
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithoutData} />)
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('adapts to different screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Should show mobile-optimized layout
      const mobileContainer = screen.getByTestId('mobile-dashboard')
      expect(mobileContainer).toBeInTheDocument()
    })
  })

  describe('Interactive Features', () => {
    it('switches between tabs correctly', async () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Click on different tabs
      const overviewTab = screen.getByRole('tab', { name: /overview/i })
      const trendsTab = screen.getByRole('tab', { name: /trends/i })
      const competitorsTab = screen.getByRole('tab', { name: /competitors/i })
      
      // Start with overview
      expect(overviewTab).toHaveAttribute('aria-selected', 'true')
      
      // Switch to trends
      fireEvent.click(trendsTab)
      await waitFor(() => {
        expect(trendsTab).toHaveAttribute('aria-selected', 'true')
      })
      
      // Switch to competitors
      fireEvent.click(competitorsTab)
      await waitFor(() => {
        expect(competitorsTab).toHaveAttribute('aria-selected', 'true')
      })
    })

    it('handles filter changes', async () => {
      const onDataUpdateMock = vi.fn()
      const propsWithMock = { 
        ...defaultProps, 
        onDataUpdate: onDataUpdateMock 
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithMock} />)
      
      // Change date range filter
      const dateRangeSelect = screen.getByRole('combobox', { name: /date range/i })
      fireEvent.change(dateRangeSelect, { target: { value: '7d' } })
      
      await waitFor(() => {
        expect(onDataUpdateMock).toHaveBeenCalledWith(
          expect.objectContaining({
            dateRange: '7d'
          })
        )
      })
    })

    it('triggers export functionality', async () => {
      const onExportMock = vi.fn()
      const propsWithExportMock = { 
        ...defaultProps, 
        onExport: onExportMock 
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithExportMock} />)
      
      const exportButton = screen.getByRole('button', { name: /export/i })
      fireEvent.click(exportButton)
      
      // Should show export options
      const pdfExportButton = screen.getByRole('button', { name: /pdf/i })
      fireEvent.click(pdfExportButton)
      
      expect(onExportMock).toHaveBeenCalledWith('pdf', expect.any(Object))
    })

    it('refreshes data when refresh button is clicked', async () => {
      const onRefreshMock = vi.fn()
      const propsWithRefreshMock = { 
        ...defaultProps, 
        onRefresh: onRefreshMock 
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithRefreshMock} />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)
      
      expect(onRefreshMock).toHaveBeenCalledTimes(1)
    })
  })

  describe('Chart Interactions', () => {
    it('handles chart drill-down actions', async () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Navigate to trends tab to show charts
      const trendsTab = screen.getByRole('tab', { name: /trends/i })
      fireEvent.click(trendsTab)
      
      await waitFor(() => {
        const chartElement = screen.getByTestId('line-chart')
        expect(chartElement).toBeInTheDocument()
        
        // Simulate chart click (drill-down)
        fireEvent.click(chartElement)
      })
      
      // Should show detailed view or drill-down data
      expect(screen.getByText(/detailed view/i)).toBeInTheDocument()
    })

    it('shows chart tooltips on hover', async () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      const trendsTab = screen.getByRole('tab', { name: /trends/i })
      fireEvent.click(trendsTab)
      
      await waitFor(() => {
        const chartElement = screen.getByTestId('line-chart')
        fireEvent.mouseEnter(chartElement)
      })
      
      // Tooltip should be rendered
      expect(screen.getByTestId('tooltip')).toBeInTheDocument()
    })

    it('handles chart zoom and pan interactions', async () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      const trendsTab = screen.getByRole('tab', { name: /trends/i })
      fireEvent.click(trendsTab)
      
      await waitFor(() => {
        const chartContainer = screen.getByTestId('responsive-container')
        
        // Simulate zoom gesture
        fireEvent.wheel(chartContainer, { deltaY: -100, ctrlKey: true })
      })
      
      // Should maintain chart functionality
      expect(screen.getByTestId('line-chart')).toBeInTheDocument()
    })
  })

  describe('Real-time Updates', () => {
    it('handles real-time data updates', async () => {
      const { rerender } = renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Simulate new data coming in
      const updatedData = {
        ...mockAnalyticsData,
        metrics: {
          ...mockAnalyticsData.metrics,
          pageViews: 12000, // Updated value
        }
      }
      
      const updatedProps = { 
        ...defaultProps, 
        analyticsData: updatedData 
      }
      
      rerender(<AdvancedAnalyticsDashboard {...updatedProps} />)
      
      // Should show updated metrics
      await waitFor(() => {
        expect(screen.getByText('12,000')).toBeInTheDocument()
      })
    })

    it('shows connection status for real-time data', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Should show connection indicator
      const connectionStatus = screen.getByTestId('connection-status')
      expect(connectionStatus).toHaveAttribute('data-status', 'connected')
    })

    it('handles connection loss gracefully', async () => {
      const propsWithConnectionIssue = {
        ...defaultProps,
        connectionStatus: 'disconnected'
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithConnectionIssue} />)
      
      // Should show offline indicator
      expect(screen.getByText(/connection lost/i)).toBeInTheDocument()
      
      // Should still show cached data
      expect(screen.getByText('10,000')).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('handles API errors gracefully', () => {
      const propsWithError = {
        ...defaultProps,
        error: 'Failed to load analytics data'
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithError} />)
      
      expect(screen.getByText(/failed to load analytics data/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('shows fallback content when charts fail to render', () => {
      // Mock chart rendering error
      vi.mocked(screen.getByTestId).mockImplementation((testId) => {
        if (testId.includes('chart')) {
          throw new Error('Chart rendering failed')
        }
        return document.createElement('div')
      })
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      const trendsTab = screen.getByRole('tab', { name: /trends/i })
      fireEvent.click(trendsTab)
      
      // Should show fallback table view
      expect(screen.getByText(/table view/i)).toBeInTheDocument()
    })

    it('validates data integrity', () => {
      const invalidData = {
        metrics: {
          pageViews: 'invalid-number',
          conversionRate: null
        }
      }
      
      const propsWithInvalidData = { 
        ...defaultProps, 
        analyticsData: invalidData 
      }
      
      renderWithProviders(<AdvancedAnalyticsDashboard {...propsWithInvalidData} />)
      
      // Should show data validation errors
      expect(screen.getByText(/data validation error/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      const dashboard = screen.getByRole('main')
      expect(dashboard).toHaveAttribute('aria-label', expect.stringMatching(/analytics dashboard/i))
      
      const tablist = screen.getByRole('tablist')
      expect(tablist).toHaveAttribute('aria-label', expect.stringMatching(/analytics sections/i))
    })

    it('supports keyboard navigation', () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      const firstTab = screen.getAllByRole('tab')[0]
      firstTab.focus()
      
      // Should be focusable
      expect(firstTab).toHaveFocus()
      
      // Arrow keys should navigate between tabs
      fireEvent.keyDown(firstTab, { key: 'ArrowRight' })
      
      const secondTab = screen.getAllByRole('tab')[1]
      expect(secondTab).toHaveFocus()
    })

    it('provides screen reader announcements for data updates', async () => {
      renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      const refreshButton = screen.getByRole('button', { name: /refresh/i })
      fireEvent.click(refreshButton)
      
      // Should announce data refresh to screen readers
      await waitFor(() => {
        const announcement = screen.getByRole('status', { hidden: true })
        expect(announcement).toHaveTextContent(/data refreshed/i)
      })
    })
  })

  describe('Memory Management', () => {
    it('cleans up event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener')
      
      const { unmount } = renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      unmount()
      
      // Should clean up resize and other event listeners
      expect(removeEventListenerSpy).toHaveBeenCalled()
    })

    it('cancels pending requests on unmount', () => {
      const abortControllerSpy = vi.spyOn(AbortController.prototype, 'abort')
      
      const { unmount } = renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      unmount()
      
      // Should abort any pending requests
      expect(abortControllerSpy).toHaveBeenCalled()
    })

    it('handles rapid prop changes without memory leaks', () => {
      const { rerender } = renderWithProviders(<AdvancedAnalyticsDashboard {...defaultProps} />)
      
      // Simulate rapid prop changes (e.g., real-time updates)
      for (let i = 0; i < 100; i++) {
        const updatedProps = {
          ...defaultProps,
          analyticsData: {
            ...mockAnalyticsData,
            metrics: {
              ...mockAnalyticsData.metrics,
              pageViews: 10000 + i
            }
          }
        }
        rerender(<AdvancedAnalyticsDashboard {...updatedProps} />)
      }
      
      // Component should still be responsive
      expect(screen.getByText('Advanced Analytics Dashboard')).toBeInTheDocument()
    })
  })
})