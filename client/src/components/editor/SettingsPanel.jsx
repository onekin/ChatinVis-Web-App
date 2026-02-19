import { useState, useEffect } from 'react';
import { Settings, X, Palette } from 'lucide-react';
import { useMapData } from '../../context/MapDataContext';
import { mapService } from '../../services/mapService';
import { toast } from 'react-hot-toast';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose, mapId, currentTree, currentMapName, currentDocumentId, onFrameworkSaved }) => {
  const { frameworkConfig, updateFrameworkConfig } = useMapData();
  const [nodeCount, setNodeCount] = useState(3);

  // Default colors
  const [questionBgColor, setQuestionBgColor] = useState('#1e3a8a');
  const [questionBorderColor, setQuestionBorderColor] = useState('#3b82f6');
  const [answerBgColor, setAnswerBgColor] = useState('#065f46');
  const [answerBorderColor, setAnswerBorderColor] = useState('#10b981');

  // Framework configuration
  const [frameworkEnabled, setFrameworkEnabled] = useState(false);
  const [frameworkType, setFrameworkType] = useState('predefined');
  const [frameworkValue, setFrameworkValue] = useState('cause-consequences');
  const [customFramework, setCustomFramework] = useState('');

  // Load saved configuration only when panel opens
  useEffect(() => {
    if (!isOpen) return;
    
    const savedNodeCount = localStorage.getItem('chatinvis_node_count') || '3';
    const savedQuestionBg = localStorage.getItem('chatinvis_question_bg') || '#1e3a8a';
    const savedQuestionBorder = localStorage.getItem('chatinvis_question_border') || '#3b82f6';
    const savedAnswerBg = localStorage.getItem('chatinvis_answer_bg') || '#065f46';
    const savedAnswerBorder = localStorage.getItem('chatinvis_answer_border') || '#10b981';

    setNodeCount(parseInt(savedNodeCount));
    setQuestionBgColor(savedQuestionBg);
    setQuestionBorderColor(savedQuestionBorder);
    setAnswerBgColor(savedAnswerBg);
    setAnswerBorderColor(savedAnswerBorder);

    // Load framework from context
    console.log('SettingsPanel: Loading framework config:', frameworkConfig);
    if (frameworkConfig && frameworkConfig.enabled) {
      setFrameworkEnabled(true);
      setFrameworkType(frameworkConfig.type);
      setFrameworkValue(frameworkConfig.value);
      if (frameworkConfig.type === 'custom') {
        setCustomFramework(frameworkConfig.value);
      }
    } else {
      setFrameworkEnabled(false);
      setFrameworkType('predefined');
      setFrameworkValue('cause-consequences');
      const savedCustom = localStorage.getItem('chatinvis_custom_framework') || '';
      setCustomFramework(savedCustom);
    }
  }, [isOpen, frameworkConfig]);

  const handleSave = async () => {
    // Validate custom framework if enabled
    if (frameworkEnabled && frameworkType === 'custom' && !customFramework.trim()) {
      alert('Please enter custom framework text or switch to predefined frameworks');
      return;
    }

    localStorage.setItem('chatinvis_node_count', nodeCount.toString());
    localStorage.setItem('chatinvis_question_bg', questionBgColor);
    localStorage.setItem('chatinvis_question_border', questionBorderColor);
    localStorage.setItem('chatinvis_answer_bg', answerBgColor);
    localStorage.setItem('chatinvis_answer_border', answerBorderColor);

    // Update framework config via context
    const newFrameworkConfig = frameworkEnabled ? {
      enabled: true,
      type: frameworkType,
      value: frameworkType === 'predefined' ? frameworkValue : customFramework
    } : null;

    console.log('SettingsPanel: Saving framework config:', newFrameworkConfig);
    updateFrameworkConfig(newFrameworkConfig);

    // Also save custom framework text separately
    localStorage.setItem('chatinvis_custom_framework', customFramework);

    // Auto-save to database if map exists
    if (mapId) {
      try {
        toast.loading('Saving settings to map...', { id: 'save-settings' });
        await mapService.saveMindMapState(mapId, {
          tree: currentTree,
          title: currentMapName,
          documentId: currentDocumentId,
          frameworkConfig: newFrameworkConfig
        });
        toast.success('Settings saved!', { id: 'save-settings' });
        
        // Reload framework from DB to ensure Editor has the latest value
        if (onFrameworkSaved) {
          await onFrameworkSaved();
        }
      } catch (error) {
        console.error('Error saving framework to database:', error);
        toast.error('Failed to save settings to map', { id: 'save-settings' });
      }
    }

    onClose();
  };

  const handleReset = () => {
    setNodeCount(3);
    setQuestionBgColor('#1e3a8a');
    setQuestionBorderColor('#3b82f6');
    setAnswerBgColor('#065f46');
    setAnswerBorderColor('#10b981');

    setFrameworkEnabled(false);
    setFrameworkType('predefined');
    setFrameworkValue('cause-consequences');
    setCustomFramework('');

    localStorage.removeItem('chatinvis_node_count');
    localStorage.removeItem('chatinvis_question_bg');
    localStorage.removeItem('chatinvis_question_border');
    localStorage.removeItem('chatinvis_answer_bg');
    localStorage.removeItem('chatinvis_answer_border');
    localStorage.removeItem('chatinvis_custom_framework');

    // Reset framework via context
    updateFrameworkConfig(null);
  };

  if (!isOpen) return null;

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <div className="settings-title-group">
            <Settings size={24} />
            <h2>Settings</h2>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          <div className="settings-group">
            <label className="settings-label">Number of Nodes to Generate</label>
            <div className="settings-slider-group">
              <input
                type="range"
                min="1"
                max="10"
                value={nodeCount}
                onChange={(e) => setNodeCount(parseInt(e.target.value))}
                className="settings-slider"
              />
              <div className="settings-value-display">{nodeCount}</div>
            </div>
            <p className="settings-help-text">
              Number of nodes that will be generated per parent node (1-10).
            </p>
          </div>

          <div className="settings-divider"></div>

          <div className="settings-group">
            <label className="settings-label">
              <Palette size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Node Colors: Questions
            </label>

            <div className="color-picker-group">
              <div className="color-picker-item">
                <label className="color-picker-label">Background</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={questionBgColor}
                    onChange={(e) => setQuestionBgColor(e.target.value)}
                    className="color-picker-input"
                  />
                  <input
                    type="text"
                    value={questionBgColor}
                    onChange={(e) => setQuestionBgColor(e.target.value)}
                    className="color-text-input"
                    placeholder="#1e3a8a"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label className="color-picker-label">Border</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={questionBorderColor}
                    onChange={(e) => setQuestionBorderColor(e.target.value)}
                    className="color-picker-input"
                  />
                  <input
                    type="text"
                    value={questionBorderColor}
                    onChange={(e) => setQuestionBorderColor(e.target.value)}
                    className="color-text-input"
                    placeholder="#3b82f6"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-group">
            <label className="settings-label">
              <Palette size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Node Colors: Answers
            </label>

            <div className="color-picker-group">
              <div className="color-picker-item">
                <label className="color-picker-label">Background</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={answerBgColor}
                    onChange={(e) => setAnswerBgColor(e.target.value)}
                    className="color-picker-input"
                  />
                  <input
                    type="text"
                    value={answerBgColor}
                    onChange={(e) => setAnswerBgColor(e.target.value)}
                    className="color-text-input"
                    placeholder="#065f46"
                  />
                </div>
              </div>

              <div className="color-picker-item">
                <label className="color-picker-label">Border</label>
                <div className="color-picker-wrapper">
                  <input
                    type="color"
                    value={answerBorderColor}
                    onChange={(e) => setAnswerBorderColor(e.target.value)}
                    className="color-picker-input"
                  />
                  <input
                    type="text"
                    value={answerBorderColor}
                    onChange={(e) => setAnswerBorderColor(e.target.value)}
                    className="color-text-input"
                    placeholder="#10b981"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="settings-divider"></div>

          <div className="settings-group">
            <label className="settings-label">
              Framework Configuration
            </label>
            <p className="settings-help-text">
              Apply a thinking framework to guide AI responses throughout the mind map
            </p>

            <div style={{ marginTop: '12px' }}>
              <label className="settings-checkbox-label">
                <input
                  type="checkbox"
                  checked={frameworkEnabled}
                  onChange={(e) => setFrameworkEnabled(e.target.checked)}
                />
                <span>Enable Framework</span>
              </label>
            </div>

            {frameworkEnabled && (
              <div style={{ marginTop: '16px' }}>
                <div style={{ marginBottom: '12px' }}>
                  <label className="settings-radio-label">
                    <input
                      type="radio"
                      name="frameworkType"
                      value="predefined"
                      checked={frameworkType === 'predefined'}
                      onChange={(e) => setFrameworkType(e.target.value)}
                    />
                    <span>Predefined Frameworks</span>
                  </label>
                </div>

                {frameworkType === 'predefined' && (
                  <select
                    value={frameworkValue}
                    onChange={(e) => setFrameworkValue(e.target.value)}
                    className="settings-select"
                    style={{
                      width: '100%',
                      padding: '8px',
                      marginBottom: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc'
                    }}
                  >
                    <option value="cause-consequences">Cause & Consequences</option>
                    <option value="5w1h">5W1H (Who, What, When, Where, Why, How)</option>
                    <option value="swot">SWOT Analysis (Strengths, Weaknesses, Opportunities, Threats)</option>
                  </select>
                )}

                <div style={{ marginBottom: '12px' }}>
                  <label className="settings-radio-label">
                    <input
                      type="radio"
                      name="frameworkType"
                      value="custom"
                      checked={frameworkType === 'custom'}
                      onChange={(e) => setFrameworkType(e.target.value)}
                    />
                    <span>Custom Framework</span>
                  </label>
                </div>

                {frameworkType === 'custom' && (
                  <textarea
                    value={customFramework}
                    onChange={(e) => setCustomFramework(e.target.value)}
                    placeholder="Enter your custom framework instructions. Example: 'Focus on ethical implications, technical feasibility, and economic impact for each answer.'"
                    className="settings-textarea"
                    maxLength={500}
                    style={{
                      width: '100%',
                      minHeight: '80px',
                      padding: '8px',
                      borderRadius: '4px',
                      border: '1px solid #ccc',
                      fontFamily: 'inherit',
                      fontSize: '14px',
                      resize: 'vertical'
                    }}
                  />
                )}

                <div className="settings-info-box" style={{ marginTop: '12px', fontSize: '12px' }}>
                  <p><strong>Framework Preview:</strong></p>
                  <p style={{ fontStyle: 'italic', color: '#666' }}>
                    {frameworkType === 'predefined'
                      ? `Using ${frameworkValue.toUpperCase().replace(/-/g, ' ')} framework`
                      : customFramework || 'Enter custom framework text above'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="settings-info-box">
            <h4>💡 Information</h4>
            <ul>
              <li>The number of nodes affects automatic generation</li>
              <li>Colors will be applied to newly created nodes</li>
              <li>You can change these values at any time</li>
            </ul>
          </div>
        </div>

        <div className="settings-footer">
          <button className="settings-btn secondary" onClick={handleReset}>
            Restore Default Values
          </button>
          <div className="settings-footer-actions">
            <button className="settings-btn secondary" onClick={onClose}>
              Cancel
            </button>
            <button className="settings-btn primary" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;
