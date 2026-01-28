import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'react-hot-toast';
import './NodeContextMenu.css';
import documentService from '../../services/documentService';
import LoadingOverlay from './LoadingOverlay';

const NodeContextMenu = ({ node, position, nodePosition, onClose, onStyleChange, onSummarize, onToggleCollapse, mindMapId, onPDFUploaded }) => {
  const menuRef = useRef(null);
  const pdfInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('actions');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [compacting, setCompacting] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  const [styles, setStyles] = useState({
    backgroundColor: node.backgroundColor,
    borderColor: node.borderColor,
    borderWidth: node.borderWidth || 2,
    width: node.width || 200,
    height: node.height || 80,
    fontSize: node.fontSize || 16
  });

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleStyleChange = (property, value) => {
    const newStyles = { ...styles, [property]: value };
    setStyles(newStyles);
    if (onStyleChange) {
      onStyleChange(node, newStyles);
    }
  };

  const handleSummarize = () => {
    setCompacting(true);
    setLoadingMessage('🤖 Compacting nodes with AI...');
    toast.loading('🤖 Starting node compaction...', { id: 'compact' });
    if (onSummarize) {
      onSummarize(node);
    }
    setTimeout(() => {
      setCompacting(false);
      setLoadingMessage('');
      onClose();
    }, 1000);
  };

  const handleToggleCollapse = () => {
    if (onToggleCollapse) {
      onToggleCollapse(node);
    }
    onClose();
  };

  const handlePDFUpload = async (e) => {
    const file = e.target.files?.[0];
    console.log('handlePDFUpload called, file:', file);
    if (!file) {
      console.log('No file selected');
      return;
    }

    console.log('File selected:', { name: file.name, size: file.size, type: file.type });

    if (!mindMapId) {
      console.error('No mindMapId available');
      toast.error('Please save your mind map first before uploading a PDF.', { duration: 4000 });
      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }
      return;
    }

    console.log('mindMapId:', mindMapId);

    setUploading(true);
    setUploadSuccess(false);
    setLoadingMessage(`Processing "${file.name}" with RAG...`);
    toast.loading(`Processing "${file.name}" with RAG...`, { id: 'upload-pdf' });

    console.log('Calling documentService.uploadPDF...');
    try {
      const document = await documentService.uploadPDF(file, mindMapId, (progress) => {
        console.log(` Upload progress: ${progress}%`);
        setLoadingMessage(`Processing: ${progress}%`);
      });

      console.log('PDF processed successfully:', document);
      setUploadSuccess(true);
      setLoadingMessage('PDF processed successfully');
      toast.success(`PDF processed: ${document.chunks} chunks created`, {
        id: 'upload-pdf',
        duration: 3000
      });

      if (pdfInputRef.current) {
        pdfInputRef.current.value = '';
      }

      if (typeof onPDFUploaded === 'function') {
        onPDFUploaded(document.id);
      }

      setTimeout(() => {
        setUploadSuccess(false);
        setUploading(false);
        setLoadingMessage('');
        onClose();
      }, 1500);
    } catch (error) {
      console.error('PDF processing error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      toast.error(`Error processing PDF: ${errorMessage}`, {
        id: 'upload-pdf',
        duration: 5000
      });
      setUploading(false);
      setLoadingMessage('');
    }
  };

  const presetColors = {
    backgrounds: [
      '#1e3a8a',
      '#065f46',
      '#581c87',
      '#7c2d12',
      '#1e1b4b',
      '#831843',
      '#422006',
      '#0c4a6e'
    ],
    borders: [
      '#3b82f6',
      '#10b981',
      '#8b5cf6',
      '#f97316',
      '#6366f1',
      '#ec4899',
      '#fbbf24',
      '#06b6d4'
    ]
  };

  const menuStyle = {
    left: `${nodePosition?.x || 0}px`,
    top: `${nodePosition?.y || 0}px`
  };

  return (
    <div className="node-context-menu" style={menuStyle} ref={menuRef}>
      <div className="context-menu-header">
        <div className="context-menu-tabs">
          <button
            className={`tab-button ${activeTab === 'actions' ? 'active' : ''}`}
            onClick={() => setActiveTab('actions')}
          >
            Actions
          </button>
          <button
            className={`tab-button ${activeTab === 'style' ? 'active' : ''}`}
            onClick={() => setActiveTab('style')}
          >
            Style
          </button>
        </div>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      {activeTab === 'style' && (
        <div className="context-menu-content">
          <div className="style-section">
            <label className="style-label">Background Color</label>
            <div className="color-picker-container">
              <input
                type="color"
                value={styles.backgroundColor}
                onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                className="color-input"
              />
              <div className="preset-colors">
                {presetColors.backgrounds.map((color) => (
                  <button
                    key={color}
                    className={`preset-color ${styles.backgroundColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleStyleChange('backgroundColor', color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="style-section">
            <label className="style-label">Border Color</label>
            <div className="color-picker-container">
              <input
                type="color"
                value={styles.borderColor}
                onChange={(e) => handleStyleChange('borderColor', e.target.value)}
                className="color-input"
              />
              <div className="preset-colors">
                {presetColors.borders.map((color) => (
                  <button
                    key={color}
                    className={`preset-color ${styles.borderColor === color ? 'active' : ''}`}
                    style={{ backgroundColor: color }}
                    onClick={() => handleStyleChange('borderColor', color)}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="style-section">
            <label className="style-label">
              Border width: {styles.borderWidth}px
            </label>
            <input
              type="range"
              min="1"
              max="8"
              value={styles.borderWidth}
              onChange={(e) => handleStyleChange('borderWidth', parseInt(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="style-section">
            <label className="style-label">
              Width: {styles.width}px
            </label>
            <input
              type="range"
              min="150"
              max="400"
              step="10"
              value={styles.width}
              onChange={(e) => handleStyleChange('width', parseInt(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="style-section">
            <label className="style-label">
              Height: {styles.height}px
            </label>
            <input
              type="range"
              min="60"
              max="200"
              step="10"
              value={styles.height}
              onChange={(e) => handleStyleChange('height', parseInt(e.target.value))}
              className="range-input"
            />
          </div>

          <div className="style-section">
            <label className="style-label">
              Font Size: {styles.fontSize}px
            </label>
            <input
              type="range"
              min="10"
              max="24"
              value={styles.fontSize}
              onChange={(e) => handleStyleChange('fontSize', parseInt(e.target.value))}
              className="range-input"
            />
          </div>
        </div>
      )}

      {activeTab === 'actions' && (
        <div className="context-menu-content">
          <div className="actions-section">
            <button
              className={`action-button pdf-button ${uploading ? 'uploading' : ''} ${uploadSuccess ? 'success' : ''}`}
              onClick={() => pdfInputRef.current?.click()}
              disabled={uploading}
            >
              <span className="action-icon">{uploadSuccess ? '✓' : '📄'}</span>
              <span className="action-text">
                {uploading ? 'Uploading...' : uploadSuccess ? 'PDF Uploaded!' : 'Upload PDF'}
              </span>
              <input
                ref={pdfInputRef}
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handlePDFUpload}
                disabled={uploading}
                style={{ display: 'none' }}
              />
            </button>

            <button
              className="action-button collapse-button"
              onClick={handleToggleCollapse}
              disabled={!node.children || node.children.length === 0}
            >
              <span className="action-icon">{node.collapsed ? '▶' : '▼'}</span>
              <span className="action-text">
                {node.collapsed ? 'Show Children' : 'Hide Children'}
              </span>
            </button>

            <button
              className={`action-button summarize-button ${compacting ? 'compacting' : ''}`}
              onClick={handleSummarize}
              disabled={!node.children || node.children.length <= 1 || !onSummarize || compacting}
            >
              <span className="action-icon">{compacting ? '⏳' : '≡'}</span>
              <span className="action-text">
                {compacting ? 'Compacting...' : 'Summarize Child Nodes'}
              </span>
            </button>
          </div>
        </div>
      )}

      <LoadingOverlay message={loadingMessage} show={uploading || compacting} />
    </div>
  );
};

export default NodeContextMenu;
