import React from 'react';
import './LoadingOverlay.css';

const LoadingOverlay = ({ message, show }) => {
  if (!show) return null;

  return (
    <div className="loading-overlay">
      <div className="loading-overlay-content">
        <div className="loading-spinner"></div>
        <span className="loading-message">{message}</span>
      </div>
    </div>
  );
};

export default LoadingOverlay;
