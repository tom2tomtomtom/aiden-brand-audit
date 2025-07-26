/**
 * Report Navigation Component
 * Extracted from FullConsultingReport for better maintainability
 */

import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Lightbulb,
  Users,
  Building2,
  TrendingUp,
  Target,
  Globe,
  Zap,
  FileText,
  CheckCircle
} from 'lucide-react'

const sectionIcons = {
  'executive': Lightbulb,
  'brand-health': Users,
  'competitive': Building2,
  'market-trends': TrendingUp,
  'opportunities': Target,
  'digital': Globe,
  'insights': Zap,
  'appendix': FileText
}

const ReportNavigation = ({ 
  reportSections, 
  activeTab, 
  onTabChange, 
  reportCompleteness 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
      {/* Report Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Professional Brand Audit Report
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis and strategic recommendations
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">
            {reportCompleteness}%
          </div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="space-y-2">
        {reportSections.map((section) => {
          const IconComponent = sectionIcons[section.id] || FileText
          const isActive = activeTab === section.id
          
          return (
            <Button
              key={section.id}
              variant={isActive ? "default" : "ghost"}
              className={`w-full justify-start p-4 h-auto ${
                isActive ? 'bg-blue-600 text-white' : 'hover:bg-gray-50'
              }`}
              onClick={() => onTabChange(section.id)}
            >
              <div className="flex items-center gap-3 w-full">
                <IconComponent className="h-5 w-5 flex-shrink-0" />
                <div className="flex-1 text-left">
                  <div className="font-medium">{section.title}</div>
                  <div className={`text-xs ${
                    isActive ? 'text-blue-100' : 'text-gray-500'
                  }`}>
                    {section.pages}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {section.hasContent && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                  {!section.hasContent && section.id !== 'appendix' && (
                    <Badge variant="outline" className="text-xs">
                      Pending
                    </Badge>
                  )}
                </div>
              </div>
            </Button>
          )
        })}
      </div>

      {/* Progress Indicator */}
      <div className="mt-6 pt-4 border-t">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Report Progress</span>
          <span>{reportCompleteness}% Complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${reportCompleteness}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default ReportNavigation