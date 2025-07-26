/**
 * Comprehensive Loading States Components
 * 
 * Provides various loading indicators for different use cases
 * including skeleton screens, spinners, and progress indicators.
 */

import React from 'react'
import { Loader2, Brain, BarChart3, Search, FileText, Zap } from 'lucide-react'
import { cn } from '@/lib/utils'

// Basic spinner loader
export const Spinner = ({ size = 'md', className, ...props }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  }

  return (
    <Loader2 
      className={cn('animate-spin', sizeClasses[size], className)} 
      {...props} 
    />
  )
}

// Loading button state
export const LoadingButton = ({ 
  children, 
  loading = false, 
  loadingText = 'Loading...', 
  disabled,
  className,
  ...props 
}) => {
  return (
    <button
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center justify-center',
        loading && 'cursor-not-allowed opacity-70',
        className
      )}
      {...props}
    >
      {loading && <Spinner size="sm" className="mr-2" />}
      {loading ? loadingText : children}
    </button>
  )
}

// Skeleton components for content loading
export const Skeleton = ({ className, ...props }) => (
  <div
    className={cn(
      'animate-pulse rounded-md bg-gray-200 dark:bg-gray-700',
      className
    )}
    {...props}
  />
)

export const SkeletonText = ({ lines = 3, className }) => (
  <div className={cn('space-y-2', className)}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={cn(
          'h-4',
          i === lines - 1 ? 'w-3/4' : 'w-full'
        )}
      />
    ))}
  </div>
)

export const SkeletonCard = ({ className }) => (
  <div className={cn('p-6 border rounded-lg space-y-4', className)}>
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
    <SkeletonText lines={3} />
  </div>
)

// Analysis-specific loading states
export const AnalysisLoadingState = ({ 
  stage = 'starting', 
  progress = 0, 
  brandName = '',
  className 
}) => {
  const stages = {
    starting: {
      icon: Search,
      title: 'Initializing Analysis',
      description: `Starting comprehensive brand audit for ${brandName}...`
    },
    collecting: {
      icon: BarChart3,
      title: 'Collecting Data',
      description: 'Gathering brand information from multiple sources...'
    },
    analyzing: {
      icon: Brain,
      title: 'AI Analysis in Progress',
      description: 'Claude AI is analyzing your brand data...'
    },
    generating: {
      icon: FileText,
      title: 'Generating Report',
      description: 'Creating your comprehensive brand audit report...'
    },
    finalizing: {
      icon: Zap,
      title: 'Finalizing Results',
      description: 'Preparing your professional brand analysis...'
    }
  }

  const currentStage = stages[stage] || stages.starting
  const IconComponent = currentStage.icon

  return (
    <div className={cn('text-center space-y-6', className)}>
      <div className="relative">
        <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <IconComponent className="h-8 w-8 text-white" />
        </div>
        
        {/* Animated ring */}
        <div className="absolute inset-0 w-20 h-20 mx-auto">
          <div className="animate-spin rounded-full h-20 w-20 border-4 border-transparent border-t-blue-500 border-r-purple-600"></div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">
          {currentStage.title}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {currentStage.description}
        </p>
      </div>

      {progress > 0 && (
        <div className="max-w-xs mx-auto">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
        <Spinner size="sm" />
        <span>This usually takes 2-3 minutes</span>
      </div>
    </div>
  )
}

// Form loading overlay
export const FormLoadingOverlay = ({ 
  isLoading = false, 
  message = 'Processing...', 
  children 
}) => (
  <div className="relative">
    {children}
    {isLoading && (
      <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-50 rounded-lg">
        <div className="text-center space-y-3">
          <Spinner size="lg" className="text-blue-600" />
          <p className="text-sm font-medium text-gray-700">{message}</p>
        </div>
      </div>
    )}
  </div>
)

// Table loading state
export const TableLoadingState = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex space-x-4">
        {Array.from({ length: columns }).map((_, j) => (
          <Skeleton key={j} className="h-8 flex-1" />
        ))}
      </div>
    ))}
  </div>
)

// Dashboard loading state
export const DashboardLoadingState = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <SkeletonCard key={i} />
    ))}
  </div>
)

// Chart loading state
export const ChartLoadingState = ({ className }) => (
  <div className={cn('p-6 border rounded-lg', className)}>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="h-64 bg-gray-100 rounded flex items-end justify-center space-x-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="bg-gray-300 rounded-t animate-pulse"
            style={{
              height: `${Math.random() * 80 + 20}%`,
              width: '12%'
            }}
          />
        ))}
      </div>
    </div>
  </div>
)

// Inline loading states
export const InlineLoader = ({ text = 'Loading', className }) => (
  <div className={cn('flex items-center space-x-2 text-sm text-gray-600', className)}>
    <Spinner size="sm" />
    <span>{text}</span>
  </div>
)

// Pulse loading for images
export const ImageLoadingState = ({ className, aspectRatio = 'aspect-video' }) => (
  <div className={cn('bg-gray-200 animate-pulse rounded-lg', aspectRatio, className)}>
    <div className="flex items-center justify-center h-full">
      <div className="text-gray-400">
        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      </div>
    </div>
  </div>
)

// Global page loading state
export const PageLoadingState = ({ message = 'Loading page...' }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
        <Spinner size="lg" className="text-white" />
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Loading</h2>
        <p className="text-gray-600">{message}</p>
      </div>
    </div>
  </div>
)

// Loading dots animation
export const LoadingDots = ({ className }) => (
  <div className={cn('flex space-x-1', className)}>
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
        style={{ animationDelay: `${i * 0.1}s` }}
      />
    ))}
  </div>
)

// Default export for easy importing
const LoadingSpinner = PageLoadingState

export default LoadingSpinner