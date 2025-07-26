/**
 * Mobile Detection and Touch Interaction Hook
 * 
 * Provides comprehensive mobile device detection, touch event handling,
 * and responsive behavior optimization for mobile users.
 */

import { useState, useEffect, useCallback } from 'react'

const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(true)
  const [orientation, setOrientation] = useState('landscape')
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 })
  const [touchSupported, setTouchSupported] = useState(false)
  const [devicePixelRatio, setDevicePixelRatio] = useState(1)
  
  // Breakpoints (matching Tailwind CSS defaults)
  const breakpoints = {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536
  }
  
  // Detect device type and capabilities
  const detectDevice = useCallback(() => {
    const width = window.innerWidth
    const height = window.innerHeight
    
    // Update screen size
    setScreenSize({ width, height })
    
    // Update device pixel ratio
    setDevicePixelRatio(window.devicePixelRatio || 1)
    
    // Detect touch support
    const touchSupport = (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      navigator.msMaxTouchPoints > 0
    )
    setTouchSupported(touchSupport)
    
    // Determine device type based on screen width and user agent
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileUA = /iphone|ipod|android.*mobile|windows.*phone|blackberry.*mobile/i.test(userAgent)
    const isTabletUA = /ipad|android(?!.*mobile)|tablet|kindle|silk|playbook/i.test(userAgent)
    
    // Combine screen size and user agent detection
    const mobile = width < breakpoints.md || (width < breakpoints.lg && isMobileUA)
    const tablet = !mobile && (width < breakpoints.xl || isTabletUA)
    const desktop = !mobile && !tablet
    
    setIsMobile(mobile)
    setIsTablet(tablet)
    setIsDesktop(desktop)
    
    // Detect orientation
    const newOrientation = width > height ? 'landscape' : 'portrait'
    setOrientation(newOrientation)
    
  }, [])
  
  // Handle orientation change
  const handleOrientationChange = useCallback(() => {
    // Small delay to ensure screen dimensions are updated
    setTimeout(detectDevice, 100)
  }, [detectDevice])
  
  // Handle window resize
  const handleResize = useCallback(() => {
    detectDevice()
  }, [detectDevice])
  
  // Setup event listeners
  useEffect(() => {
    // Initial detection
    detectDevice()
    
    // Listen for resize events
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleOrientationChange)
    
    // Listen for device pixel ratio changes (zoom)
    const mediaQuery = window.matchMedia('(resolution: 1dppx)')
    if (mediaQuery.addListener) {
      mediaQuery.addListener(detectDevice)
    }
    
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleOrientationChange)
      
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(detectDevice)
      }
    }
  }, [detectDevice, handleResize, handleOrientationChange])
  
  // Get responsive class names
  const getResponsiveClass = useCallback((classes) => {
    if (typeof classes === 'string') return classes
    
    if (isMobile) return classes.mobile || classes.default || ''
    if (isTablet) return classes.tablet || classes.default || ''
    return classes.desktop || classes.default || ''
  }, [isMobile, isTablet])
  
  // Check if current screen size matches breakpoint
  const matches = useCallback((breakpoint) => {
    const size = breakpoints[breakpoint]
    return size ? screenSize.width >= size : false
  }, [screenSize.width])
  
  // Get current breakpoint
  const getCurrentBreakpoint = useCallback(() => {
    const { width } = screenSize
    if (width >= breakpoints['2xl']) return '2xl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  }, [screenSize.width])
  
  // Touch event helpers
  const createTouchHandler = useCallback((onTouch, onMouse) => {
    return touchSupported ? onTouch : onMouse
  }, [touchSupported])
  
  // Prevent zoom on double tap for iOS
  const preventZoom = useCallback((event) => {
    if (event.touches && event.touches.length > 1) {
      event.preventDefault()
    }
    
    let lastTouchEnd = 0
    const now = new Date().getTime()
    if (now - lastTouchEnd <= 300) {
      event.preventDefault()
    }
    lastTouchEnd = now
  }, [])
  
  // Optimize for mobile performance
  const getMobileOptimizations = useCallback(() => {
    if (!isMobile) return {}
    
    return {
      // Reduce animations on mobile
      animationDuration: 'duration-200',
      // Larger touch targets
      touchTarget: 'min-h-[44px] min-w-[44px]',
      // Better scrolling
      scrollBehavior: 'scroll-smooth',
      // Prevent zoom
      viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
    }
  }, [isMobile])
  
  // Check if device is in landscape mode on mobile (often problematic)
  const isMobileLandscape = isMobile && orientation === 'landscape'
  
  // Check if device is high DPI (retina)
  const isHighDPI = devicePixelRatio > 1.5
  
  // Safe area insets for devices with notches/rounded corners
  const getSafeAreaInsets = useCallback(() => {
    const style = getComputedStyle(document.documentElement)
    return {
      top: style.getPropertyValue('env(safe-area-inset-top)') || '0px',
      right: style.getPropertyValue('env(safe-area-inset-right)') || '0px',
      bottom: style.getPropertyValue('env(safe-area-inset-bottom)') || '0px',
      left: style.getPropertyValue('env(safe-area-inset-left)') || '0px',
    }
  }, [])
  
  // Viewport height handling (mobile browsers have dynamic viewport)
  const getViewportHeight = useCallback(() => {
    // Use viewport height units that account for mobile browser UI
    return isMobile ? 'h-[100dvh]' : 'h-screen'
  }, [isMobile])
  
  return {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    touchSupported,
    isHighDPI,
    
    // Screen information
    screenSize,
    orientation,
    devicePixelRatio,
    isMobileLandscape,
    
    // Breakpoint utilities
    matches,
    getCurrentBreakpoint,
    breakpoints,
    
    // Responsive utilities
    getResponsiveClass,
    getMobileOptimizations,
    getSafeAreaInsets,
    getViewportHeight,
    
    // Touch utilities
    createTouchHandler,
    preventZoom,
    
    // Device capabilities
    supportsTouch: touchSupported,
    supportsHover: !touchSupported, // Rough approximation
    
    // Common responsive classes
    responsiveClasses: {
      container: isMobile ? 'px-4' : isTablet ? 'px-6' : 'px-8',
      text: isMobile ? 'text-sm' : 'text-base',
      spacing: isMobile ? 'space-y-4' : 'space-y-6',
      button: isMobile ? 'py-3 px-4 text-base' : 'py-2 px-4 text-sm',
      grid: isMobile ? 'grid-cols-1' : isTablet ? 'grid-cols-2' : 'grid-cols-3'
    }
  }
}

export default useMobileDetection