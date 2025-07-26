/**
 * Appendix Data Sources Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { FileText, Database, BarChart3, Shield } from 'lucide-react'

const AppendixDataSources = () => {
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Appendix & Data Sources</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>Methodology and data sources, detailed competitive analysis charts, 
          social listening data, survey results, brand visual audit examples</em>
        </p>
      </div>
      
      {/* Methodology and Data Sources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Methodology and Data Sources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-blue-50 p-6 rounded-lg mb-6">
            <h4 className="font-semibold mb-3 text-blue-800">Primary Data Sources:</h4>
            <ul className="text-sm text-gray-700 leading-relaxed space-y-2">
              <li>• <strong>Google Trends:</strong> Search volume analysis and trending topics</li>
              <li>• <strong>Social Media Analytics:</strong> Native platform insights and engagement metrics</li>
              <li>• <strong>News API:</strong> Media coverage and press mention analysis</li>
              <li>• <strong>Brand Intelligence:</strong> Visual brand analysis and competitive comparison</li>
              <li>• <strong>LLM Analysis:</strong> AI-powered strategic insights and recommendations</li>
              <li>• <strong>OpenCorporates:</strong> Company information and business intelligence</li>
              <li>• <strong>Brandfetch:</strong> Brand asset collection and analysis</li>
            </ul>
          </div>

          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Data Collection Methodology:</strong> Multi-source data aggregation using API integrations 
              for real-time brand intelligence, competitive analysis, and market trend identification. 
              All data points verified through cross-referencing multiple authoritative sources.
            </div>
            
            <div>
              <strong>Analysis Framework:</strong> McKinsey-style consulting methodology combining quantitative 
              metrics with qualitative insights, competitive positioning analysis, and strategic recommendation 
              development based on market opportunity assessment.
            </div>
            
            <div>
              <strong>Quality Assurance:</strong> All findings validated through AI-powered analysis, 
              cross-platform data verification, and industry benchmark comparison to ensure accuracy 
              and actionability of strategic recommendations.
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tool Stack by Budget */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Recommended Tool Stack by Budget
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-800">Free/Low Budget ($0-500)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Google Trends, Analytics</li>
                <li>• Social media native analytics</li>
                <li>• Manual data collection</li>
                <li>• Survey tools (free tiers)</li>
                <li>• Canva (free design tools)</li>
                <li>• Google Business Intelligence</li>
              </ul>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-yellow-800">Mid Budget ($500-2000)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• SEMrush or Ahrefs</li>
                <li>• Brand24 or Mention</li>
                <li>• SurveyMonkey Premium</li>
                <li>• Canva Pro visualization</li>
                <li>• Hootsuite Analytics</li>
                <li>• Typeform Professional</li>
              </ul>
            </div>
            
            <div className="bg-purple-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-purple-800">Higher Budget ($2000+)</h4>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>• Sprout Social enterprise</li>
                <li>• SimilarWeb intelligence</li>
                <li>• Brandwatch advanced listening</li>
                <li>• Custom survey research</li>
                <li>• Tableau/Power BI Premium</li>
                <li>• Salesforce Marketing Cloud</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Research Methodology Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Research Methodology Details
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-semibold mb-3 text-blue-800">Competitive Analysis Framework</h4>
              <div className="bg-blue-50 p-4 rounded-lg text-sm text-gray-700">
                <ul className="space-y-1">
                  <li>1. <strong>Direct Competitor Identification:</strong> Market share analysis and customer consideration sets</li>
                  <li>2. <strong>Positioning Matrix Development:</strong> Multi-dimensional brand attribute mapping</li>
                  <li>3. <strong>Share of Voice Measurement:</strong> Cross-platform mention volume and engagement analysis</li>
                  <li>4. <strong>Messaging Analysis:</strong> Content audit and value proposition comparison</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-green-800">Brand Health Assessment Process</h4>
              <div className="bg-green-50 p-4 rounded-lg text-sm text-gray-700">
                <ul className="space-y-1">
                  <li>1. <strong>Awareness Metrics:</strong> Search volume trends and brand recognition measurement</li>
                  <li>2. <strong>Sentiment Analysis:</strong> Multi-platform sentiment scoring and trend analysis</li>
                  <li>3. <strong>Brand Equity Evaluation:</strong> Customer loyalty indicators and perceived value assessment</li>
                  <li>4. <strong>Visual Consistency Audit:</strong> Brand guideline adherence across touchpoints</li>
                </ul>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-purple-800">Market Opportunity Analysis</h4>
              <div className="bg-purple-50 p-4 rounded-lg text-sm text-gray-700">
                <ul className="space-y-1">
                  <li>1. <strong>Market Size Calculation:</strong> TAM/SAM/SOM analysis with growth projections</li>
                  <li>2. <strong>Trend Impact Assessment:</strong> Technology and cultural trend influence evaluation</li>
                  <li>3. <strong>White Space Identification:</strong> Competitive gap analysis and opportunity mapping</li>
                  <li>4. <strong>ROI Projection:</strong> Investment requirement and return potential modeling</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Quality and Limitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Data Quality and Limitations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 text-gray-800 leading-relaxed">
            <div>
              <strong>Data Accuracy:</strong> All quantitative metrics sourced from authoritative platforms 
              with real-time API connections. Qualitative insights generated through AI analysis of 
              aggregated data sources and validated against industry benchmarks.
            </div>
            
            <div>
              <strong>Temporal Considerations:</strong> Analysis reflects market conditions and competitive 
              landscape at time of data collection. Rapid market changes may affect recommendation 
              relevance, requiring periodic analysis updates.
            </div>
            
            <div>
              <strong>Geographic Scope:</strong> Primary analysis focuses on English-language markets 
              and may not fully capture regional variations in brand perception or competitive dynamics 
              in non-English speaking markets.
            </div>
            
            <div>
              <strong>Recommendation Confidence:</strong> Strategic recommendations based on available 
              data and proven consulting methodologies. Implementation success depends on execution 
              quality, market timing, and organizational capabilities.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default AppendixDataSources