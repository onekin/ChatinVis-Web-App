import React, { useState, useEffect, useMemo } from 'react';
import IAService from '../../services/IAServices';
import { toast } from 'react-hot-toast';
import './CommandExecutionMenu.css';

const CommandExecutionMenu = ({ 
  node, 
  nodes, 
  edges,
  commands, 
  onExecute, 
  onClose,
  position 
}) => {
  const [selectedCommand, setSelectedCommand] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const iaService = useMemo(() => new IAService(), []);

  // Función para obtener nodos según el scope
  const getNodesForScope = (scope, currentNode) => {
    switch (scope) {
      case 'single_node':
        return [currentNode];
      
      case 'node_and_subnodes':
        // Obtener nodo + todos sus descendientes
        const descendants = getAllDescendants(currentNode.id);
        return [currentNode, ...descendants];
      
      case 'selection':
        // Obtener nodos actualmente seleccionados
        return nodes.filter(n => n.selected || n.id === currentNode.id);
      
      case 'graph':
        // Todos los nodos del grafo
        return nodes;
      
      default:
        return [currentNode];
    }
  };

  const getAllDescendants = (nodeId) => {
    const descendants = [];
    const children = edges
      .filter(e => e.source === nodeId)
      .map(e => nodes.find(n => n.id === e.target))
      .filter(Boolean);
    
    children.forEach(child => {
      descendants.push(child);
      descendants.push(...getAllDescendants(child.id));
    });
    
    return descendants;
  };

  const handleExecute = async () => {
    if (!selectedCommand) {
      toast.error('Please select a command');
      return;
    }

    // Get the actual node data - handle both ReactFlow structure and plain node
    const actualNode = node.data?.node || node;
    const selectedNodes = getNodesForScope(selectedCommand.scope, actualNode);
    
    if (selectedNodes.length === 0) {
      toast.error('No nodes to process');
      return;
    }

    try {
      setIsExecuting(true);
      toast.loading(`Executing ${selectedCommand.name}...`, { id: 'execute-command' });

      // Formatear nodos para el backend
      const formattedNodes = selectedNodes.map(n => ({
        text: n.data?.node?.text || n.text || '',
        description: n.data?.node?.description || n.description || '',
        type: n.data?.node?.type || n.type || 'unknown',
        id: n.id
      }));

      const result = await iaService.executeUserCommand(
        selectedCommand._id,
        formattedNodes
      );
      
      toast.success(`Command executed successfully!`, { id: 'execute-command' });
      
      if (onExecute) {
        onExecute(result, selectedCommand);
      }
      
      onClose();
    } catch (error) {
      console.error('Command execution failed:', error);
      toast.error(error.response?.data?.error || 'Failed to execute command', { 
        id: 'execute-command' 
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Filtrar comandos compatibles con el contexto actual
  const compatibleCommands = useMemo(() => {
    return commands.filter(cmd => {
      // Todos los comandos son compatibles por ahora
      // Podrías añadir lógica adicional aquí
      return true;
    });
  }, [commands]);

  return (
    <div 
      className="command-execution-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 1000
      }}
    >
      <div className="command-execution-header">
        <h3>Run Custom Command</h3>
        <button className="command-execution-close" onClick={onClose}>×</button>
      </div>

      <div className="command-execution-body">
        {compatibleCommands.length === 0 ? (
          <div className="command-execution-empty">
            <p>No commands available</p>
            <small>Create commands in the User Commands panel</small>
          </div>
        ) : (
          <>
            <label>
              <span className="command-label">Select command:</span>
              <select 
                value={selectedCommand?._id || ''} 
                onChange={(e) => {
                  const cmd = compatibleCommands.find(c => c._id === e.target.value);
                  setSelectedCommand(cmd);
                }}
                disabled={isExecuting}
              >
                <option value="">-- Select a command --</option>
                {compatibleCommands.map(cmd => (
                  <option key={cmd._id} value={cmd._id}>
                    {cmd.name}
                  </option>
                ))}
              </select>
            </label>

            {selectedCommand && (
              <div className="command-preview">
                <div className="command-preview-row">
                  <strong>Description:</strong>
                  <span>{selectedCommand.description}</span>
                </div>
                <div className="command-preview-row">
                  <strong>Scope:</strong>
                  <span className="badge">{selectedCommand.scope.replace(/_/g, ' ')}</span>
                </div>
                <div className="command-preview-row">
                  <strong>Output:</strong>
                  <span className="badge">{selectedCommand.outputType}</span>
                </div>
                <div className="command-preview-row">
                  <strong>Nodes to process:</strong>
                  <span className="badge-count">
                    {getNodesForScope(selectedCommand.scope, node.data?.node || node).length} node(s)
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="command-execution-footer">
        <button 
          className="btn-secondary" 
          onClick={onClose}
          disabled={isExecuting}
        >
          Cancel
        </button>
        <button 
          className="btn-primary" 
          onClick={handleExecute} 
          disabled={!selectedCommand || isExecuting}
        >
          {isExecuting ? 'Executing...' : 'Execute'}
        </button>
      </div>
    </div>
  );
};

export default CommandExecutionMenu;
