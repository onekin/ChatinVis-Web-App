import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import './FeedbackPopup.css';

const FeedbackPopup = ({ node, onClose, onFeedbackChange }) => {
  const popupRef = useRef(null);

  const [feedback, setFeedback] = useState({
    message: node.feedback?.message || '',
    rating: node.feedback?.rating !== null && node.feedback?.rating !== undefined ? node.feedback.rating : null
  });

  const [feedbackSaved, setFeedbackSaved] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleFeedbackChange = (field, value) => {
    const newFeedback = { ...feedback, [field]: value };
    setFeedback(newFeedback);
    setHasUnsavedChanges(true);
    setFeedbackSaved(false);
  };

  const handleSaveFeedback = () => {
    if (onFeedbackChange) {
      onFeedbackChange(node, feedback);
    }

    setFeedbackSaved(true);
    setHasUnsavedChanges(false);
    toast.success('Feedback saved successfully!', { duration: 2000 });

    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const ratingLabels = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <div className="feedback-popup-overlay">
      <div className="feedback-popup" ref={popupRef}>
        <div className="feedback-popup-header">
          <h3>Node Feedback</h3>
          <button className="feedback-close-button" onClick={onClose}>×</button>
        </div>

        <div className="feedback-popup-content">
          <div className="feedback-rating-section">
            <label className="feedback-label">Rate this node (0-4)</label>
            <div className="feedback-rating-container">
              {[0, 1, 2, 3, 4].map((rating) => (
                <button
                  key={rating}
                  className={`feedback-rating-button ${feedback.rating === rating ? 'active' : ''} rating-${rating}`}
                  onClick={() => handleFeedbackChange('rating', rating)}
                  title={ratingLabels[rating]}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="feedback-rating-label">
              {feedback.rating !== null ? (
                <>
                  <span className="rating-number">{feedback.rating}/4</span>
                  <span className="rating-text"> - {ratingLabels[feedback.rating]}</span>
                </>
              ) : (
                'No rating selected'
              )}
            </div>
          </div>

          <div className="feedback-message-section">
            <label className="feedback-label">Feedback message (optional)</label>
            <textarea
              className="feedback-textarea"
              placeholder="Enter your feedback about this node..."
              value={feedback.message}
              onChange={(e) => handleFeedbackChange('message', e.target.value)}
              rows={4}
            />
          </div>

          <div className="feedback-actions">
            {hasUnsavedChanges && !feedbackSaved && (
              <div className="unsaved-changes-indicator">
                <span className="unsaved-dot">[*]</span>
                <span className="unsaved-text">Unsaved changes</span>
              </div>
            )}
            <button
              className={`feedback-save-button ${feedbackSaved ? 'saved' : ''} ${hasUnsavedChanges ? 'has-changes' : ''}`}
              onClick={handleSaveFeedback}
              disabled={feedback.rating === null || feedbackSaved}
            >
              <span className="button-icon">{feedbackSaved ? '✓' : '💾'}</span>
              <span className="button-text">{feedbackSaved ? 'Saved!' : 'Save Feedback'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPopup;
