import { useState, useEffect } from 'react';
import { Settings, X, Palette } from 'lucide-react';
import './SettingsPanel.css';

const SettingsPanel = ({ isOpen, onClose }) => {
  const [nodeCount, setNodeCount] = useState(3);

  // Default colors
  const [questionBgColor, setQuestionBgColor] = useState('#1e3a8a');
  const [questionBorderColor, setQuestionBorderColor] = useState('#3b82f6');
  const [answerBgColor, setAnswerBgColor] = useState('#065f46');
  const [answerBorderColor, setAnswerBorderColor] = useState('#10b981');

  // Load saved configuration
  useEffect(() => {
    const savedNodeCount = localStorage.getItem('mindinvis_node_count') || '3';
    const savedQuestionBg = localStorage.getItem('mindinvis_question_bg') || '#1e3a8a';
    const savedQuestionBorder = localStorage.getItem('mindinvis_question_border') || '#3b82f6';
    const savedAnswerBg = localStorage.getItem('mindinvis_answer_bg') || '#065f46';
    const savedAnswerBorder = localStorage.getItem('mindinvis_answer_border') || '#10b981';

    setNodeCount(parseInt(savedNodeCount));
    setQuestionBgColor(savedQuestionBg);
    setQuestionBorderColor(savedQuestionBorder);
    setAnswerBgColor(savedAnswerBg);
    setAnswerBorderColor(savedAnswerBorder);
  }, [isOpen]);

  const handleSave = () => {
    localStorage.setItem('mindinvis_node_count', nodeCount.toString());
    localStorage.setItem('mindinvis_question_bg', questionBgColor);
    localStorage.setItem('mindinvis_question_border', questionBorderColor);
    localStorage.setItem('mindinvis_answer_bg', answerBgColor);
    localStorage.setItem('mindinvis_answer_border', answerBorderColor);

    // Dispatch custom event so other components know it changed
    window.dispatchEvent(new Event('mindinvis-settings-updated'));

    onClose();
  };

  const handleReset = () => {
    setNodeCount(3);
    setQuestionBgColor('#1e3a8a');
    setQuestionBorderColor('#3b82f6');
    setAnswerBgColor('#065f46');
    setAnswerBorderColor('#10b981');

    localStorage.removeItem('mindinvis_node_count');
    localStorage.removeItem('mindinvis_question_bg');
    localStorage.removeItem('mindinvis_question_border');
    localStorage.removeItem('mindinvis_answer_bg');
    localStorage.removeItem('mindinvis_answer_border');
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
