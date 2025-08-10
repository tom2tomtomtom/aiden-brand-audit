import React, { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import userAnalytics from '@/services/userAnalytics'

const SystemHealthIndicator = ({ compact = true }) => {
  const [healthStatus, setHealthStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    checkSystemHealth()
    
    // Check health every 30 seconds
    const interval = setInterval(checkSystemHealth, 30000)
    
    return () => clearInterval(interval)
  }, [])

  const checkSystemHealth = async () => {
    try {
      const response = await fetch('/api/monitoring/health')
      const data = await response.json()
      
      if (data.success) {
        setHealthStatus(data.data)
      } else {
        setHealthStatus({
          status: 'unknown',
          message: 'Unable to determine system health'
        })
      }
    } catch (error) {
      console.error('Failed to check system health:', error)
      userAnalytics.trackError(error, { context: 'system_health_check' })
      
      setHealthStatus({
        status: 'error',
        message: 'System health check failed'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'degraded':
        return 'text-yellow-600 bg-yellow-100'
      case 'error':
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'good':
        return <CheckCircle className="w-4 h-4" />
      case 'warning':
      case 'degraded':
        return <AlertCircle className="w-4 h-4" />
      case 'error':
      case 'critical':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Activity className="w-4 h-4" />
    }
  }

  const handleExpand = () => {
    setExpanded(!expanded)
    userAnalytics.trackInteraction('system_health', 'expanded', {
      currentStatus: healthStatus?.status
    })
  }

  if (loading) {
    return (
      <div className="flex items-center space-x-2 text-gray-500">
        <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent" />
        <span className="text-sm">Checking system status...</span>
      </div>
    )
  }

  if (!healthStatus) {
    return (
      <Badge variant="secondary" className="text-gray-600">
        <Activity className="w-3 h-3 mr-1" />
        Status Unknown
      </Badge>
    )
  }

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={handleExpand}
        className={`${getStatusColor(healthStatus.status)} hover:opacity-80`}
      >
        {getStatusIcon(healthStatus.status)}
        <span className="ml-2 capitalize">
          {healthStatus.status === 'healthy' ? 'All Systems Operational' : 
           healthStatus.status === 'warning' ? 'Minor Issues' :
           healthStatus.status === 'error' ? 'Service Disruption' :
           'System Status'}
        </span>
      </Button>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {getStatusIcon(healthStatus.status)}
          <span className="ml-2">System Status</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        <div className={`flex items-center p-2 rounded ${getStatusColor(healthStatus.status)}`}>
          <span className="font-medium capitalize">{healthStatus.status}</span>
          <span className="ml-2 text-sm">{healthStatus.message}</span>
        </div>

        {healthStatus.api_status && (
          <div className="space-y-2">
            <h4 className="font-medium text-sm text-gray-700">Service Status</h4>
            <div className="space-y-1">
              {Object.entries(healthStatus.api_status).map(([service, status]) => (
                <div key={service} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{service.replace('_', ' ')}</span>
                  <Badge 
                    variant={status === 'healthy' ? 'default' : 'destructive'} 
                    className="text-xs"
                  >
                    {status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {healthStatus.error_rate !== undefined && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Error Rate</span>
            <span className={healthStatus.error_rate > 0.1 ? 'text-red-600' : 'text-green-600'}>
              {(healthStatus.error_rate * 100).toFixed(1)}%
            </span>
          </div>
        )}

        {healthStatus.timestamp && (
          <div className="flex items-center text-xs text-gray-500">
            <Clock className="w-3 h-3 mr-1" />
            Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
          </div>
        )}

        <Button 
          size="sm" 
          variant="outline" 
          onClick={checkSystemHealth}
          className="w-full mt-3"
        >
          Refresh Status
        </Button>
      </CardContent>
    </Card>
  )
}

export default SystemHealthIndicator