import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from 'reactflow';
import { createPortal } from 'react-dom';
import './Node.css';
import './ChildOptionsPopup.css';
import NodeDetailsPopup from './NodeDetailsPopup';
import SummarizePopup from './SummarizePopup';
import NodeContextMenu from './NodeContextMenu';
import CitationViewer from './CitationViewer';
import FeedbackPopup from './FeedbackPopup';
import { useMapData } from '../../context/MapDataContext';

const PREDEFINED_FRAMEWORKS = [
  { value: 'cause-consequences', label: 'Cause & Consequences' },
  { value: '5w1h', label: '5W1H (Who, What, When, Where, Why, How)' },
  { value: 'swot', label: 'SWOT Analysis' },
];

// Helper functions for default colors
function getDefaultBackgroundColor(type) {
  switch(type) {
    case 'question': return '#1e3a8a';
    case 'answer': return '#065f46';
    case 'root': return '#581c87';
    default: return '#0f1419';
  }
}

function getDefaultBorderColor(type) {
  switch(type) {
    case 'question': return '#3b82f6';
    case 'answer': return '#10b981';
    case 'root': return '#8b5cf6';
    default: return '#8b5cf6';
  }
}

// Function to calculate font size dynamically
function calculateFontSize(text, width, height) {
  const textLength = text.length;
  const containerArea = width * height;

  // Estimation: fewer characters = larger font
  // Maximum: 18px, Minimum: 10px
  if (textLength <= 20) {
    return 16;
  } else if (textLength <= 50) {
    return 14;
  } else if (textLength <= 100) {
    return 12;
  } else {
    return 10;
  }
}

const ReactFlowNode = ({ data }) => {
  const { node, isEditing, onTextChange, onSubmit, isLoading, onNodeDoubleClick, onNodeClick, onAddChild, onAddSibling, onToggleCollapse, onSummarize, onStyleChange, onFeedbackChange, onNotesChange, selected, mindMapId, onPDFUploaded, onGenerateDirectly, onGenerateWithFramework, onGenerateAll, showDetailsPopup, onToggleDetailsPopup } = data;
  const { frameworkConfig, updateFrameworkConfig } = useMapData();
  const [showSummarizePopup, setShowSummarizePopup] = useState(false);
  const [showFeedbackPopup, setShowFeedbackPopup] = useState(false);
  const [showChildOptions, setShowChildOptions] = useState(false);
  const [showFrameworkPicker, setShowFrameworkPicker] = useState(false);
  const [pickerType, setPickerType] = useState('predefined');
  const [pickerValue, setPickerValue] = useState('cause-consequences');
  const [pickerCustom, setPickerCustom] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const nodeRef = useRef(null);
  const childOptionsRef = useRef(null);
  const childButtonRef = useRef(null);

  // Close child options popup when clicking outside
  useEffect(() => {
    if (!showChildOptions) return;

    const handleClickOutside = (event) => {
      if (childOptionsRef.current &&
          !childOptionsRef.current.contains(event.target) &&
          childButtonRef.current &&
          !childButtonRef.current.contains(event.target)) {
        setShowChildOptions(false);
      }
    };

    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
    }, 0);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showChildOptions]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (onAddChild) {
      onAddChild(node);
    }
  };

  const handleToggleCollapse = (e) => {
    e.stopPropagation();
    if (onToggleCollapse) {
      onToggleCollapse(node);
    }
  };

  const handleTogglePopup = (e) => {
    e.stopPropagation();
    if (onToggleDetailsPopup) {
      onToggleDetailsPopup(node.id);
    }
  };

  const handleToggleSummarizePopup = (e) => {
    e.stopPropagation();
    setShowSummarizePopup(!showSummarizePopup);
  };

  const handleSummarizeConfirm = (targetCount) => {
    if (onSummarize) {
      onSummarize(node, targetCount);
    }
    setShowSummarizePopup(false);
  };

  const handleToggleMenu = (e) => {
    e.stopPropagation();

    if (!showMenu && nodeRef.current) {
      const rect = nodeRef.current.getBoundingClientRect();
      setMenuPosition({
        x: rect.right + 10,
        y: rect.top
      });
    }

    setShowMenu(!showMenu);
  };

  const handleCloseMenu = () => {
    setShowMenu(false);
  };

  const handleMenuSummarize = () => {
    setShowSummarizePopup(true);
  };

  const handleToggleFeedbackPopup = (e) => {
    e.stopPropagation();
    setShowFeedbackPopup(!showFeedbackPopup);
  };

  const handleFeedbackSave = (node, feedback) => {
    if (onFeedbackChange) {
      onFeedbackChange(node, feedback);
    }
  };

  const handleAddSiblingClick = (e) => {
    e.stopPropagation();
    if (onAddSibling) {
      onAddSibling(node);
    }
  };

  const [childOptionsPosition, setChildOptionsPosition] = useState({ top: 0, left: 0 });

  const handleToggleChildOptions = (e) => {
    e.stopPropagation();
    if (!showChildOptions && childButtonRef.current) {
      const rect = childButtonRef.current.getBoundingClientRect();
      setChildOptionsPosition({
        top: rect.bottom + 8,
        left: rect.left + rect.width / 2 - 130 // 130 = half of popup width (260px)
      });
    }
    setShowChildOptions(!showChildOptions);
    setShowFrameworkPicker(false);
  };

  const activeFrameworkLabel = () => {
    if (!frameworkConfig?.enabled) return '5W1H';
    if (frameworkConfig.type === 'custom') return 'Custom';
    const found = PREDEFINED_FRAMEWORKS.find(f => f.value === frameworkConfig.value);
    return found ? found.label.split(' ')[0] : frameworkConfig.value;
  };

  const handleOpenFrameworkPicker = (e) => {
    e.stopPropagation();
    // init picker state from current config
    if (frameworkConfig?.enabled) {
      setPickerType(frameworkConfig.type || 'predefined');
      setPickerValue(frameworkConfig.type === 'predefined' ? frameworkConfig.value : 'cause-consequences');
      setPickerCustom(frameworkConfig.type === 'custom' ? frameworkConfig.value : '');
    } else {
      setPickerType('predefined');
      setPickerValue('cause-consequences');
      setPickerCustom('');
    }
    setShowFrameworkPicker(true);
  };

  const handleFrameworkPickerApply = (e) => {
    e.stopPropagation();
    const newConfig = {
      enabled: true,
      type: pickerType,
      value: pickerType === 'predefined' ? pickerValue : pickerCustom,
    };
    updateFrameworkConfig(newConfig);
    setShowFrameworkPicker(false);
  };

  const handleGenerateWithFrameworkClick = (e) => {
    e.stopPropagation();
    setShowChildOptions(false);
    setShowFrameworkPicker(false);
    if (onGenerateWithFramework) onGenerateWithFramework(node);
  };

  const handleAIChildClick = (e) => {
    e.stopPropagation();
    setShowChildOptions(false);
    // Call onGenerateDirectly directly
    if (onGenerateDirectly) {
      onGenerateDirectly(node);
    }
  };

  const handleManualChildClick = (e) => {
    e.stopPropagation();
    setShowChildOptions(false);
    if (onAddChild) {
      onAddChild(node);
    }
  };

  const width = node.width || 200;
  const height = node.height || 80;
  const fontSize = node.fontSize || calculateFontSize(node.text, width, height);

  // Function to get border color based on feedback rating
  const getFeedbackBorderColor = (rating) => {
    switch(rating) {
      case 0: return '#f97316'; // orange
      case 1: return '#fbbf24'; // yellow
      case 2: return '#84cc16'; // light green
      case 3: return '#22c55e'; // darker green
      case 4: return '#10b981'; // dark green
      default: return null;
    }
  };

  // Get feedback button color based on rating
  const getFeedbackButtonColor = () => {
    if (node.feedback?.rating !== null && node.feedback?.rating !== undefined) {
      return getFeedbackBorderColor(node.feedback.rating);
    }
    return null; // Default purple from CSS
  };

  // Determine border color
  const determineBorderColor = () => {
    // If node has feedback with rating, use feedback color
    if (node.feedback?.rating !== null && node.feedback?.rating !== undefined) {
      return getFeedbackBorderColor(node.feedback.rating);
    }
    // Otherwise, use default color
    return node.borderColor || getDefaultBorderColor(node.type);
  };

  const nodeStyle = {
    width: `${width}px`,
    height: `${height}px`,
    fontSize: `${fontSize}px`,
    backgroundColor: node.backgroundColor || getDefaultBackgroundColor(node.type),
    borderColor: determineBorderColor(),
    borderWidth: `${node.borderWidth || 2}px`,
    borderStyle: node.generatedWithFramework ? 'dashed' : (node.borderStyle || 'solid'),
    borderRadius: node.addedManually ? '0px' : undefined,
  };

  const isFromLogs = node.source === 'SystemLog';
  const isFromFramework = node.generatedWithFramework && !isFromLogs;
  const isManual = node.addedManually;
  const isLLM = !isFromLogs && !isFromFramework && !isManual;

  return (
    <>
    <div
      ref={nodeRef}
      className={`mindmap-node ${selected ? 'selected' : ''} node-type-${node.type}${node.generatedWithFramework ? ' node-framework' : ''}${isFromLogs ? ' node-from-logs' : ''}`}
      style={nodeStyle}
      onDoubleClick={(e) => onNodeDoubleClick(e, node)}
      onClick={(e) => onNodeClick(e, node)}
    >
      {isFromLogs && <span className="node-source-label node-source-logs">From Logs</span>}
      {isLLM && <span className="node-source-label node-source-llm">LLM</span>}
      {isFromFramework && <span className="node-source-label node-source-framework">{node.frameworkName || 'Framework'}</span>}
      {isManual && <span className="node-source-label node-source-manual">Manual</span>}
      <Handle type="target" position={Position.Left} />
      {!isEditing && (
        <button
          className="node-add-sibling-button"
          onClick={handleAddSiblingClick}
          title="Add Sibling Node"
        >
          +
        </button>
      )}
      {!isEditing && (
        <button
          ref={childButtonRef}
          className="node-add-child-button"
          onClick={handleToggleChildOptions}
          title="Add Child Node"
        >
          +
        </button>
      )}
      {isEditing ? (
        <div className="node-edit-mode">
          <input
            type="text"
            value={node.text}
            onChange={(e) => onTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your question..."
            className="node-input"
            autoFocus
            disabled={isLoading}
          />
          <button
            className="node-generate-btn"
            onClick={onSubmit}
            disabled={isLoading}
            title="Generate with AI"
          >
            {isLoading ? ' Generating...' : ' Generate'}
          </button>
          {isLoading && (
            <div className="node-loading">
              <div className="spinner"></div>
              <span>Generating with AI...</span>
            </div>
          )}
        </div>
      ) : (
        <div className="node-view-mode">
          <div className="node-content">
            {node.text}
          </div>
          {node.citation && <CitationViewer citation={node.citation} />}
          <div className="node-action-buttons">
            {(node.description || node.source || node.notes) && (
              <button
                className="node-action-btn"
                onClick={handleTogglePopup}
                title="View Details & Notes"
              >
                ℹ
              </button>
            )}
            {node.children && node.children.length > 0 && (
              <button
                className="node-action-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleCollapse(node);
                }}
                title={node.collapsed ? 'Show Children' : 'Hide Children'}
              >
                {node.collapsed ? '▶' : '▼'}
              </button>
            )}
            {node.id !== 'root' && (
              <button
                className="node-action-btn node-feedback-btn"
                onClick={handleToggleFeedbackPopup}
                title={node.feedback?.rating !== null && node.feedback?.rating !== undefined
                  ? `Feedback: ${node.feedback.rating}/4`
                  : 'Add Feedback'}
                style={getFeedbackButtonColor() ? {
                  background: `linear-gradient(135deg, ${getFeedbackButtonColor()} 0%, ${getFeedbackButtonColor()}dd 100%)`,
                  boxShadow: `0 4px 12px ${getFeedbackButtonColor()}80`
                } : {}}
              >
                ★
              </button>
            )}
            <button
              className="node-action-btn node-menu-btn"
              onClick={handleToggleMenu}
              title="Options"
            >
              ⚙
            </button>
          </div>
        </div>
      )}
      {showDetailsPopup && (node.description || node.source || node.notes) && createPortal(
        <NodeDetailsPopup
          node={node}
          nodeRef={nodeRef}
          onClose={() => onToggleDetailsPopup && onToggleDetailsPopup(node.id)}
          onNotesChange={onNotesChange}
        />,
        document.body
      )}
      {showSummarizePopup && (
        <SummarizePopup
          node={node}
          onConfirm={handleSummarizeConfirm}
          onClose={() => setShowSummarizePopup(false)}
        />
      )}
      {showFeedbackPopup && createPortal(
        <FeedbackPopup
          node={node}
          onClose={() => setShowFeedbackPopup(false)}
          onFeedbackChange={handleFeedbackSave}
        />,
        document.body
      )}
      {showMenu && createPortal(
        <NodeContextMenu
          node={node}
          position={menuPosition}
          nodePosition={menuPosition}
          onClose={handleCloseMenu}
          onStyleChange={onStyleChange}
          onSummarize={handleMenuSummarize}
          onToggleCollapse={onToggleCollapse}
          mindMapId={mindMapId}
          onPDFUploaded={onPDFUploaded}
        />,
        document.body
      )}
      {showChildOptions && createPortal(
        <div className="child-options-popup" ref={childOptionsRef} style={{ top: childOptionsPosition.top, left: childOptionsPosition.left }}>
          <button className="popup-close" onClick={() => { setShowChildOptions(false); setShowFrameworkPicker(false); }}>×</button>
          <div className="popup-content">
            <h3 className="popup-title">Add Child</h3>
            <div className="child-options-buttons">
              <button className="child-option-btn ai-option" onClick={handleAIChildClick}>
                <span className="option-text">Generate with AI</span>
              </button>
              <button className="child-option-btn manual-option" onClick={handleManualChildClick}>
                <span className="option-text">Add manually</span>
              </button>

              {/* Framework button + inline picker */}
              <div className="framework-option-wrapper">
                <div className="framework-option-row">
                  <button
                    className="child-option-btn generate-framework-option framework-main-btn"
                    onClick={handleGenerateWithFrameworkClick}
                  >
                    <span className="option-text">Generate with framework</span>
                  </button>
                  <button
                    className="framework-badge-btn"
                    onClick={handleOpenFrameworkPicker}
                    title="Change framework"
                  >
                    {activeFrameworkLabel()}
                  </button>
                </div>

                {showFrameworkPicker && (
                  <div className="framework-picker" onClick={e => e.stopPropagation()}>
                    <div className="framework-picker-tabs">
                      <button
                        className={`fpicker-tab ${pickerType === 'predefined' ? 'active' : ''}`}
                        onClick={() => setPickerType('predefined')}
                      >Predefined</button>
                      <button
                        className={`fpicker-tab ${pickerType === 'custom' ? 'active' : ''}`}
                        onClick={() => setPickerType('custom')}
                      >Custom</button>
                    </div>
                    {pickerType === 'predefined' ? (
                      <div className="fpicker-list">
                        {PREDEFINED_FRAMEWORKS.map(f => (
                          <button
                            key={f.value}
                            className={`fpicker-item ${pickerValue === f.value ? 'active' : ''}`}
                            onClick={() => setPickerValue(f.value)}
                          >
                            {f.label}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        className="fpicker-custom"
                        value={pickerCustom}
                        onChange={e => setPickerCustom(e.target.value)}
                        placeholder="Describe your framework..."
                        maxLength={500}
                      />
                    )}
                    <button className="fpicker-apply" onClick={handleFrameworkPickerApply}>
                      Apply
                    </button>
                  </div>
                )}
              </div>

              <button
                className="child-option-btn generate-all-option"
                onClick={() => { setShowChildOptions(false); if (onGenerateAll) onGenerateAll(node); }}
              >
                <span className="option-text">Generate All</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      <Handle type="source" position={Position.Right} />
    </div>
    </>
  );
};

export default React.memo(ReactFlowNode);
