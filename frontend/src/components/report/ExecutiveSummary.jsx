/**
 * Executive Summary Component
 * Extracted from FullConsultingReport for better organization and testability
 */

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import MarkdownRenderer from '../MarkdownRenderer.jsx'
import { BarChart3, ArrowRight } from 'lucide-react'

const ExecutiveSummary = ({ 
  executiveContent, 
  keyMetrics, 
  insights, 
  getMetricColor, 
  getPriorityVariant 
}) => {
  return (
    <div className="space-y-8">
      {/* Executive Summary Header */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg border-l-4 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Executive Summary</h2>
        <MarkdownRenderer
          content={executiveContent || 'Executive summary content not available'}
          className="text-gray-700"
        />
      </div>

      {/* Key Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Brand Health Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Object.entries(keyMetrics).map(([key, value]) => (
              <div key={key} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className={`text-3xl font-bold mb-2 ${getMetricColor(value)}`}>
                  {typeof value === 'number' ? value : 'N/A'}
                </div>
                <div className="text-sm font-medium text-gray-600 capitalize">
                  {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Strategic Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Strategic Insights & Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {insights.slice(0, 3).map((insight) => (
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
              
              {insights.length > 3 && (
                <div className="text-center pt-4 border-t">
                  <p className="text-gray-600">
                    {insights.length - 3} additional insights available in the full report
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report Summary */}
      <Card className="bg-gradient-to-r from-gray-50 to-gray-100">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {insights.length}
              </div>
              <div className="text-sm text-gray-600">Strategic Insights</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(keyMetrics).length}
              </div>
              <div className="text-sm text-gray-600">Key Metrics</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">
                {insights.filter(i => i.priority === 'High').length}
              </div>
              <div className="text-sm text-gray-600">High Priority Actions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ExecutiveSummary