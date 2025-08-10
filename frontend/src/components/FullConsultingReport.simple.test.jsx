/**
 * Simple FullConsultingReport Tests
 * Basic tests to establish testing foundation
 */
import { describe, it, expect } from 'vitest'
import { screen } from '@testing-library/react'
import { renderWithProviders, mockAnalysisResults, mockBrandData } from '../test-utils/simple.jsx'
import FullConsultingReport from './FullConsultingReport'

describe('FullConsultingReport - Basic Tests', () => {
  const defaultProps = {
    analysisResults: mockAnalysisResults,
    brandName: mockBrandData.name,
    onExportComplete: () => {},
    onNewAnalysis: () => {}
  }

  it('renders without crashing', () => {
    expect(() => {
      renderWithProviders(<FullConsultingReport {...defaultProps} />)
    }).not.toThrow()
  })

  it('displays brand reference in header', () => {
    renderWithProviders(<FullConsultingReport {...defaultProps} />)
    // The component displays "Brand Strategic Analysis" as header
    expect(screen.getByText('Brand Strategic Analysis')).toBeInTheDocument()
  })

  it('shows report title', () => {
    renderWithProviders(<FullConsultingReport {...defaultProps} />)
    expect(screen.getByText(/brand strategic analysis/i)).toBeInTheDocument()
  })

  it('displays health score when available', () => {
    renderWithProviders(<FullConsultingReport {...defaultProps} />)
    expect(screen.getByText('78')).toBeInTheDocument()
  })

  it('handles missing data gracefully', () => {
    const propsWithoutData = {
      ...defaultProps,
      analysisResults: null
    }
    
    expect(() => {
      renderWithProviders(<FullConsultingReport {...propsWithoutData} />)
    }).not.toThrow()
  })

  it('renders main sections', () => {
    renderWithProviders(<FullConsultingReport {...defaultProps} />)
    
    // Check for key report sections that exist in the component
    expect(screen.getByRole('heading', { name: /executive summary/i })).toBeInTheDocument()
    expect(screen.getByText(/brand health assessment/i)).toBeInTheDocument()
  })

  it('shows strategic recommendations when expanded', () => {
    renderWithProviders(<FullConsultingReport {...defaultProps} />)
    // Strategic opportunities section should be visible
    expect(screen.getByText(/strategic opportunities/i)).toBeInTheDocument()
  })

  it('displays competitive information section', () => {
    renderWithProviders(<FullConsultingReport {...defaultProps} />)
    // Look for competitive landscape section 
    expect(screen.getByText(/competitive landscape/i)).toBeInTheDocument()
  })
})