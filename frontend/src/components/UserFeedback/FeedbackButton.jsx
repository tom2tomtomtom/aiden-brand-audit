import React, { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import FeedbackModal from './FeedbackModal'
import userAnalytics from '@/services/userAnalytics'

const FeedbackButton = ({ 
  context = {}, 
  className = '', 
  variant = 'outline',
  size = 'sm',
  position = 'fixed' 
}) => {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)

  const handleOpenFeedback = () => {
    userAnalytics.trackInteraction('feedback_button', 'clicked', {
      context,
      location: window.location.href
    })
    setShowFeedbackModal(true)
  }

  const handleCloseFeedback = () => {
    setShowFeedbackModal(false)
  }

  const positionClasses = position === 'fixed' 
    ? 'fixed bottom-6 right-6 z-50 shadow-lg' 
    : ''

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleOpenFeedback}
        className={`${positionClasses} ${className}`}
        title="Share your feedback"
      >
        <MessageSquare className="w-4 h-4 mr-2" />
        Feedback
      </Button>

      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={handleCloseFeedback}
        context={context}
      />
    </>
  )
}

export default FeedbackButton