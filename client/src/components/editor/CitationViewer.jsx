import React from 'react';
import './CitationViewer.css';

const CitationViewer = ({ citation }) => {
  if (!citation) return null;

  return (
    <div className="citation-viewer">
      <div className="citation-header">
        <span className="citation-icon">[PDF]</span>
        <span className="citation-label">PDF Reference</span>
      </div>
      <div className="citation-content">
        <div className="citation-page">
          Page {citation.pageNumber}
        </div>
        {citation.text && (
          <div className="citation-text">
            {citation.text}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitationViewer;
