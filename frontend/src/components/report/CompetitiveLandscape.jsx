/**
 * Competitive Landscape Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { Building2, Target, TrendingUp, Users } from 'lucide-react'

const CompetitiveLandscape = ({ llmSections }) => {
  const competitiveContent = llmSections.competitive_intelligence || 
                            'Competitive landscape analysis content not available'
  
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Competitive Landscape Analysis</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>Competitive set definition and rationale, positioning matrix, share of voice analysis, 
          competitive messaging comparison, and visual brand comparison grid</em>
        </p>
      </div>

      {/* Competitive Set Definition */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Competitive Set Definition and Rationale
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-blue-800">
              Data Sources: Industry Reports, Customer Survey ("What other brands do you consider?"), SEMrush Organic Competitors
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Systematic identification and classification of competitive threats across direct, indirect, 
              and emerging competitor categories based on customer consideration sets and market positioning analysis.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Direct Competitors:</strong> Primary competitors operating in identical market segments with similar 
              value propositions and customer targets. These brands compete directly for market share and customer wallet share.
            </div>
            
            <div>
              <strong>Indirect Competitors:</strong> Brands offering alternative solutions to customer needs, operating 
              in adjacent categories or with different business models but competing for customer attention and budget allocation.
            </div>
            
            <div>
              <strong>Emerging Competitive Threats:</strong> New market entrants, technology disruptors, and category 
              convergence players that represent future competitive challenges and market evolution patterns.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Intelligence Deep Dive */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Intelligence Deep Dive
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-green-800">
              LLM-Powered Analysis: Market Positioning, Strengths/Weaknesses, Strategic Direction
            </h4>
          </div>
          
          <MarkdownRenderer
            content={competitiveContent}
            className="text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* Positioning Matrix */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Competitive Positioning Matrix
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-purple-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-purple-800">
              Data Sources: Customer Survey on Brand Attributes, Expert Interviews, Review Analysis
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Visual mapping of competitive landscape across key brand dimensions including quality perception, 
              price positioning, innovation leadership, and customer experience delivery.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Premium vs. Value Positioning:</strong> Competitive landscape shows clear differentiation across 
              price-quality spectrum with distinct positioning clusters and white space opportunities for market entry.
            </div>
            
            <div>
              <strong>Innovation vs. Reliability Axis:</strong> Brands cluster around innovation-first positioning versus 
              reliability-focused messaging, revealing customer preference trade-offs and positioning opportunities.
            </div>
            
            <div>
              <strong>Market Gap Analysis:</strong> Positioning matrix reveals underserved market segments and potential 
              repositioning strategies based on competitive white space identification.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share of Voice Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Share of Voice Analysis Across Channels
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-orange-800">
              Data Sources: Social Media Analytics, Facebook Ad Library, Google Ads Transparency, Google News Volume
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Comprehensive measurement of brand visibility and conversation share across digital and traditional 
              media channels compared to competitive set performance.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Social Media Share of Voice:</strong> Brand conversation volume and engagement metrics across 
              platforms reveal market leadership in digital engagement and community building effectiveness.
            </div>
            
            <div>
              <strong>Paid Advertising Presence:</strong> Competitive advertising investment analysis shows market 
              investment patterns and identifies opportunities for increased market share through strategic spending.
            </div>
            
            <div>
              <strong>Earned Media Analysis:</strong> PR and news coverage comparison demonstrates thought leadership 
              positioning and media relationship effectiveness across competitive landscape.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CompetitiveLandscape