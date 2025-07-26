/**
 * Brand Health Assessment Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { TrendingUp, Users, Eye, Target } from 'lucide-react'

const BrandHealthAssessment = ({ 
  llmSections, 
  keyMetrics, 
  visualAssets,
  getMetricColor 
}) => {
  const brandEquityContent = llmSections.brand_equity_assessment || 
                            llmSections.brand_health_assessment || 
                            'Brand health assessment content not available'
  
  const brandPositioning = llmSections.brand_positioning_analysis || ''

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Brand Health Assessment</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>Comprehensive analysis of current brand awareness, perception metrics, brand equity snapshot, 
          customer sentiment analysis, and brand touchpoint audit</em>
        </p>
      </div>

      {/* Brand Awareness and Perception Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Current Brand Awareness and Perception Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-blue-800">
              Data Sources: Google Trends, SEMrush/Ahrefs, SimilarWeb, Survey Research
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded border">
                <div className={`text-2xl font-bold ${getMetricColor(keyMetrics.brandHealth)}`}>
                  {keyMetrics.brandHealth || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Overall Brand Health</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className={`text-2xl font-bold ${getMetricColor(keyMetrics.marketPosition)}`}>
                  {keyMetrics.marketPosition || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Market Position</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className={`text-2xl font-bold ${getMetricColor(keyMetrics.digitalPresence)}`}>
                  {keyMetrics.digitalPresence || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Digital Presence</div>
              </div>
              <div className="bg-white p-4 rounded border">
                <div className={`text-2xl font-bold ${getMetricColor(keyMetrics.customerSentiment)}`}>
                  {keyMetrics.customerSentiment || 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Customer Sentiment</div>
              </div>
            </div>
          </div>
          
          <MarkdownRenderer
            content={brandEquityContent}
            className="text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* Brand Positioning Analysis */}
      {brandPositioning && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Brand Positioning Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer
              content={brandPositioning}
              className="text-gray-700 leading-relaxed"
            />
          </CardContent>
        </Card>
      )}

      {/* Visual Brand Consistency */}
      {visualAssets.colorPalette.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Visual Brand Consistency
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-3">Brand Color Palette</h4>
                <div className="flex flex-wrap gap-3">
                  {visualAssets.colorPalette.slice(0, 8).map((color, index) => (
                    <div key={index} className="text-center">
                      <div 
                        className="w-16 h-16 rounded-lg border shadow-sm"
                        style={{ backgroundColor: color.hex || color }}
                      />
                      <div className="text-xs mt-1 text-gray-600">
                        {color.hex || color}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-2">Brand Consistency Score</h4>
                  <div className={`text-3xl font-bold ${getMetricColor(visualAssets.brandConsistency)}`}>
                    {visualAssets.brandConsistency}%
                  </div>
                  <div className="text-sm text-gray-600">
                    Across digital touchpoints
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Visual Style</h4>
                  <div className="text-lg text-gray-700">
                    {visualAssets.visualStyle}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Customer Sentiment Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Customer Sentiment Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h4 className="font-semibold mb-3">Analysis Framework</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <strong>Data Sources:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Social media mentions</li>
                  <li>• Review platforms</li>
                  <li>• News coverage</li>
                </ul>
              </div>
              <div>
                <strong>Metrics Tracked:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Sentiment polarity</li>
                  <li>• Mention volume</li>
                  <li>• Engagement quality</li>
                </ul>
              </div>
              <div>
                <strong>Time Period:</strong>
                <ul className="mt-2 space-y-1 text-gray-600">
                  <li>• Last 12 months</li>
                  <li>• Trend analysis</li>
                  <li>• Seasonal patterns</li>
                </ul>
              </div>
            </div>
          </div>
          
          {llmSections.sentiment_analysis && (
            <div className="mt-6">
              <MarkdownRenderer
                content={llmSections.sentiment_analysis}
                className="text-gray-700 leading-relaxed"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default BrandHealthAssessment