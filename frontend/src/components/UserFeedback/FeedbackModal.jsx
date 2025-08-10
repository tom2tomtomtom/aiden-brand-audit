import React, { useState } from 'react'
import { X, Send, Star, Bug, Lightbulb, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import userAnalytics from '@/services/userAnalytics'

const FeedbackModal = ({ isOpen, onClose, context = {} }) => {
  const [feedbackType, setFeedbackType] = useState('general')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const feedbackTypes = [
    { id: 'bug', label: 'Bug Report', icon: Bug, color: 'bg-red-100 text-red-700' },
    { id: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'bg-blue-100 text-blue-700' },
    { id: 'general', label: 'General Feedback', icon: MessageSquare, color: 'bg-green-100 text-green-700' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const feedbackData = {
        type: feedbackType,
        rating,
        comment,
        email,
        context,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      }

      // Track feedback submission
      userAnalytics.trackFeedback(feedbackType, rating, comment, {
        email: email ? 'provided' : 'not_provided',
        context
      })

      // Send to backend
      const response = await fetch('/api/monitoring/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedbackData)
      })

      if (response.ok) {
        setSubmitted(true)
        setTimeout(() => {
          onClose()
          resetForm()
        }, 2000)
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error)
      userAnalytics.trackError(error, { context: 'feedback_submission' })
      alert('Failed to submit feedback. Please try again or contact support.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setFeedbackType('general')
    setRating(0)
    setComment('')
    setEmail('')
    setSubmitted(false)
  }

  const handleClose = () => {
    userAnalytics.trackInteraction('feedback_modal', 'closed', { 
      completed: submitted,
      type: feedbackType,
      rating,
      hasComment: comment.length > 0
    })
    onClose()
    resetForm()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {submitted ? (
          <CardContent className="text-center py-8">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Thank you for your feedback!
            </h3>
            <p className="text-gray-600">
              We appreciate your input and will use it to improve the application.
            </p>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl text-gray-900">
                    Share Your Feedback
                  </CardTitle>
                  <CardDescription className="mt-1">
                    Help us improve your brand audit experience
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Feedback Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    What type of feedback do you have?
                  </label>
                  <div className="grid grid-cols-1 gap-2">
                    {feedbackTypes.map(({ id, label, icon: Icon, color }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setFeedbackType(id)}
                        className={`flex items-center p-3 rounded-lg border-2 transition-colors ${
                          feedbackType === id
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className={`p-2 rounded-full ${color} mr-3`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-medium text-gray-900">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating (for general feedback) */}
                {feedbackType === 'general' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      How would you rate your experience?
                    </label>
                    <div className="flex space-x-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star
                            className={`w-8 h-8 ${
                              star <= rating
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    {rating > 0 && (
                      <Badge variant="secondary" className="mt-2">
                        {rating === 1 && 'Poor'}
                        {rating === 2 && 'Fair'}
                        {rating === 3 && 'Good'}
                        {rating === 4 && 'Very Good'}
                        {rating === 5 && 'Excellent'}
                      </Badge>
                    )}
                  </div>
                )}

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {feedbackType === 'bug' && 'Describe the bug you encountered'}
                    {feedbackType === 'feature' && 'What feature would you like to see?'}
                    {feedbackType === 'general' && 'Tell us more about your experience'}
                  </label>
                  <Textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      feedbackType === 'bug'
                        ? 'Please describe what happened, what you expected, and steps to reproduce...'
                        : feedbackType === 'feature'
                        ? 'Describe the feature and how it would help you...'
                        : 'Share your thoughts, suggestions, or any other feedback...'
                    }
                    rows={4}
                    className="resize-none"
                    required
                  />
                </div>

                {/* Optional Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave your email if you'd like us to follow up with you
                  </p>
                </div>

                {/* Context Info */}
                {Object.keys(context).length > 0 && (
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Context</h4>
                    <div className="text-xs text-gray-600 space-y-1">
                      {context.page && <div>Page: {context.page}</div>}
                      {context.action && <div>Action: {context.action}</div>}
                      {context.brand && <div>Brand: {context.brand}</div>}
                      {context.errorId && <div>Error ID: {context.errorId}</div>}
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting || !comment.trim()}
                    className="min-w-[100px]"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Feedback
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  )
}

export default FeedbackModal