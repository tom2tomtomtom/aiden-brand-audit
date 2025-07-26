/**
 * Strategic Opportunities Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { Target, Search, Eye, TrendingUp } from 'lucide-react'

const StrategicOpportunities = ({ llmSections }) => {
  const opportunitiesContent = llmSections.strategic_opportunities || 
                              llmSections.strategic_recommendations || 
                              'Strategic opportunities analysis content not available'
  
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Strategic Opportunity Analysis</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>White space identification, underserved segments, competitive vulnerabilities, 
          growth opportunity areas, innovation potential</em>
        </p>
      </div>

      {/* Market Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Market Gap Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-blue-800">
              White Space Identification and Competitive Positioning Gaps
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Comprehensive analysis of competitive positioning reveals significant white space opportunities 
              in premium sustainable product categories and underserved market segments.
            </div>
          </div>
          
          <div className="text-gray-800 leading-relaxed">
            <strong>Market Gap Analysis:</strong> Comprehensive analysis of competitive positioning reveals 
            significant white space opportunities in premium sustainable product categories, particularly 
            in digital-native and environmentally conscious market segments where current players have 
            limited presence or weak value propositions.
          </div>
        </CardContent>
      </Card>

      {/* Underserved Customer Segments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Underserved Customer Segments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-green-800">
              High-Value Customer Segments with Unmet Needs
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Analysis identifies high-value customer segments with unmet needs, particularly in 
              digital-native and environmentally conscious demographics showing strong growth potential.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Digital-Native Professionals:</strong> Tech-savvy consumers aged 25-40 seeking seamless 
              digital experiences with authentic brand values, representing 35% market growth opportunity.
            </div>
            
            <div>
              <strong>Sustainability-Focused Millennials:</strong> Environmentally conscious consumers willing 
              to pay premium for verified sustainable practices, currently underserved by existing offerings.
            </div>
            
            <div>
              <strong>Value-Conscious Gen Z:</strong> Price-sensitive but brand-loyal consumers seeking 
              authentic engagement and social impact, requiring new positioning approaches.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Competitive Vulnerability Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Competitive Vulnerability Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-purple-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-purple-800">
              Key Competitor Weaknesses and Strategic Attack Vectors
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Key competitors show weaknesses in customer service satisfaction and digital experience delivery, 
              creating opportunities for differentiated positioning and market share capture.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Customer Experience Gaps:</strong> Leading competitors show consistently low satisfaction 
              scores in customer service and post-purchase support, creating opportunity for service excellence differentiation.
            </div>
            
            <div>
              <strong>Digital Experience Deficits:</strong> Established players lag in mobile optimization and 
              omnichannel integration, vulnerable to digital-first competitive strategies.
            </div>
            
            <div>
              <strong>Innovation Stagnation:</strong> Market leaders show reduced R&D investment and slower 
              product development cycles, creating windows for disruptive innovation approaches.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      {opportunitiesContent !== 'Strategic opportunities analysis content not available' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Strategic Recommendations and Growth Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer
              content={opportunitiesContent}
              className="text-gray-700 leading-relaxed"
            />
          </CardContent>
        </Card>
      )}

      {/* Innovation Potential Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Innovation Potential Assessment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-orange-800">
              Technology Integration and Product Development Opportunities
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Assessment of technology integration opportunities and product development potential 
              based on market trends, competitive gaps, and emerging consumer behaviors.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>AI-Powered Personalization:</strong> Integration of artificial intelligence for 
              personalized customer experiences and predictive product recommendations representing 
              significant competitive advantage opportunity.
            </div>
            
            <div>
              <strong>Sustainability Innovation:</strong> Development of circular economy solutions and 
              carbon-neutral operations creating market leadership in sustainability-conscious segments.
            </div>
            
            <div>
              <strong>Community Platform Development:</strong> Creation of customer community platforms 
              and user-generated content ecosystems for enhanced brand engagement and loyalty.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default StrategicOpportunities