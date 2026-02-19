import { Plus, Trash2, LayoutGrid, Undo, Redo, FileText, X, Download, FileSearch, Terminal } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import documentService from '../../services/documentService';
import './Toolbar.css';

const Toolbar = ({
  selectedNode,
  onAddNode,
  onDeleteNode,
  onReorganize,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  documentId,
  onRemoveDocument,
  onShowLogs,
  onShowUserCommands,
}) => {
  const [documentName, setDocumentName] = useState(null);
  const [isLoadingDocument, setIsLoadingDocument] = useState(false);

  useEffect(() => {
    const fetchDocumentInfo = async () => {
      if (!documentId) {
        setDocumentName(null);
        return;
      }

      setIsLoadingDocument(true);
      try {
        const document = await documentService.getDocument(documentId);
        setDocumentName(document.filename);
      } catch (error) {
        console.error('Error fetching document info:', error);
        toast.error('Failed to load PDF info');
        setDocumentName('Unknown PDF');
      } finally {
        setIsLoadingDocument(false);
      }
    };

    fetchDocumentInfo();
  }, [documentId]);

  const handleRemoveDocument = () => {
    if (window.confirm('Are you sure you want to remove the PDF from this mind map? RAG features will be disabled.')) {
      onRemoveDocument();
      setDocumentName(null);
      toast.success('PDF removed from mind map');
    }
  };

  const handleDownloadPDF = async () => {
    if (!documentId) return;

    try {
      toast.loading('Downloading PDF...', { id: 'download-pdf' });
      const blob = await documentService.downloadPDF(documentId);

      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('PDF downloaded successfully!', { id: 'download-pdf' });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast.error('Failed to download PDF', { id: 'download-pdf' });
    }
  };

  return (
    <div className="toolbar-container">
      <div className="toolbar-group">
        <span className="toolbar-group-label">Nodes</span>
        <button
          className="toolbar-btn"
          onClick={onAddNode}
          title="Add child node"
          disabled={!selectedNode}
        >
          <Plus size={18} />
          <span>Add</span>
        </button>
        <button
          className="toolbar-btn delete"
          onClick={onDeleteNode}
          title="Delete node"
          disabled={!selectedNode}
        >
          <Trash2 size={18} />
          <span>Delete</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={onReorganize}
          title="Reorganize nodes to initial positions"
        >
          <LayoutGrid size={18} />
          <span>Reorganize</span>
        </button>
      </div>
      {documentId && (
        <div className="toolbar-group pdf-indicator">
          <FileText size={18} className="pdf-icon" />
          <span className="pdf-label">PDF Active</span>
          <div className="pdf-badge">
            {isLoadingDocument ? 'Loading...' : (documentName || 'Unknown PDF')}
          </div>
          <button
            className="toolbar-btn pdf-action-btn"
            onClick={handleDownloadPDF}
            title="Download PDF"
            disabled={isLoadingDocument}
          >
            <Download size={16} />
          </button>
          <button
            className="toolbar-btn delete pdf-remove-btn"
            onClick={handleRemoveDocument}
            title="Remove PDF from mind map"
          >
            <X size={16} />
          </button>
        </div>
      )}
      <div className="toolbar-group">
        <span className="toolbar-group-label">History</span>
        <button
          className="toolbar-btn"
          onClick={onUndo}
          title="Undo"
          disabled={!canUndo}
        >
          <Undo size={18} />
          <span>Undo</span>
        </button>
        <button
          className="toolbar-btn"
          onClick={onRedo}
          title="Redo"
          disabled={!canRedo}
        >
          <Redo size={18} />
          <span>Redo</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onShowUserCommands}
          title="User-defined commands"
        >
          <Terminal size={18} />
          <span>User Commands</span>
        </button>
      </div>
      <div className="toolbar-group">
        <button
          className="toolbar-btn"
          onClick={onShowLogs}
          title="View activity logs"
        >
          <FileSearch size={18} />
          <span>Logs</span>
        </button>
      </div>
    </div>
  );
};

export default Toolbar;
