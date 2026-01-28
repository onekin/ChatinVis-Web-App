import React, { useState, useEffect } from 'react';
import nodeLogService from '../../services/nodeLogService';
import './LogsViewer.css';

const ACTION_LABELS = {
  askFirstQuestion: 'First Question',
  askQuestion: 'Question',
  askFirstQuestionWithPDF: 'First Question (PDF)',
  askQuestionWithPDF: 'Question (PDF)',
  selectAnswer: 'Selected Answer',
  editFeedback: 'Edit Feedback',
  newFeedback: 'New Feedback',
  consultNote: 'Consult Note',
  summarize: 'Summarize',
  createNode: 'Create Node',
  editNode: 'Edit Node',
  deleteNode: 'Delete Node',
  moveNode: 'Move Node',
  changeNodeColor: 'Change Color',
  changeNodeStyle: 'Change Style'
};

const ACTION_CATEGORIES = {
  ask: ['askFirstQuestion', 'askQuestion', 'askFirstQuestionWithPDF', 'askQuestionWithPDF'],
  feedback: ['editFeedback', 'newFeedback'],
  create: ['createNode', 'selectAnswer'],
  edit: ['editNode', 'changeNodeColor', 'changeNodeStyle', 'moveNode'],
  delete: ['deleteNode'],
  summarize: ['summarize', 'consultNote']
};

function getActionCategory(action) {
  for (const [category, actions] of Object.entries(ACTION_CATEGORIES)) {
    if (actions.includes(action)) {
      return category;
    }
  }
  return 'edit';
}

function formatTimestamp(timestamp) {
  const date = new Date(timestamp);

  // Format date and time: DD/MM/YYYY HH:MM:SS
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

function LogEntry({ log }) {
  const category = getActionCategory(log.action);
  const actionLabel = ACTION_LABELS[log.action] || log.action;

  const renderValue = () => {
    if (!log.value) return null;

    if (typeof log.value === 'string') {
      return <div className="log-value">{log.value}</div>;
    }

    return (
      <div className="log-value">
        {Object.entries(log.value).map(([key, val]) => (
          <div key={key}>
            <span className="log-value-key">{key}:</span>
            <span>{typeof val === 'object' ? JSON.stringify(val) : val}</span>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="log-entry">
      <div className="log-entry-header">
        <span className={`log-action-badge ${category}`}>
          {actionLabel}
        </span>
        <span className="log-timestamp">
          {formatTimestamp(log.timestamp)}
        </span>
      </div>
      <div className="log-entry-body">
        {renderValue()}
        {log.source && (
          <div className="log-source">
            <strong>Source:</strong> {log.source}
          </div>
        )}
        <div className="log-node-id">
          Node ID: {log.nodeId}
        </div>
      </div>
    </div>
  );
}

function LogsViewer({ mapId, onClose }) {
  console.log('LogsViewer mounted with mapId:', mapId);

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    action: '',
    nodeId: '',
    limit: 50,
    skip: 0
  });
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    console.log('LogsViewer useEffect triggered for mapId:', mapId);
    if (!mapId) {
      setLoading(false);
      setError('No map ID provided');
      return;
    }
    loadLogs();
    loadStats();
  }, [mapId]);

  useEffect(() => {
    loadLogs(true);
  }, [filters.action, filters.nodeId]);

  const loadLogs = async (reset = false) => {
    try {
      console.log('loadLogs called, reset:', reset, 'filters:', filters);
      setLoading(true);
      setError(null);

      const currentFilters = reset ? { ...filters, skip: 0 } : filters;

      const response = await nodeLogService.getLogsByMapId(mapId, currentFilters);
      console.log('loadLogs response:', response);

      if (reset) {
        setLogs(response.logs);
      } else {
        setLogs(prev => [...prev, ...response.logs]);
      }

      setHasMore(response.logs.length === parseInt(filters.limit));

      if (reset) {
        setFilters(prev => ({ ...prev, skip: 0 }));
      }
    } catch (err) {
      console.error('Error loading logs:', err);
      setError('Error loading logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('loadStats called for mapId:', mapId);
      const statsData = await nodeLogService.getLogStats(mapId);
      console.log('loadStats response:', statsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, skip: 0 }));
  };

  const handleLoadMore = () => {
    setFilters(prev => ({
      ...prev,
      skip: prev.skip + prev.limit
    }));
    loadLogs();
  };

  const handleExport = async () => {
    try {
      await nodeLogService.exportLogs(mapId);
    } catch (err) {
      console.error('Error exporting logs:', err);
      alert('Error exporting logs');
    }
  };

  const handleRefresh = () => {
    setFilters(prev => ({ ...prev, skip: 0 }));
    loadLogs(true);
    loadStats();
  };

  return (
    <div className="logs-viewer">
      <div className="logs-viewer-header">
        <h2>Map Logs</h2>
        <button className="logs-viewer-close" onClick={onClose}>
          ×
        </button>
      </div>

      {stats && (
        <div className="logs-viewer-stats">
          <div className="logs-stats-grid">
            <div className="logs-stat-item">
              <span className="logs-stat-value">{stats.total}</span>
              <span className="logs-stat-label">Total</span>
            </div>
            <div className="logs-stat-item">
              <span className="logs-stat-value">
                {stats.byAction?.length || 0}
              </span>
              <span className="logs-stat-label">Types</span>
            </div>
            <div className="logs-stat-item">
              <span className="logs-stat-value">{logs.length}</span>
              <span className="logs-stat-label">Shown</span>
            </div>
          </div>
        </div>
      )}

      <div className="logs-viewer-filters">
        <div className="logs-filter-group">
          <label>Filter by action</label>
          <select
            value={filters.action}
            onChange={(e) => handleFilterChange('action', e.target.value)}
          >
            <option value="">All actions</option>
            {Object.entries(ACTION_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="logs-filter-group">
          <label>Node ID</label>
          <input
            type="text"
            placeholder="Filter by Node ID"
            value={filters.nodeId}
            onChange={(e) => handleFilterChange('nodeId', e.target.value)}
          />
        </div>
      </div>

      <div className="logs-viewer-actions">
        <button className="logs-action-btn" onClick={handleRefresh}>
          🔄 Refresh
        </button>
        <button className="logs-action-btn" onClick={handleExport}>
          📥 Export CSV
        </button>
      </div>

      <div className="logs-viewer-content">
        {loading && logs.length === 0 ? (
          <div className="logs-loading">
            <div className="logs-loading-spinner"></div>
            <p>Loading logs...</p>
          </div>
        ) : error ? (
          <div className="logs-error">
            <div className="logs-error-icon">⚠️</div>
            <p>{error}</p>
            {error.includes('Invalid') && (
              <div style={{ fontSize: '12px', marginTop: '10px', color: '#666' }}>
                Tip: Save the map first to enable logs tracking
              </div>
            )}
          </div>
        ) : logs.length === 0 ? (
          <div className="logs-empty">
            <div className="logs-empty-icon">📝</div>
            <div className="logs-empty-text">No logs available</div>
            <div className="logs-empty-hint">
              Logs will be generated automatically when using the mind map
            </div>
          </div>
        ) : (
          <div className="logs-list">
            {logs.map((log, index) => (
              <LogEntry key={log._id || index} log={log} />
            ))}
            {hasMore && (
              <button
                className="logs-load-more"
                onClick={handleLoadMore}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Load more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default LogsViewer;
