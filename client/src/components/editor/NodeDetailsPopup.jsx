import React, { useEffect, useRef, useState } from 'react';
import './NodeDetailsPopup.css';

const NodeDetailsPopup = ({ node, nodeRef, onClose }) => {
  const popupRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Update position function
  const updatePosition = () => {
    if (nodeRef && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8, // 8px below the node
        left: rect.left + rect.width / 2 // centered horizontally
      });
    }
  };

  // Initial position and continuous updates
  useEffect(() => {
    updatePosition();

    // Update position on scroll, resize, or any transformation
    const handleUpdate = () => {
      updatePosition();
    };

    // Listen to various events that might change node position
    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);

    // Use requestAnimationFrame for smooth updates during pan/zoom
    let rafId;
    const rafUpdate = () => {
      handleUpdate();
      rafId = requestAnimationFrame(rafUpdate);
    };
    rafId = requestAnimationFrame(rafUpdate);

    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [nodeRef]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    // Add event listener with slight delay to avoid immediate close
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  if (!node) return null;

  const rawDescription = node.description || '';
  const source = node.source || null;
  const isPDF = source && source.startsWith('PDF');

  // Parse description: split out "📄 Extracto del PDF:" and "source N" citation
  let cleanDescription = rawDescription;
  let excerpt = null;

  if (isPDF && rawDescription.includes('📄 Extracto del PDF:')) {
    const pdfMarker = '📄 Extracto del PDF:';
    const markerIndex = rawDescription.indexOf(pdfMarker);
    cleanDescription = rawDescription.substring(0, markerIndex).trim();

    // Extract excerpt text (between the marker and "source N" or end)
    let afterMarker = rawDescription.substring(markerIndex + pdfMarker.length).trim();
    // Remove leading/trailing quotes if present
    afterMarker = afterMarker.replace(/^[""]/, '').replace(/[""]$/, '');

    // Cut off "source N" citation part
    const sourceMatch = afterMarker.search(/\n\nsource \d+/);
    excerpt = sourceMatch !== -1 ? afterMarker.substring(0, sourceMatch).trim() : afterMarker.trim();
    // Remove trailing quote
    excerpt = excerpt.replace(/[""]$/, '').trim();
  }

  const displayDescription = cleanDescription || 'No description available';

  return (
    <div
      ref={popupRef}
      className="node-tooltip"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`
      }}
    >
      <button className="tooltip-close" onClick={onClose}>×</button>
      <div className="tooltip-content">
        <div className="tooltip-section">
          <span className="tooltip-section-label">Description</span>
          <p className="tooltip-description">{displayDescription}</p>
        </div>
        {source && (
          <div className="tooltip-excerpt">
            {isPDF ? (
              <>
                <span className="excerpt-label">Excerpt</span>
                {excerpt && <p className="excerpt-text">{excerpt}</p>}
                <span className="excerpt-source">{source}</span>
              </>
            ) : (
              <>
                <span className="excerpt-label">Source</span>
                <p className="source-value">{source}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeDetailsPopup;
