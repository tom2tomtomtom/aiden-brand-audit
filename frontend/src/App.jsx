import { useState, useEffect, Suspense, lazy, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import ModernLanding from './components/ModernLanding'
import AnalysisProgress from './components/AnalysisProgress'
import ErrorBoundary from './components/ErrorHandling/ErrorBoundary'
import LoadingSpinner from './components/ui/loading-states'

// Lazy load heavy components for better performance
const HistoricalAnalysis = lazy(() => import('./components/HistoricalAnalysis'))
const FullConsultingReport = lazy(() => import('./components/FullConsultingReport'))
const StrategicIntelligenceBriefing = lazy(() => import('./components/StrategicIntelligenceBriefing'))
const AdvancedAnalyticsDashboard = lazy(() => import('./components/analytics/AdvancedAnalyticsDashboard'))
const AnalyticsTest = lazy(() => import('./components/analytics/AnalyticsTest'))

// Custom hooks
import useAnalysis from './hooks/useAnalysis'
import usePerformanceOptimized from './hooks/usePerformanceOptimized'
import useAuthStore from './store/useAuthStore'
import { Toaster } from 'sonner'
import './App.css'

function App() {
  // Custom hooks for analysis management
  const {
    isLoading,
    analysisId,
    analysisResults,
    analysisProgress,
    analysisStatus,
    startAnalysis,
    getAnalysisResults,
    resetAnalysis,
  } = useAnalysis()

  // Performance optimization
  const { getPerformanceMetrics } = usePerformanceOptimized()

  // Local state
  const [currentView, setCurrentView] = useState('landing') // 'landing', 'analyzing', 'results'
  const [brandQuery, setBrandQuery] = useState('')

  const handleStartAnalysis = useCallback(async (brandName) => {
    setBrandQuery(brandName)
    setCurrentView('analyzing')
    
    const result = await startAnalysis(brandName)
    
    if (result.success) {
      // Analysis started successfully, stay on analyzing view
    } else {
      // Error occurred, return to landing
      setCurrentView('landing')
    }
  }, [startAnalysis])

  const handleAnalysisComplete = useCallback(async () => {
    const result = await getAnalysisResults()
    
    if (result.success) {
      setCurrentView('results')
    } else {
      setCurrentView('landing')
    }
  }, [getAnalysisResults])

  const handleNewAnalysis = useCallback(() => {
    setCurrentView('landing')
    setBrandQuery('')
    resetAnalysis()
  }, [resetAnalysis])

  const renderCurrentView = () => {
    switch (currentView) {
      case 'landing':
        return <ModernLanding onStartAnalysis={handleStartAnalysis} isLoading={isLoading} />

      case 'analyzing':
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <AnalysisProgress
              analysisId={analysisId}
              onComplete={handleAnalysisComplete}
            />
          </div>
        )

      case 'results':
        return (
          <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4">
              <Suspense fallback={<LoadingSpinner />}>
                <StrategicIntelligenceBriefing
                  analysisResults={analysisResults}
                  brandName={brandQuery}
                  onNewAnalysis={handleNewAnalysis}
                />
              </Suspense>
            </div>
          </div>
        )

      default:
        return <ModernLanding onStartAnalysis={handleStartAnalysis} isLoading={isLoading} />
    }
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <div className="min-h-screen">
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={renderCurrentView()} />
            <Route path="/historical-analysis" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <HistoricalAnalysis />
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/analytics" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-7xl mx-auto px-4">
                      <AdvancedAnalyticsDashboard
                        analysisResults={analysisResults}
                        brandName={brandQuery}
                        historicalData={[]}
                        competitorData={[]}
                        onExport={(format, data) => console.log('Export:', format, data)}
                        onRefresh={() => console.log('Refresh analytics')}
                      />
                    </div>
                  </div>
                </Suspense>
              </ErrorBoundary>
            } />
            <Route path="/analytics-test" element={
              <ErrorBoundary>
                <Suspense fallback={<LoadingSpinner />}>
                  <div className="min-h-screen bg-gray-50">
                    <AnalyticsTest />
                  </div>
                </Suspense>
              </ErrorBoundary>
            } />
          </Routes>
        </div>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App