/**
 * Key Insights Component
 * Extracted from FullConsultingReport for better organization
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { Zap, ArrowRight, Target, TrendingUp } from 'lucide-react'

const KeyInsights = ({ 
  llmSections, 
  insights, 
  getPriorityVariant 
}) => {
  const recommendationsContent = llmSections.strategic_recommendations || 
                                'Key insights and recommendations content not available'
  const implementationContent = llmSections.implementation_roadmap || ''
  
  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div>
        <h2 className="text-3xl font-bold mb-4">Key Insights & Recommendations</h2>
        <p className="text-lg text-gray-600 mb-8">
          <em>Strategic insight statement, positioning opportunity, 
          messaging framework recommendations, priority action areas</em>
        </p>
      </div>

      {/* Strategic Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Strategic Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MarkdownRenderer
            content={recommendationsContent}
            className="text-gray-700 leading-relaxed"
          />
        </CardContent>
      </Card>

      {/* Actionable Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Priority Action Items
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {insights.map((insight) => (
                <div 
                  key={insight.id} 
                  className="border-l-4 border-blue-500 bg-blue-50 p-6 rounded-r-lg"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <Badge variant={getPriorityVariant(insight.priority)}>
                      {insight.priority} Priority
                    </Badge>
                    <Badge variant="outline">{insight.timeline}</Badge>
                    <Badge variant="outline">{insight.effort} Effort</Badge>
                    {insight.category && (
                      <Badge variant="secondary">{insight.category}</Badge>
                    )}
                  </div>
                  <h4 className="font-semibold text-lg mb-2">{insight.finding}</h4>
                  {insight.impact && (
                    <p className="text-gray-700 mb-3">{insight.impact}</p>
                  )}
                  <div className="flex items-center gap-2 text-blue-700 font-medium">
                    <ArrowRight className="h-4 w-4" />
                    {insight.recommendation}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Implementation Roadmap */}
      {implementationContent && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Implementation Roadmap
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MarkdownRenderer
              content={implementationContent}
              className="text-gray-700 leading-relaxed"
            />
          </CardContent>
        </Card>
      )}

      {/* Strategic Framework */}
      <Card>
        <CardHeader>
          <CardTitle>Strategic Framework Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-blue-800">Positioning Opportunity</h4>
              <div className="text-gray-700 leading-relaxed">
                Market analysis reveals significant opportunity for differentiated positioning 
                in sustainability and digital experience excellence, leveraging competitive 
                gaps and emerging consumer preferences.
              </div>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg">
              <h4 className="font-semibold mb-3 text-green-800">Messaging Framework</h4>
              <div className="text-gray-700 leading-relaxed">
                Recommended messaging strategy emphasizes authentic innovation, environmental 
                responsibility, and customer-centric experience delivery to resonate with 
                target demographic values and preferences.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <h4 className="font-semibold mb-4 text-gray-900">Immediate Next Steps</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-red-600 mb-2">High Priority (30 days)</div>
              <ul className="space-y-1 text-gray-700">
                {insights
                  .filter(i => i.priority === 'High')
                  .slice(0, 3)
                  .map((insight, index) => (
                    <li key={index}>• {insight.finding}</li>
                  ))}
              </ul>
            </div>
            
            <div>
              <div className="font-medium text-yellow-600 mb-2">Medium Priority (60 days)</div>
              <ul className="space-y-1 text-gray-700">
                {insights
                  .filter(i => i.priority === 'Medium')
                  .slice(0, 3)
                  .map((insight, index) => (
                    <li key={index}>• {insight.finding}</li>
                  ))}
              </ul>
            </div>
            
            <div>
              <div className="font-medium text-blue-600 mb-2">Strategic (90+ days)</div>
              <ul className="space-y-1 text-gray-700">
                {insights
                  .filter(i => i.priority === 'Low')
                  .slice(0, 3)
                  .map((insight, index) => (
                    <li key={index}>• {insight.finding}</li>
                  ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default KeyInsights