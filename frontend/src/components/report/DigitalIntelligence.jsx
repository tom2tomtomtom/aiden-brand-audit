/**
 * Digital Intelligence Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { Globe, Smartphone, Search, BarChart3 } from 'lucide-react'

const DigitalIntelligence = ({ llmSections }) => {
  const digitalContent = llmSections.digital_ecosystem_analysis || 
                         llmSections.digital_analysis ||
                         'Digital competitive intelligence content not available'
  
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Digital Competitive Intelligence</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>Website and UX comparison, social media strategy analysis, 
          SEO and paid advertising review, content marketing approach comparison</em>
        </p>
      </div>

      {/* Website and UX Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Website and User Experience Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-blue-800">
              Website Performance, UX Design, Conversion Optimization Analysis
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Comprehensive evaluation of competitive digital experiences including site performance, 
              user journey optimization, mobile responsiveness, and conversion funnel effectiveness.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Site Performance Analysis:</strong> Page load speeds, mobile optimization scores, 
              and technical SEO implementation reveal competitive advantages in user experience delivery 
              and search engine visibility.
            </div>
            
            <div>
              <strong>User Journey Optimization:</strong> Conversion funnel analysis shows optimization 
              opportunities in product discovery, consideration, and purchase completion phases.
            </div>
            
            <div>
              <strong>Mobile Experience Quality:</strong> Mobile-first design implementation and 
              responsive functionality comparison across competitive set revealing differentiation opportunities.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media Strategy Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Social Media Strategy Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-green-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-green-800">
              Platform Strategy, Content Performance, Community Engagement Metrics
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Analysis of competitive social media presence including content strategy, engagement rates, 
              community building effectiveness, and brand voice consistency across platforms.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Content Strategy Effectiveness:</strong> Post frequency, content type performance, 
              and audience engagement patterns reveal strategic opportunities for improved social presence.
            </div>
            
            <div>
              <strong>Community Building Success:</strong> Follower growth rates, engagement quality, 
              and user-generated content volume demonstrate brand loyalty and advocacy strength.
            </div>
            
            <div>
              <strong>Platform-Specific Performance:</strong> Channel-optimized content strategies and 
              platform native features utilization showing competitive positioning across social ecosystem.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* SEO and Paid Advertising Review */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            SEO and Paid Advertising Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-purple-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-purple-800">
              Organic Search Performance, Paid Campaign Strategy, Keyword Portfolio Analysis
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Comprehensive review of search marketing performance including organic rankings, 
              paid advertising investment, keyword strategy, and search visibility trends.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Organic Search Dominance:</strong> Keyword ranking analysis reveals competitive 
              strengths in branded terms while identifying opportunities in category and long-tail keywords.
            </div>
            
            <div>
              <strong>Paid Advertising Investment:</strong> Ad spend patterns, campaign targeting strategies, 
              and creative testing approaches show market investment priorities and competitive gaps.
            </div>
            
            <div>
              <strong>Search Visibility Trends:</strong> Year-over-year search presence changes and 
              seasonal performance patterns providing insights for strategic search marketing planning.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Digital Intelligence Analysis */}
      {digitalContent !== 'Digital competitive intelligence content not available' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Digital Ecosystem Deep Dive
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer
              content={digitalContent}
              className="text-gray-700 leading-relaxed"
            />
          </CardContent>
        </Card>
      )}

      {/* Content Marketing Approach */}
      <Card>
        <CardHeader>
          <CardTitle>Content Marketing Strategy Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-orange-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-orange-800">
              Content Strategy, Distribution Channels, Thought Leadership Positioning
            </h4>
            <div className="text-gray-700 leading-relaxed">
              Analysis of competitive content marketing strategies including blog performance, 
              thought leadership content, educational resources, and content distribution effectiveness.
            </div>
          </div>
          
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Educational Content Strategy:</strong> Blog post frequency, topic coverage, 
              and search performance demonstrate competitive thought leadership positioning and 
              customer education effectiveness.
            </div>
            
            <div>
              <strong>Multimedia Content Utilization:</strong> Video content, podcast presence, 
              and interactive content formats showing innovation in customer engagement and 
              brand storytelling approaches.
            </div>
            
            <div>
              <strong>Content Distribution Networks:</strong> Multi-channel content syndication, 
              email marketing integration, and social amplification strategies revealing 
              comprehensive content marketing sophistication.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default DigitalIntelligence