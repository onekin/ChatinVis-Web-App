import { useState, useEffect } from 'react';
import { Bot, X, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import './LLMPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SERVER_DEFAULT_TOKEN_KEY = 'chatinvis_server_default_access_token';
const SERVER_DEFAULT_TRIES_KEY = 'chatinvis_server_default_tries';
const MAX_SERVER_DEFAULT_TRIES_PER_DAY = 10;

const PROVIDERS = [
  {
    id: 'openai',
    name: 'GPT (OpenAI)',
    description: 'Current GPT family',
    color: '#10a37f',
    models: [
      { id: 'gpt-5', label: 'GPT-5' },
      { id: 'gpt-5-mini', label: 'GPT-5 mini' },
      { id: 'gpt-4o', label: 'GPT-4o' },
    ],
    placeholder: 'sk-...',
  },
  {
    id: 'claude',
    name: 'Claude (Anthropic)',
    description: 'Latest Claude 4 family',
    color: '#d97706',
    models: [
      { id: 'claude-sonnet-4-5', label: 'Claude 4.5 Sonnet' },
      { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5' },
      { id: 'claude-opus-4-1', label: 'Claude Opus 4.1' },
    ],
    placeholder: 'sk-ant-...',
  },
  {
    id: 'gemini',
    name: 'Gemini (Google)',
    description: 'Gemini 2.5 family',
    color: '#4285f4',
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash (Free)' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro (Free)' },
      { id: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash-Lite (Free)' },
    ],
    placeholder: 'AIza...',
  },
  {
    id: 'groq',
    name: 'Groq',
    description: 'Qwen and Meta Llama models',
    color: '#f02d65',
    models: [
      { id: 'qwen/qwen3-32b', label: 'Qwen3 32B' },
      { id: 'llama-3.1-8b-instant', label: 'Llama 3.1 8B Instant' },
      { id: 'llama-3.3-70b-versatile', label: 'Llama 3.3 70B Versatile' },
      { id: 'meta-llama/llama-4-maverick-17b-128e-instruct', label: 'Llama 4 Maverick 17B 128E Instruct' },
      { id: 'meta-llama/llama-4-scout-17b-16e-instruct', label: 'Llama 4 Scout 17B 16E Instruct' },
    ],
    placeholder: 'gsk_...',
  },
];

const LLMPanel = ({ isOpen, onClose }) => {
  const [activeProvider, setActiveProvider] = useState('');
  const [apiKeys, setApiKeys] = useState({ openai: '', claude: '', gemini: '', groq: '' });
  const [models, setModels] = useState({
    openai: 'gpt-5',
    claude: 'claude-sonnet-4-5',
    gemini: 'gemini-2.5-flash',
    groq: 'llama-3.3-70b-versatile',
  });
  const [showKeys, setShowKeys] = useState({ openai: false, claude: false, gemini: false, groq: false });
  const [serverDefaultPassword, setServerDefaultPassword] = useState('');
  const [serverDefaultError, setServerDefaultError] = useState('');
  const [remainingTries, setRemainingTries] = useState(MAX_SERVER_DEFAULT_TRIES_PER_DAY);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [isServerDefaultUnlocked, setIsServerDefaultUnlocked] = useState(false);
  const [serverDefaultModel, setServerDefaultModel] = useState('gpt-4o');

  const getTodayKey = () => new Date().toISOString().split('T')[0];

  const readTries = () => {
    try {
      const raw = localStorage.getItem(SERVER_DEFAULT_TRIES_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!parsed || parsed.date !== getTodayKey()) {
        return { date: getTodayKey(), count: 0 };
      }
      return { date: parsed.date, count: Number(parsed.count || 0) };
    } catch {
      return { date: getTodayKey(), count: 0 };
    }
  };

  const writeTries = (nextCount) => {
    const payload = { date: getTodayKey(), count: nextCount };
    localStorage.setItem(SERVER_DEFAULT_TRIES_KEY, JSON.stringify(payload));
    setRemainingTries(Math.max(0, MAX_SERVER_DEFAULT_TRIES_PER_DAY - nextCount));
  };

  const isAccessTokenValid = (token) => {
    if (!token) return false;
    try {
      const payloadBase64 = token.split('.')[1];
      if (!payloadBase64) return false;
      const payload = JSON.parse(atob(payloadBase64));
      if (payload.type !== 'server-default-access') return false;
      if (!payload.exp) return false;
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    const savedProvider = localStorage.getItem('chatinvis_llm_provider') || '';
    const savedKeys = {
      openai: localStorage.getItem('chatinvis_llm_key_openai') || '',
      claude: localStorage.getItem('chatinvis_llm_key_claude') || '',
      gemini: localStorage.getItem('chatinvis_llm_key_gemini') || '',
      groq: localStorage.getItem('chatinvis_llm_key_groq') || '',
    };
    const savedModels = {
      openai: localStorage.getItem('chatinvis_llm_model_openai') || 'gpt-5',
      claude: localStorage.getItem('chatinvis_llm_model_claude') || 'claude-sonnet-4-5',
      gemini: localStorage.getItem('chatinvis_llm_model_gemini') || 'gemini-2.5-flash',
      groq: localStorage.getItem('chatinvis_llm_model_groq') || 'llama-3.3-70b-versatile',
    };
    const savedServerDefaultModel = localStorage.getItem('chatinvis_server_default_model') || 'gpt-4o';
    setActiveProvider(savedProvider);
    setApiKeys(savedKeys);
    setModels(savedModels);
    setServerDefaultModel(savedServerDefaultModel);

    const tries = readTries();
    setRemainingTries(Math.max(0, MAX_SERVER_DEFAULT_TRIES_PER_DAY - tries.count));
    const token = localStorage.getItem(SERVER_DEFAULT_TOKEN_KEY) || '';
    const unlocked = isAccessTokenValid(token);
    setIsServerDefaultUnlocked(unlocked);
    if (!unlocked) {
      localStorage.removeItem(SERVER_DEFAULT_TOKEN_KEY);
      if (savedProvider === '') {
        setServerDefaultError('Server default is locked. Enter password to unlock it.');
      }
    } else {
      setServerDefaultError('');
    }
  }, [isOpen]);

  const registerFailedTry = () => {
    const tries = readTries();
    const nextCount = Math.min(MAX_SERVER_DEFAULT_TRIES_PER_DAY, tries.count + 1);
    writeTries(nextCount);
  };

  const unlockServerDefault = async () => {
    if (remainingTries <= 0) {
      setServerDefaultError('You reached the 10 tries limit today. Try again tomorrow or use your own API key.');
      return;
    }

    if (!serverDefaultPassword) {
      setServerDefaultError('Enter the server default password first.');
      return;
    }

    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      setServerDefaultError('You must be logged in to unlock server default.');
      return;
    }

    setIsUnlocking(true);
    setServerDefaultError('');

    try {
      const response = await fetch(`${API_URL}/auth/server-default/unlock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ password: serverDefaultPassword }),
      });

      const data = await response.json();

      if (!response.ok || !data?.success || !data?.accessToken) {
        registerFailedTry();
        setServerDefaultError(data?.error || 'Incorrect password for server default.');
        return;
      }

      localStorage.setItem(SERVER_DEFAULT_TOKEN_KEY, data.accessToken);
      setIsServerDefaultUnlocked(true);
      setServerDefaultPassword('');
      setServerDefaultError('');
      setActiveProvider('');
    } catch (error) {
      console.error('Failed to unlock server default:', error);
      registerFailedTry();
      setServerDefaultError('Unable to unlock right now. Please try again.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const handleSave = () => {
    if (activeProvider === '' && !isServerDefaultUnlocked) {
      setServerDefaultError('Server default is locked. Unlock it first or choose another provider.');
      return;
    }

    localStorage.setItem('chatinvis_llm_provider', activeProvider);
    localStorage.setItem('chatinvis_server_default_model', serverDefaultModel);
    Object.entries(apiKeys).forEach(([id, key]) => {
      localStorage.setItem(`chatinvis_llm_key_${id}`, key);
    });
    Object.entries(models).forEach(([id, model]) => {
      localStorage.setItem(`chatinvis_llm_model_${id}`, model);
    });
    // Also expose current active provider data for easy access by services
    if (activeProvider && apiKeys[activeProvider]) {
      localStorage.setItem('chatinvis_llm_apikey', apiKeys[activeProvider]);
      localStorage.setItem('chatinvis_llm_model', models[activeProvider]);
    } else {
      localStorage.removeItem('chatinvis_llm_apikey');
      localStorage.removeItem('chatinvis_llm_model');
    }
    onClose();
  };

  const handleReset = () => {
    setActiveProvider('');
    setApiKeys({ openai: '', claude: '', gemini: '', groq: '' });
    setModels({
      openai: 'gpt-5',
      claude: 'claude-sonnet-4-5',
      gemini: 'gemini-2.5-flash',
      groq: 'llama-3.3-70b-versatile',
    });
  };

  const toggleKeyVisibility = (providerId) => {
    setShowKeys((prev) => ({ ...prev, [providerId]: !prev[providerId] }));
  };

  const handleProviderChange = (providerId) => {
    // Switching away from server default invalidates the previous unlock.
    // If the user comes back to server default, they must unlock again.
    if (providerId !== '') {
      localStorage.removeItem(SERVER_DEFAULT_TOKEN_KEY);
      setIsServerDefaultUnlocked(false);
      setServerDefaultPassword('');
      setServerDefaultError('');
    }

    setActiveProvider(providerId);
  };

  if (!isOpen) return null;

  return (
    <div className="llm-overlay" onClick={onClose}>
      <div className="llm-panel" onClick={(e) => e.stopPropagation()}>
        <div className="llm-header">
          <div className="llm-title-group">
            <Bot size={24} />
            <h2>LLM Models</h2>
          </div>
          <button className="llm-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="llm-content">
          <p className="llm-description">
            Select an AI provider and enter your API key to use it instead of the server default.
            Leave blank to use the server&apos;s configured model.
          </p>

          <div className="llm-providers">
            {PROVIDERS.map((provider) => {
              const isActive = activeProvider === provider.id;
              const hasKey = !!apiKeys[provider.id];
              return (
                <div
                  key={provider.id}
                  className={`llm-provider-card ${isActive ? 'active' : ''}`}
                  style={{ '--provider-color': provider.color }}
                >
                  <div className="llm-provider-header">
                    <label className="llm-provider-select">
                      <input
                        type="radio"
                        name="llm-provider"
                        value={provider.id}
                        checked={isActive}
                        onChange={() => handleProviderChange(provider.id)}
                        className="llm-radio"
                      />
                      <span className="llm-provider-name" style={{ color: isActive ? provider.color : undefined }}>
                        {provider.name}
                      </span>
                      {isActive && hasKey && (
                        <span className="llm-active-badge">
                          <CheckCircle2 size={14} />
                          Active
                        </span>
                      )}
                    </label>
                    {isActive && !hasKey && (
                      <span className="llm-missing-key-badge">API key required</span>
                    )}
                  </div>
                  <p className="llm-provider-description">{provider.description}</p>

                  {isActive && (
                    <div className="llm-provider-config">
                      <div className="llm-field">
                        <label className="llm-field-label">Model</label>
                        <select
                          value={models[provider.id]}
                          onChange={(e) => setModels((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                          className="llm-select"
                        >
                          {provider.models.map((m) => (
                            <option key={m.id} value={m.id}>{m.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="llm-field">
                        <label className="llm-field-label">API Key</label>
                        <div className="llm-key-input-group">
                          <input
                            type={showKeys[provider.id] ? 'text' : 'password'}
                            value={apiKeys[provider.id]}
                            onChange={(e) => setApiKeys((prev) => ({ ...prev, [provider.id]: e.target.value }))}
                            placeholder={provider.placeholder}
                            className="llm-key-input"
                            autoComplete="off"
                          />
                          <button
                            type="button"
                            className="llm-toggle-visibility"
                            onClick={() => toggleKeyVisibility(provider.id)}
                            title={showKeys[provider.id] ? 'Hide key' : 'Show key'}
                          >
                            {showKeys[provider.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </div>
                        <p className="llm-key-help">
                          Your key is stored locally in your browser only.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="llm-server-default">
            <label className="llm-provider-select">
              <input
                type="radio"
                name="llm-provider"
                value=""
                checked={activeProvider === ''}
                onChange={() => handleProviderChange('')}
                className="llm-radio"
                disabled={!isServerDefaultUnlocked}
              />
              <span className="llm-provider-name">Use server default</span>
              {activeProvider === '' && isServerDefaultUnlocked && (
                <span className="llm-active-badge">
                  <CheckCircle2 size={14} />
                  Active
                </span>
              )}
            </label>
            <p className="llm-provider-description" style={{ marginLeft: '24px' }}>
              {isServerDefaultUnlocked
                ? 'Use the API key configured in the server environment.'
                : `Locked: enter password to unlock server default. ${remainingTries} / ${MAX_SERVER_DEFAULT_TRIES_PER_DAY} tries left today.`}
            </p>

            {isServerDefaultUnlocked && (
              <div className="llm-server-default-model" style={{ marginLeft: '24px', marginTop: '10px' }}>
                <label className="llm-field-label">Model</label>
                <select
                  value={serverDefaultModel}
                  onChange={(e) => setServerDefaultModel(e.target.value)}
                  className="llm-select"
                >
                  <option value="gpt-4o">GPT-4o</option>
                  <option value="gpt-5">GPT-5</option>
                </select>
                <p className="llm-key-help" style={{ marginTop: '4px' }}>
                  GPT-4o is faster and cheaper. GPT-5 is the latest and most capable.
                </p>
              </div>
            )}

            {!isServerDefaultUnlocked && (
              <div className="llm-server-default-unlock">
                <input
                  type="password"
                  value={serverDefaultPassword}
                  onChange={(e) => setServerDefaultPassword(e.target.value)}
                  placeholder="Enter server default password"
                  className="llm-server-password-input"
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="llm-btn secondary"
                  onClick={unlockServerDefault}
                  disabled={isUnlocking || remainingTries <= 0}
                >
                  {isUnlocking ? 'Unlocking...' : 'Unlock'}
                </button>
              </div>
            )}

            {serverDefaultError && (
              <p className={`llm-server-default-message ${isServerDefaultUnlocked ? 'success' : 'error'}`}>
                {serverDefaultError}
              </p>
            )}
          </div>
        </div>

        <div className="llm-footer">
          <div className="llm-footer-actions">
            <button className="llm-btn secondary" onClick={handleReset}>
              Reset
            </button>
            <button className="llm-btn primary" onClick={handleSave}>
              Save &amp; Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LLMPanel;
