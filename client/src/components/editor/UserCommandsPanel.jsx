import React, { useMemo, useState } from 'react';
import IAService from '../../services/IAServices';
import { toast } from 'react-hot-toast';
import './UserCommandsPanel.css';

const DEFAULT_COMMANDS = [
  {
    id: 'comparative-table',
    name: 'Comparative table',
    description: 'Create table comparing the selected nodes.',
  }
];

const UserCommandsPanel = ({ onClose, onCreateNewCommand }) => {
  const [commands] = useState(DEFAULT_COMMANDS);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [intentText, setIntentText] = useState('');
  const [commandName, setCommandName] = useState('');
  const [objective, setObjective] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState('single_node');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [outputType, setOutputType] = useState('text');
  const [constraints, setConstraints] = useState('Ground the response only on the selected scope.\nAvoid inventing facts.\nReturn only the requested output format.');
  const [compiled, setCompiled] = useState(false);
  const iaService = useMemo(() => new IAService(), []);


  const suggestedName = useMemo(() => {
    if (!intentText.trim()) return '';
    const words = intentText.trim().toLowerCase().split(/\s+/).slice(0, 4);
    return words.join('_').replace(/[^a-z0-9_]/g, '');
  }, [intentText]);

  const handleCreate = () => {
    setIsCreateOpen(true);
    setCommandName(prev => prev || suggestedName);
    if (onCreateNewCommand) onCreateNewCommand();
  };

  const handleSaveDraft = async () => {
    const spec = {
      name: commandName || suggestedName || 'new_command',
      objective: objective || intentText,
      scope,
      outputType,
      constraints,
      draftPrompt: promptTemplate || intentText
    };

    try {
      setIsCompiling(true);
      toast.loading('Compiling command with LLM...', { id: 'compile-command' });
      const result = await iaService.compileCommand(spec);
      if (result?.success) {
        setDescription(result.description || description);
        setPromptTemplate(result.prompt_template || promptTemplate);
        setCompiled(true);
        toast.success('Command compiled', { id: 'compile-command' });
      } else {
        toast.error('Compilation failed', { id: 'compile-command' });
      }
    } catch (error) {
      console.error('Compile command error:', error);
      toast.error('Compilation error', { id: 'compile-command' });
    } finally {
      setIsCompiling(false);
    }
  };

  return (
    <div className="user-commands-panel">
          <div className="user-commands-header">
            <h2>User Commands</h2>
            <button className="user-commands-close" onClick={onClose}>
              ×
            </button>
      </div>

      <div className="user-commands-actions">
        <button className="create-command-btn" onClick={handleCreate}>
          + Create new command
        </button>
      </div>

      <div className="user-commands-list">
        {commands.length === 0 ? (
          <div className="user-commands-empty">
            <div className="user-commands-empty-icon">🛠️</div>
            <div className="user-commands-empty-text">No commands yet</div>
            <div className="user-commands-empty-hint">
              Click “Create new command” to add your first one.
            </div>
          </div>
        ) : (
          commands.map((command) => (
            <div key={command.id} className="user-command-card">
              <div className="user-command-title">{command.name}</div>
              <div className="user-command-description">{command.description}</div>
            </div>
          ))
        )}
      </div>

      {isCreateOpen && (
        <div className="command-modal-backdrop">
          <div className="command-modal">
            <div className="command-modal-header">
              <div>
                <h3>New Command</h3>
              </div>
              <button className="command-modal-close" onClick={() => setIsCreateOpen(false)}>×</button>
            </div>

            <div className="command-modal-body">
              <label className="command-field">
                <span>Objective</span>
                <textarea
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                  placeholder="What the command does in 1–2 sentences."
                  rows={2}
                />
              </label>

              <div className="command-field-grid">
                <label className="command-field">
                  <span>Command name</span>
                  <input
                    value={commandName}
                    onChange={(e) => setCommandName(e.target.value)}
                    placeholder={suggestedName || 'Comparative table'}
                  />
                  {suggestedName && !commandName && (
                    <div className="command-hint">Suggested: {suggestedName}</div>
                  )}
                </label>

                <label className="command-field">
                  <span>Scope</span>
                  <div className="pill-group">
                    {['single_node', 'node_and_subnodes', 'selection', 'graph'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`pill ${scope === opt ? 'active' : ''}`}
                        onClick={() => setScope(opt)}
                      >
                        {opt.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="command-field">
                  <span>Output type</span>
                  <div className="pill-group compact">
                    {['text', 'image', 'json', 'html snippet'].map(opt => (
                      <button
                        key={opt}
                        type="button"
                        className={`pill ${outputType === opt ? 'active' : ''}`}
                        onClick={() => setOutputType(opt)}
                      >
                        {opt.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                </label>
              </div>
              <label className="command-field">
                <span>Constraints</span>
                <textarea
                  value={constraints}
                  onChange={(e) => setConstraints(e.target.value)}
                  rows={3}
                />
              </label>
              <label className="command-field">
                <span>Description</span>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={"Will be auto-filled after compilation"}
                  rows={2}
                />
              </label>
              <label className="command-field">
                <span>Prompt template</span>
                <textarea
                  className="prompt-textarea"
                  value={promptTemplate}
                  onChange={(e) => setPromptTemplate(e.target.value)}
                  placeholder={`You are an assistant that...\nBased on {scope}, generate...\n[NODE]\n{node.text}`}
                  rows={4}
                />
              </label>
            </div>

            <div className="command-modal-footer">
              <button className="secondary-btn" onClick={() => setIsCreateOpen(false)}>Cancel</button>
              <button className="primary-btn" onClick={handleSaveDraft} disabled={isCompiling}>
                {isCompiling ? 'Compiling…' : 'Compile the command'}
              </button>
              {compiled && (
                <button className="primary-btn ghost">Save</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserCommandsPanel;
