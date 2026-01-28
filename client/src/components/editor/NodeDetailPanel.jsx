import { useState, useEffect } from 'react';
import { X, Sparkles, Loader2 } from 'lucide-react';
import IAService from '../../services/IAServices';
import './NodeDetailPanel.css';

const NodeDetailPanel = ({ node, onClose, onUpdateDescription }) => {
  const [description, setDescription] = useState(node?.description || '');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);

  const iaService = new IAService();

  useEffect(() => {
    if (node) {
      setDescription(node.description || '');
      setError(null);
    }
  }, [node]);

  const handleGenerateDetail = async () => {
    if (!node) return;

    setIsGenerating(true);
    setError(null);

    try {
      const generatedDescription = await iaService.generateNodeDetail(node.text, node.tipo);
      setDescription(generatedDescription);

      if (onUpdateDescription) {
        onUpdateDescription(node.id, generatedDescription);
      }
    } catch (err) {
      console.error('Error generating detail:', err);
      setError('Error generating detail. Try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDescriptionChange = (e) => {
    const newDescription = e.target.value;
    setDescription(newDescription);

    if (onUpdateDescription) {
      onUpdateDescription(node.id, newDescription);
    }
  };

  if (!node) return null;

  return (
    <div className="node-detail-panel">
      <div className="panel-header">
        <h3>Node Details</h3>
        <button className="close-button" onClick={onClose} title="Close panel">
          <X size={20} />
        </button>
      </div>

      <div className="panel-content">
        <div className="node-info">
          <div className="info-row">
            <span className="label">Text:</span>
            <span className="value">{node.text}</span>
          </div>
          <div className="info-row">
            <span className="label">Type:</span>
            <span className={`badge badge-${node.tipo}`}>{node.tipo}</span>
          </div>
        </div>

        <div className="description-section">
          <div className="section-header">
            <span className="label">Detailed Description</span>
            <button
              className="generate-button"
              onClick={handleGenerateDetail}
              disabled={isGenerating}
              title="Generate description with AI"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Generate with AI</span>
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <textarea
            className="description-textarea"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Add a detailed description of the node or generate one with AI..."
            disabled={isGenerating}
          />
        </div>

        <div className="metadata-section">
          <h4>Metadata</h4>
          <div className="metadata-grid">
            <div className="metadata-item">
              <span className="metadata-label">ID:</span>
              <span className="metadata-value">{node.id}</span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Created:</span>
              <span className="metadata-value">
                {new Date(node.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Modified:</span>
              <span className="metadata-value">
                {new Date(node.lastModified).toLocaleString()}
              </span>
            </div>
            <div className="metadata-item">
              <span className="metadata-label">Children:</span>
              <span className="metadata-value">{node.children?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetailPanel;
