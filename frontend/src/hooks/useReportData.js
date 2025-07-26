/**
 * Custom hook for report data transformation and processing
 * Extracted from FullConsultingReport to improve maintainability and testability
 */

import { useMemo } from 'react'

const useReportData = (analysisResults) => {
  // Extract and process LLM sections
  const llmSections = useMemo(() => {
    return analysisResults?.parsed_sections || analysisResults?.llm_sections || {}
  }, [analysisResults])

  // Process key metrics with defaults
  const keyMetrics = useMemo(() => {
    const metrics = analysisResults?.key_metrics || {}
    return {
      brandHealth: metrics.brand_health || 0,
      marketPosition: metrics.market_position || 0,
      digitalPresence: metrics.digital_presence || 0,
      competitiveStrength: metrics.competitive_strength || 0,
      customerSentiment: metrics.customer_sentiment || 0,
      ...metrics
    }
  }, [analysisResults])

  // Process actionable insights with validation
  const insights = useMemo(() => {
    const rawInsights = analysisResults?.actionable_insights || []
    return rawInsights.filter(insight => 
      insight && insight.finding && insight.recommendation
    ).map((insight, index) => ({
      id: `insight-${index}`,
      priority: insight.priority || 'Medium',
      timeline: insight.timeline || 'Short-term',
      effort: insight.effort || 'Medium',
      finding: insight.finding,
      impact: insight.impact || '',
      recommendation: insight.recommendation,
      category: insight.category || 'General'
    }))
  }, [analysisResults])

  // Process competitive data
  const competitiveData = useMemo(() => {
    const competitors = analysisResults?.competitive_analysis?.competitors || []
    return competitors.map((competitor, index) => ({
      id: `competitor-${index}`,
      name: competitor.name || 'Unknown Competitor',
      marketShare: competitor.market_share || 0,
      strengths: competitor.strengths || [],
      weaknesses: competitor.weaknesses || [],
      positioning: competitor.positioning || '',
      digitalPresence: competitor.digital_presence || 0
    }))
  }, [analysisResults])

  // Process visual assets data
  const visualAssets = useMemo(() => {
    const assets = analysisResults?.visual_analysis || {}
    return {
      colorPalette: assets.color_palette || [],
      logos: assets.logos || [],
      screenshots: assets.screenshots || [],
      brandConsistency: assets.brand_consistency || 0,
      visualStyle: assets.visual_style || 'Not analyzed'
    }
  }, [analysisResults])

  // Navigation structure for the report
  const reportSections = useMemo(() => [
    { 
      id: 'executive', 
      title: 'Executive Summary', 
      pages: '1-2 pages',
      hasContent: Boolean(llmSections.executive_summary)
    },
    { 
      id: 'brand-health', 
      title: 'Brand Health Assessment', 
      pages: '3-4 pages',
      hasContent: Boolean(llmSections.brand_equity_assessment)
    },
    { 
      id: 'competitive', 
      title: 'Competitive Landscape', 
      pages: '4-5 pages',
      hasContent: Boolean(llmSections.competitive_analysis)
    },
    { 
      id: 'market-trends', 
      title: 'Market Context & Trends', 
      pages: '2-3 pages',
      hasContent: Boolean(llmSections.market_analysis)
    },
    { 
      id: 'opportunities', 
      title: 'Strategic Opportunities', 
      pages: '2-3 pages',
      hasContent: Boolean(llmSections.strategic_recommendations)
    },
    { 
      id: 'digital', 
      title: 'Digital Intelligence', 
      pages: '2-3 pages',
      hasContent: Boolean(llmSections.digital_analysis)
    },
    { 
      id: 'insights', 
      title: 'Key Insights & Recommendations', 
      pages: '2-3 pages',
      hasContent: insights.length > 0
    },
    { 
      id: 'appendix', 
      title: 'Appendix & Data Sources', 
      pages: 'Reference',
      hasContent: true
    }
  ], [llmSections, insights.length])

  // Calculate report completeness
  const reportCompleteness = useMemo(() => {
    const sectionsWithContent = reportSections.filter(section => section.hasContent).length
    return Math.round((sectionsWithContent / reportSections.length) * 100)
  }, [reportSections])

  // Brand name extraction
  const brandName = useMemo(() => {
    return analysisResults?.brand_name || 
           analysisResults?.company_name || 
           'Unknown Brand'
  }, [analysisResults])

  return {
    // Raw data
    llmSections,
    
    // Processed data
    keyMetrics,
    insights,
    competitiveData,
    visualAssets,
    reportSections,
    
    // Computed values
    reportCompleteness,
    brandName,
    
    // Helper functions
    getSectionContent: (sectionId) => llmSections[`${sectionId}_summary`] || llmSections[sectionId] || '',
    hasSection: (sectionId) => Boolean(llmSections[sectionId] || llmSections[`${sectionId}_summary`]),
    getMetricColor: (value) => {
      if (value >= 70) return 'text-green-600'
      if (value >= 40) return 'text-yellow-600'
      return 'text-red-600'
    },
    getPriorityVariant: (priority) => {
      switch (priority.toLowerCase()) {
        case 'high': return 'destructive'
        case 'medium': return 'default'
        case 'low': return 'secondary'
        default: return 'outline'
      }
    }
  }
}

export default useReportData