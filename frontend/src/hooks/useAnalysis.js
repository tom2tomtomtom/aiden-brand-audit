/**
 * Custom hook for managing brand analysis workflow
 * Centralizes analysis state management and API calls
 */

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import apiService from '../services/api'
import useLoadingStore from '../store/useLoadingStore'

export const useAnalysis = () => {
  const { isLoading, setLoading } = useLoadingStore()
  const [analysisId, setAnalysisId] = useState(null)
  const [analysisResults, setAnalysisResults] = useState(null)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [analysisStatus, setAnalysisStatus] = useState('')

  const validateBrandName = useCallback((name) => {
    const trimmedName = name?.trim()
    
    if (!trimmedName) {
      return 'Please enter a brand name'
    }
    
    if (trimmedName.length < 2) {
      return 'Brand name must be at least 2 characters long'
    }
    
    if (trimmedName.length > 100) {
      return 'Brand name must be less than 100 characters'
    }
    
    // Check for invalid characters
    const invalidChars = /[<>{}[\]\\\/]/
    if (invalidChars.test(trimmedName)) {
      return 'Please remove special characters from the brand name'
    }
    
    return null
  }, [])

  const startAnalysis = useCallback(async (brandName, options = {}) => {
    const validationError = validateBrandName(brandName)
    if (validationError) {
      toast.error(validationError)
      return { success: false, error: validationError }
    }

    setLoading(true)
    setAnalysisProgress(0)
    setAnalysisStatus('Initializing analysis...')

    try {
      const response = await apiService.startAnalysis({
        company_name: brandName.trim(),
        analysis_options: {
          brandPerception: true,
          competitiveAnalysis: true,
          visualAnalysis: true,
          pressCoverage: true,
          socialSentiment: false,
          ...options
        }
      })
      
      if (response?.success && response?.data?.analysis_id) {
        setAnalysisId(response.data.analysis_id)
        toast.success('Analysis started! This will take 2-3 minutes.')
        return { success: true, analysisId: response.data.analysis_id }
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to start analysis'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Analysis start error:', error)
      
      let errorMessage = 'Failed to start analysis. Please try again.'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed. Please check your internet connection.'
      } else if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.'
      } else if (error.status === 429) {
        errorMessage = 'Too many requests. Please wait a moment before trying again.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error. Please try again in a few moments.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [setLoading, validateBrandName])

  const getAnalysisResults = useCallback(async (id = analysisId) => {
    if (!id) {
      const error = 'No analysis ID found'
      toast.error(error)
      return { success: false, error }
    }

    try {
      const response = await apiService.getAnalysisResults(id)
      
      if (response?.success && response?.data) {
        setAnalysisResults(response.data)
        toast.success('Analysis completed!')
        return { success: true, data: response.data }
      } else {
        const errorMessage = response?.message || response?.error || 'Failed to get analysis results'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Error getting results:', error)
      
      let errorMessage = 'Failed to get analysis results'
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'Network connection failed. Unable to retrieve results.'
      } else if (error.status === 404) {
        errorMessage = 'Analysis results not found. Please try starting a new analysis.'
      } else if (error.status >= 500) {
        errorMessage = 'Server error retrieving results. Please try again.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }, [analysisId])

  const resetAnalysis = useCallback(() => {
    setAnalysisId(null)
    setAnalysisResults(null)
    setAnalysisProgress(0)
    setAnalysisStatus('')
  }, [])

  const updateProgress = useCallback((progress, status) => {
    setAnalysisProgress(progress)
    if (status) {
      setAnalysisStatus(status)
    }
  }, [])

  return {
    // State
    isLoading,
    analysisId,
    analysisResults,
    analysisProgress,
    analysisStatus,
    
    // Actions
    startAnalysis,
    getAnalysisResults,
    resetAnalysis,
    updateProgress,
    validateBrandName,
  }
}

export default useAnalysis