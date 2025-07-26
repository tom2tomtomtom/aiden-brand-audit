/**
 * Market Trends Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { TrendingUp, Globe, Zap, Shield } from 'lucide-react'

const MarketTrends = ({ llmSections }) => {
  const marketContent = llmSections.market_performance_and_dynamics || 
                       'Market context and trends analysis content not available'
  
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Market Context & Trends</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>Category trends and market dynamics, cultural moments and consumer behavior shifts, 
          technology and innovation impact, regulatory or industry changes</em>
        </p>
      </div>

      {/* Category Trends and Market Dynamics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Category Trends and Market Dynamics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-blue-800">
              Data Sources: Google Trends, Industry Association Reports, Government Statistical Data, Trade Publications
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Comprehensive analysis of market category evolution, growth patterns, seasonal dynamics, 
              and structural changes affecting competitive positioning and strategic opportunities.
            </div>
          </div>
          
          <MarkdownRenderer
            content={marketContent}
            className="text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* Cultural Moments and Consumer Behavior Shifts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Cultural Moments and Consumer Behavior Shifts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-green-800">
              Data Sources: Social Media Trends, Google Trends Cultural Keywords, Consumer Behavior Surveys
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Analysis of cultural shifts, generational changes, and evolving consumer values that impact 
              brand perception, purchase behavior, and market dynamics.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Generational Value Shifts:</strong> Millennials and Gen Z consumers prioritize sustainability, 
              authenticity, and social responsibility in brand selection, creating new competitive advantages 
              for brands aligned with these values.
            </div>
            
            <div>
              <strong>Digital-First Behaviors:</strong> Consumer research and purchase journeys increasingly 
              digital-native, requiring brands to excel in online experiences and digital touchpoint optimization.
            </div>
            
            <div>
              <strong>Community and Purpose:</strong> Consumers seek brands that create community connections 
              and demonstrate clear social or environmental purpose beyond profit maximization.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technology and Innovation Impact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Technology and Innovation Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-purple-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-purple-800">
              Data Sources: Patent Database Searches, Industry Conference Presentations, Startup Funding Analysis
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Technology disruption analysis including AI integration, automation impact, digital transformation 
              effects, and emerging technology adoption patterns affecting market competitive dynamics.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>AI and Automation Integration:</strong> Artificial intelligence and automation technologies 
              reshaping customer service, personalization capabilities, and operational efficiency across industries.
            </div>
            
            <div>
              <strong>Digital Platform Evolution:</strong> Social commerce, voice commerce, and augmented reality 
              shopping experiences creating new customer engagement opportunities and competitive requirements.
            </div>
            
            <div>
              <strong>Data Privacy and Security:</strong> Increasing consumer awareness and regulatory requirements 
              around data privacy creating competitive advantages for brands with strong privacy protection practices.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Regulatory or Industry Changes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Regulatory or Industry Changes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-orange-800">
              Data Sources: Government Publications, Industry Association Updates, Legal Database Analysis
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Regulatory environment analysis including compliance requirements, industry standard changes, 
              and policy developments affecting market structure and competitive positioning.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Sustainability Regulations:</strong> Environmental protection requirements and carbon reduction 
              mandates creating competitive advantages for brands with established sustainability practices.
            </div>
            
            <div>
              <strong>Digital Privacy Laws:</strong> GDPR, CCPA, and emerging privacy regulations requiring significant 
              compliance investments and creating differentiation opportunities for privacy-first brands.
            </div>
            
            <div>
              <strong>Industry-Specific Changes:</strong> Sector-specific regulatory updates affecting competitive 
              landscape, market entry barriers, and strategic positioning requirements.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default MarketTrends