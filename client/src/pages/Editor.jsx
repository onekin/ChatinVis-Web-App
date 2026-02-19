import { useState, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Sparkles, Save, Share2, Settings } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
} from 'reactflow';
import 'reactflow/dist/style.css';

import './Editor.css';
import Toolbar from '../components/editor/Toolbar';
import SettingsPanel from '../components/editor/SettingsPanel';
import LogsViewer from '../components/editor/LogsViewer';
import NodeDetailPanel from '../components/editor/NodeDetailPanel';
import CommandExecutionMenu from '../components/editor/CommandExecutionMenu';
import UserCommandsPanel from '../components/editor/UserCommandsPanel';
import MindMapNode from '../models/MindMapNode';
import IAService from '../services/IAServices';
import { mapService } from '../services/mapService';
import nodeLogService from '../services/nodeLogService';
import { editorReducer, getInitialState, actionCreators } from '../reducers/editorReducer';
import { findNodeById, calculateChildrenPositions, findParentNode, getNodePath } from '../utils/nodeUtils';
import ReactFlowNode from '../components/editor/ReactFlowNode';
import { useMapData } from '../context/MapDataContext';

const nodeTypes = {
  custom: ReactFlowNode,
};

const treeToFlow = (
  node,
  editingNodeId,
  editingText,
  onNodeDoubleClick,
  onNodeClick,
  onAddChild,
  onAddSibling,
  onToggleCollapse,
  onSummarize,
  onStyleChange,
  onFeedbackChange,
  onTextChange,
  onSubmit,
  isLoading,
  selectedNodeId,
  mindMapId,
  onPDFUploaded,
  onGenerateDirectly,
  detailsPopupNodeId,
  onToggleDetailsPopup
) => {
  const nodes = [];
  const edges = [];

  function traverse(node, parentId = null) {
    const isEditing = editingNodeId === node.id;
    nodes.push({
      id: node.id,
      type: 'custom',
      position: { x: node.x, y: node.y },
      data: {
        node: { ...node, text: isEditing ? editingText : node.text },
        isEditing,
        onTextChange,
        onSubmit,
        isLoading,
        onNodeDoubleClick,
        onNodeClick,
        onAddChild,
        onAddSibling,
        onToggleCollapse,
        onSummarize,
        onStyleChange,
        onFeedbackChange,
        selected: node.id === selectedNodeId,
        mindMapId,
        onGenerateDirectly,
        onPDFUploaded,
        showDetailsPopup: detailsPopupNodeId === node.id,
        onToggleDetailsPopup,
      },
    });

    if (parentId) {
      edges.push({
        id: `e${parentId}-${node.id}`,
        source: parentId,
        target: node.id,
        animated: true,
      });
    }

    if (node.children && !node.collapsed) {
      node.children.forEach(child => traverse(child, node.id));
    }
  }

  traverse(node);
  return { nodes, edges };
};

// Determines child type based on parent type
function getChildType(parentType, pathLength = 0) {
  // Alternating flow: question → answer → question → answer...

  if (parentType === 'question') {
    return 'answer';  // Questions generate answers
  } else if (parentType === 'answer') {
    return 'question';   // Answers generate questions
  }
  return 'answer'; // fallback
}

const Editor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const initialMapId = location.state?.mapId;
  const [mapId, setMapId] = useState(initialMapId);

  // Estado del editor con reducer
  const initialRootNode = useMemo(() =>
    new MindMapNode('root', 'Central Topic', 200, 400, 'question'), []
  );
  const [state, dispatch] = useReducer(editorReducer, initialRootNode, getInitialState);

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // UI States
  const [mapName, setMapName] = useState('Untitled map');
  const [editingNodeId, setEditingNodeId] = useState(null);
  const [editingText, setEditingText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [isUserCommandsOpen, setIsUserCommandsOpen] = useState(false);
  const [documentId, setDocumentId] = useState(null);
  const [detailsPopupNodeId, setDetailsPopupNodeId] = useState(null);
  
  // User commands state
  const [userCommands, setUserCommands] = useState([]);
  const [commandMenuVisible, setCommandMenuVisible] = useState(false);
  const [commandMenuPosition, setCommandMenuPosition] = useState({ x: 0, y: 0 });
  const [commandMenuNode, setCommandMenuNode] = useState(null);

  // Get framework config from context
  const { frameworkConfig, updateFrameworkConfig } = useMapData();
  
  // Use a ref to always have the latest frameworkConfig value
  const frameworkConfigRef = useRef(frameworkConfig);
  useEffect(() => {
    frameworkConfigRef.current = frameworkConfig;
  }, [frameworkConfig]);

  // State to show/hide sidebar
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const iaService = useMemo(() => new IAService(), []);

  const handlePDFUploaded = useCallback((documentId) => {
    console.log('PDF uploaded, updating documentId:', documentId);
    setDocumentId(documentId);
    toast.success('PDF linked to this mind map. RAG is now active!', { duration: 3000 });
  }, []);

  // Load user commands on mount
  useEffect(() => {
    const loadUserCommands = async () => {
      try {
        const commands = await iaService.getUserCommands();
        console.log('Loaded user commands:', commands);
        setUserCommands(commands);
      } catch (error) {
        console.error('Failed to load user commands:', error);
      }
    };
    loadUserCommands();
  }, []);

  const handleRemoveDocument = useCallback(async () => {
    console.log('Removing PDF from mind map');
    setDocumentId(null);

    // If map is saved, persist the change
    if (mapId) {
      try {
        await mapService.saveMindMapState(mapId, {
          tree: state.tree,
          title: mapName,
          documentId: null
        });
        console.log('Document removed and map saved');
      } catch (error) {
        console.error('Error saving map after removing document:', error);
        toast.error('Failed to persist document removal');
      }
    }
  }, [mapId, state.tree, mapName]);

  // Function to reload framework from database
  const reloadFrameworkFromDB = useCallback(async () => {
    if (!mapId) return;
    
    try {
      console.log('Reloading framework config from DB...');
      const mapData = await mapService.getMapById(mapId);
      
      if (mapData.frameworkConfig && mapData.frameworkConfig.enabled) {
        console.log(' Framework config reloaded:', mapData.frameworkConfig);
        updateFrameworkConfig(mapData.frameworkConfig);
      } else {
        console.log(' No framework config in map');
        updateFrameworkConfig(null);
      }
    } catch (error) {
      console.error('Error reloading framework:', error);
    }
  }, [mapId, updateFrameworkConfig]);

  // Load map from database if mapId exists
  useEffect(() => {
    const loadMap = async () => {
      if (!mapId) {
        console.log('No mapId provided, starting with blank map');
        return;
      }

      try {
        console.log(' Loading map with ID:', mapId);
        toast.loading('Loading map...', { id: 'load-map' });

        const mapData = await mapService.getMapById(mapId);
        console.log(' Map data received:', mapData);

        if (mapData.title) {
          setMapName(mapData.title);
        }

        if (mapData.documentId) {
          setDocumentId(mapData.documentId);
          console.log(' PDF documentId loaded:', mapData.documentId);
        }

        // Load framework config from map data and update context
        if (mapData.frameworkConfig && mapData.frameworkConfig.enabled) {
          console.log(' Framework config loaded from map:', mapData.frameworkConfig);
          updateFrameworkConfig(mapData.frameworkConfig);
        } else {
          // If map has no framework config, clear the context
          console.log(' No framework config in map, clearing context');
          updateFrameworkConfig(null);
        }

        // Check if we have a saved tree structure
        if (mapData.treeStructure) {
          console.log(' Loading tree structure from database');

          // Recursively reconstruct MindMapNode objects from the saved tree
          const reconstructTree = (nodeData) => {
            if (!nodeData) return null;

            const node = new MindMapNode(
              nodeData.id,
              nodeData.text,
              nodeData.x || 200,
              nodeData.y || 400,
              nodeData.type || 'question'
            );

            // Copy all properties
            node.width = nodeData.width || 200;
            node.height = nodeData.height || 80;
            node.fontSize = nodeData.fontSize || 16;
            // Preserve constructor defaults when server data omits colors
            node.backgroundColor = nodeData.backgroundColor || node.backgroundColor;
            node.borderColor = nodeData.borderColor || node.borderColor;
            node.borderWidth = nodeData.borderWidth || 2;
            node.description = nodeData.description || '';
            node.source = nodeData.source || '';
            node.collapsed = nodeData.collapsed || false;
            node.hasGeneratedChildren = nodeData.hasGeneratedChildren || false;

            // Restore feedback
            if (nodeData.feedback) {
              node.feedback = {
                message: nodeData.feedback.message || '',
                rating: typeof nodeData.feedback.rating === 'number' ? nodeData.feedback.rating : null
              };
            }

            // Recursively reconstruct children
            if (nodeData.children && Array.isArray(nodeData.children)) {
              node.children = nodeData.children.map(child => reconstructTree(child));
            } else {
              node.children = [];
            }

            return node;
          };

          const reconstructedTree = reconstructTree(mapData.treeStructure);

          if (reconstructedTree) {
            console.log(' Tree reconstructed successfully');
            dispatch(actionCreators.setTree(reconstructedTree));
            toast.success('Map loaded successfully!', { id: 'load-map' });
          } else {
            console.error(' Failed to reconstruct tree');
            toast.error('Failed to load map structure', { id: 'load-map' });
          }
        } else if (mapData.nodes && Array.isArray(mapData.nodes) && mapData.nodes.length > 0) {
          // Fallback: Load only root node if no tree structure is saved
          console.log(' No tree structure found, loading root node only');

          const rootNodeData = mapData.nodes.find(n => n.type === 'root' || n.type === 'question');

          if (rootNodeData) {
            const rootNode = new MindMapNode(
              rootNodeData.id,
              rootNodeData.text,
              rootNodeData.x || 200,
              rootNodeData.y || 400,
              rootNodeData.type || 'question'
            );

            // Copy properties
            rootNode.width = rootNodeData.width || 200;
            rootNode.height = rootNodeData.height || 80;
            rootNode.fontSize = rootNodeData.fontSize || 16;
            // Preserve constructor defaults when server data omits colors
            rootNode.backgroundColor = rootNodeData.backgroundColor || rootNode.backgroundColor;
            rootNode.borderColor = rootNodeData.borderColor || rootNode.borderColor;
            rootNode.borderWidth = rootNodeData.borderWidth || 2;
            rootNode.description = rootNodeData.description || '';
            rootNode.source = rootNodeData.source || '';
            rootNode.collapsed = rootNodeData.collapsed || false;
            rootNode.hasGeneratedChildren = rootNodeData.hasGeneratedChildren || false;
            rootNode.children = [];

            // Restore feedback
            if (rootNodeData.feedback) {
              rootNode.feedback = {
                message: rootNodeData.feedback.message || '',
                rating: typeof rootNodeData.feedback.rating === 'number' ? rootNodeData.feedback.rating : null
              };
            }

            dispatch(actionCreators.setTree(rootNode));
            toast.success('Map loaded (root only)', { id: 'load-map' });
          } else {
            console.warn(' No root node found in map data');
          }
        } else {
          console.log('Map has no nodes, starting fresh');
          toast.success('Map loaded (empty)', { id: 'load-map' });
        }
      } catch (error) {
        console.error(' Error loading map:', error);
        toast.error('Failed to load map', { id: 'load-map' });
      }
    };

    loadMap();
  }, [mapId, dispatch]);

  // Auto-create map when starting fresh (no mapId)
  useEffect(() => {
    const createInitialMap = async () => {
      if (mapId) {
        // Map already exists
        return;
      }

      try {
        console.log(' Creating initial map...');
        const result = await mapService.createMap({
          title: mapName,
          treeStructure: state.tree
        });

        if (result.id || result._id) {
          const newMapId = result.id || result._id;
          setMapId(newMapId);
          console.log(' Initial map created with ID:', newMapId);
          toast.success('Map created', { duration: 2000 });
        }
      } catch (error) {
        console.error('Error creating initial map:', error);
      }
    };

    // Create map after a small delay to ensure tree is initialized
    const timer = setTimeout(() => {
      createInitialMap();
    }, 500);

    return () => clearTimeout(timer);
  }, []); // Only run once on mount

  // Debug: Log when frameworkConfig changes
  useEffect(() => {
    console.log('Editor: frameworkConfig changed to:', frameworkConfig);
  }, [frameworkConfig]);

  // Sync map name with root node text
  useEffect(() => {
    if (state.tree && state.tree.text) {
      // Only update if the root node has a meaningful text and the map name hasn't been manually changed
      const rootNodeText = state.tree.text;
      if (rootNodeText !== 'Central Topic' && rootNodeText !== mapName) {
        setMapName(rootNodeText);
      }
    }
  }, [state.tree.text]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // F9 to toggle sidebar
      if (e.key === 'F9') {
        e.preventDefault();
        setSidebarVisible(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [editingNodeId]);

  // Get current selected node from tree
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return findNodeById(state.tree, selectedNodeId);
  }, [state.tree, selectedNodeId]);


  // Sync nodeProperties with selected node
  const nodeProperties = useMemo(() => {
    if (!selectedNode) {
      return {
        width: 200,
        height: 80,
        fontSize: 16,
        backgroundColor: '#ffffff',
        borderColor: '#8b5cf6',
        borderWidth: 2
      };
    }
    return {
      width: selectedNode.width || 200,
      height: selectedNode.height || 80,
      fontSize: selectedNode.fontSize || 16,
      backgroundColor: selectedNode.backgroundColor || '#ffffff',
      borderColor: selectedNode.borderColor || '#8b5cf6',
      borderWidth: selectedNode.borderWidth || 2
    };
  }, [selectedNode]);

  // Simple click handler: select node
  const handleNodeClick = useCallback((e, node) => {
    // Ctrl/Cmd + Click - open command menu
    if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      setCommandMenuNode(node);
      setCommandMenuPosition({
        x: e.clientX,
        y: e.clientY
      });
      setCommandMenuVisible(true);
      return;
    }

    if (e.button === 2) {
      // Right click - open detail panel
      setSelectedNodeId(node.id);
      setIsDetailPanelOpen(true);
      return;
    }
    if (e.button !== 0) return;
    e.stopPropagation();
    setSelectedNodeId(node.id);
    setDetailsPopupNodeId(null); // Close details popup when clicking on another node
  }, []);

  // Handler for command execution result
  const handleCommandExecute = useCallback((result, command) => {
    console.log('Command executed:', command.name, result);
    
    // Prepare file content and extension
    let content = result.result;
    let extension = 'txt';
    let mimeType = 'text/plain';
    
    switch (command.outputType) {
      case 'text':
        extension = 'txt';
        mimeType = 'text/plain';
        if (typeof content !== 'string') {
          content = JSON.stringify(content, null, 2);
        }
        break;
        
      case 'json':
        extension = 'json';
        mimeType = 'application/json';
        content = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
        break;
        
      case 'html snippet':
        extension = 'html';
        mimeType = 'text/html';
        break;
        
      case 'svg':
        extension = 'svg';
        mimeType = 'image/svg+xml';
        break;
        
      default:
        if (typeof content !== 'string') {
          content = JSON.stringify(content, null, 2);
        }
    }
    
    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${command.name}_${timestamp}.${extension}`;
    
    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
    
    toast.success(`Result saved as ${filename}`);
    console.log('Result saved:', filename, content);
  }, []);

  // Double click handler: enter edit mode
  const handleNodeDoubleClick = useCallback((e, node) => {
    e.stopPropagation();
    setEditingNodeId(node.id);
    setEditingText(node.text);
    setSelectedNodeId(null); // Deselect while editing
  }, []);

  // Update a node property
  const handlePropertyChange = useCallback((property, value) => {
    if (!selectedNodeId) return;

    dispatch(actionCreators.updateNodeProperty(selectedNodeId, property, value));
  }, [selectedNodeId]);

  // Update multiple node styles
  const handleStyleChange = useCallback(async (node, styles) => {
    if (!node || !node.id) return;

    // Log style changes
    try {
      for (const [property, value] of Object.entries(styles)) {
        // Determine action type based on property
      }
    } catch (logError) {
      console.error('Failed to create style change log:', logError);
    }

    Object.entries(styles).forEach(([property, value]) => {
      dispatch(actionCreators.updateNodeProperty(node.id, property, value));
    });
  }, [dispatch, mapId]);

  // Update node feedback
  const handleFeedbackChange = useCallback(async (node, feedback) => {
    if (!node || !node.id) return;

    try {
      // Determine if it's new feedback or edit
      const isEdit = node.feedback && (node.feedback.rating !== null || node.feedback.message);
      const action = isEdit ? 'editFeedback' : 'newFeedback';

      // Log action
      await nodeLogService.createLog(
        action,
        node.id,
        mapId,
        null,
        {
          rateValue: feedback.rating,
          userAnnotation: feedback.message
        }
      );
    } catch (logError) {
      console.error('Failed to create feedback log:', logError);
    }

    dispatch(actionCreators.updateNodeFeedback(node.id, feedback));
  }, [dispatch, mapId]);

  const handleCanvasClick = useCallback(() => {
    setEditingNodeId(null);
    setSelectedNodeId(null);
    setDetailsPopupNodeId(null); // Close details popup when clicking on canvas
  }, []);

  // Add a child node
  const handleAddNode = useCallback(async () => {
    if (!selectedNode) return;

    // Get pathLength to determine correct child type
    const nodePath = getNodePath(state.tree, selectedNodeId);
    const pathLength = nodePath?.length || 0;

    // Create new child node - dynamic layout will position it automatically
    const newChild = new MindMapNode(
      `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      'New Node',
      selectedNode.x + 300, // Temporary X position (layout will adjust)
      selectedNode.y,       // Temporary Y position (layout will adjust)
      getChildType(selectedNode.type, pathLength)
    );

    dispatch(actionCreators.addChild(selectedNodeId, newChild));
  }, [selectedNode, selectedNodeId, mapId, state.tree]);

  const handleAddChildToNode = useCallback(async (parentNode) => {
    // Get pathLength to determine correct child type
    const nodePath = getNodePath(state.tree, parentNode.id);
    const pathLength = nodePath?.length || 0;

    // Create new child node - dynamic layout will position it automatically
    const newChild = new MindMapNode(
      `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      'New Node',
      parentNode.x + 300, // Temporary X position (layout will adjust)
      parentNode.y,       // Temporary Y position (layout will adjust)
      getChildType(parentNode.type, pathLength)
    );

    dispatch(actionCreators.addChild(parentNode.id, newChild));
  }, [state.tree, mapId]);

  // Add sibling to node
  const handleAddSibling = useCallback(async (node) => {
    // Root node cannot have siblings
    if (node.id === state.tree.id) {
      toast.error('Root node cannot have siblings');
      return;
    }

    // Find parent of current node
    const parentNode = findParentNode(state.tree, node.id);

    if (!parentNode) {
      toast.error('Cannot add sibling: parent node not found');
      return;
    }

    // Find index of current node among its siblings
    const siblingIndex = parentNode.children.findIndex(child => child.id === node.id);

    if (siblingIndex === -1) {
      toast.error('Error finding node position');
      return;
    }

    // Calculate position ABOVE current node
    const verticalSpacing = 120;

    // Create new sibling with SAME type as current node (no alternation)
    const newSibling = new MindMapNode(
      `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      'New Node',
      node.x,                    // Same X as current node
      node.y - verticalSpacing,  // ABOVE current node
      node.type                  // SAME type (no alternation)
    );


    // Insert sibling at specific position (before current node)
    dispatch(actionCreators.addSiblingAtIndex(parentNode.id, newSibling, siblingIndex));
  }, [state.tree, dispatch, mapId]);

  // Eliminar un nodo
  const handleDeleteNode = useCallback(async () => {
    if (!selectedNode || selectedNode.id === 'root') {
      alert('Cannot delete the root node');
      return;
    }

    dispatch(actionCreators.deleteNode(selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNode, selectedNodeId, mapId]);

  // Toggle colapsar/expandir nodo
  const handleToggleCollapse = useCallback((node) => {
    dispatch(actionCreators.toggleCollapse(node.id));
  }, []);

  // Compact/summarize child nodes
  const handleSummarize = useCallback(async (parentNode, targetCount) => {
    if (!parentNode || !parentNode.children || parentNode.children.length <= 1) {
      toast.error('Node must have at least 2 children to compact');
      return;
    }

    if (targetCount < 2) {
      toast.error('You must create at least 2 clusters');
      return;
    }

    if (targetCount >= parentNode.children.length) {
      toast.error('Target number must be less than current children count');
      return;
    }

    try {
      setIsLoading(true);
      toast.loading(`🤖 Analyzing ${parentNode.children.length} nodes...`, { id: 'summarize', duration: Infinity });

      // Prepare nodes for API
      const nodesToAggregate = parentNode.children.map(child => ({
        text: child.text,
        description: child.description || '',
        title: child.text
      }));

      toast.loading(`🔄 Compacting into ${targetCount} clusters...`, { id: 'summarize', duration: Infinity });

      // Call aggregation API
      const clusters = await iaService.aggregateNodes(
        parentNode.text,
        nodesToAggregate,
        targetCount
      );

      console.log('Clusters received:', clusters);

      toast.loading(`✨ Creating ${clusters.length} new nodes...`, { id: 'summarize', duration: Infinity });

      // Calculate positions for new nodes
      const positions = calculateChildrenPositions(parentNode, clusters.length, state.tree);

      // Determine child type based on depth
      const nodePath = getNodePath(state.tree, parentNode.id);
      const pathLength = nodePath?.length || 0;
      const childType = getChildType(parentNode.type, pathLength);

      // Create new nodes from clusters
      const newChildren = clusters.map((cluster, index) => {
        const position = positions[index];
        const clusterText = cluster.cluster_name || `Cluster ${index + 1}`;
        const clusterDescription = cluster.description || '';

        // Create extended description including grouped items
        const itemsList = cluster.clusteredItems?.map(item =>
          typeof item === 'string' ? item : (item.text || item.title || '')
        ).filter(Boolean).join(', ') || '';

        const fullDescription = itemsList
          ? `${clusterDescription}\n\nIncludes: ${itemsList}`
          : clusterDescription;

        const childNode = new MindMapNode(
          `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          clusterText,
          position.x,
          position.y,
          childType,
          fullDescription,
          'AI - Compaction'
        );
        return childNode;
      });

      // Replace parent node children
      dispatch(actionCreators.replaceChildren(parentNode.id, newChildren));

      // Log summarize action
      try {
        await nodeLogService.logSummarize(parentNode.id, mapId, {
          originalCount: parentNode.children.length,
          targetCount: targetCount,
          clustersCreated: newChildren.map(n => n.text)
        });
      } catch (logError) {
        console.error('Failed to create summarize log:', logError);
      }

      toast.success(`✅ Compaction successful! ${parentNode.children.length} → ${targetCount} nodes`, {
        id: 'summarize',
        duration: 4000
      });
    } catch (error) {
      console.error('Error compacting nodes:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      toast.error(`❌ Error compacting: ${errorMessage}`, {
        id: 'summarize',
        duration: 5000
      });
    } finally {
      setIsLoading(false);
    }
  }, [iaService, dispatch, state.tree]);

  // Reorganize all nodes to initial positions
  const handleReorganize = () => {
    dispatch(actionCreators.resetPositions());
  };

  const handleUndo = () => dispatch(actionCreators.undo());
  const handleRedo = () => dispatch(actionCreators.redo());

  const canUndo = state.historyIndex > 0;
  const canRedo = state.historyIndex < state.history.length - 1;

  // Reset view
  const handleResetView = () => {
    // React Flow's controls handle this
  };

  // Update editing text
  const handleTextChange = useCallback((text) => {
    setEditingText(text);
  }, []);

  const handleUpdateDescription = useCallback((nodeId, description) => {
    dispatch(actionCreators.updateNodeProperty(nodeId, 'description', description));
    console.log(' Description updated for node:', nodeId);
  }, []);

  // Generate child nodes directly without entering edit mode
  const handleGenerateDirectly = useCallback(async (parentNode) => {
    if (!parentNode) return;

    setIsLoading(true);

    try {
      const nodePath = getNodePath(state.tree, parentNode.id);

      console.log(' Generating nodes for:', parentNode.text);
      toast.loading('🤖 Generating nodes with AI...', { id: 'generate', duration: Infinity });

      const nodeCount = parseInt(localStorage.getItem('mindinvis_node_count') || '3');
      const nodeContext = nodePath && parentNode && nodePath.length > 1
        ? {
            pathLength: nodePath.length,
            fullPath: nodePath.map(n => n.text),
            firstQuestion: nodePath[0]?.text || '',
            previousQuestion: nodePath[nodePath.length - 2]?.text || '',
            currentAnswer: parentNode.type === 'answer' ? parentNode.text : nodePath[nodePath.length - 2]?.text || '',
            currentAnswerNote: parentNode.type === 'answer' ? (parentNode.description || '') : (nodePath[nodePath.length - 2]?.description || '')
          }
        : null;

      console.log('Editor: Generating nodes with frameworkConfig:', frameworkConfigRef.current);
      const responses = await iaService.generateNodes(
        parentNode.text,
        parentNode.type,
        nodeCount,
        nodeContext,
        documentId,
        frameworkConfigRef.current
      );

      const positions = calculateChildrenPositions(parentNode, responses.length, state.tree);
      const pathLength = nodePath?.length || 0;
      const childType = getChildType(parentNode.type, pathLength);

      const childrenNodes = responses.map((response, index) => {
        const position = positions[index];
        const text = typeof response === 'string' ? response : (response.text || '');
        const description = typeof response === 'object' ? (response.description || '') : '';
        const source = typeof response === 'object' ? (response.source || 'Generated by AI') : 'Generated by AI';
        const citation = typeof response === 'object' ? (response.citation || null) : null;

        const childNode = new MindMapNode(
          `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          text,
          position.x,
          position.y,
          childType,
          description,
          source,
          citation
        );

        // If PDF is uploaded, make nodes lighter
        if (documentId) {
          if (childType === 'question') {
            childNode.backgroundColor = '#3b82f6';
            childNode.borderColor = '#60a5fa';
          } else if (childType === 'answer') {
            childNode.backgroundColor = '#10b981';
            childNode.borderColor = '#34d399';
          }
        }

        return childNode;
      });

      dispatch(actionCreators.addChildren(parentNode.id, childrenNodes));

      try {
        if (mapId) {
          const action = documentId ? 'askQuestionWithPDF' : 'askQuestion';
          const logValue = {
            question: parentNode.text,
            answer: `Generated ${childrenNodes.length} nodes`,
            nodes: childrenNodes.map(n => n.text)
          };

          await nodeLogService.createLog(
            action,
            parentNode.id,
            mapId,
            documentId ? `PDF Document: ${documentId}` : null,
            logValue
          );
          console.log(' Log created for node generation');
        }
      } catch (logError) {
        console.error('Failed to create log:', logError);
      }

      const citationCount = childrenNodes.filter(n => n.citation).length;
      if (documentId && citationCount > 0) {
        toast.success(`✅ Generated ${childrenNodes.length} nodes with ${citationCount} PDF citations`, { id: 'generate', duration: 3000 });
      } else {
        toast.success(`✅ Generated ${childrenNodes.length} nodes`, { id: 'generate', duration: 3000 });
      }
    } catch (error) {
      console.error('Failed to generate nodes:', error);
      toast.error('❌ Failed to generate nodes', { id: 'generate' });
    } finally {
      setIsLoading(false);
    }
  }, [state.tree, mapId, documentId, iaService]);

  // Submit text changes and generate child nodes with AI
  const handleSubmit = useCallback(async () => {
    const editingNode = findNodeById(state.tree, editingNodeId);

    if (!editingNode || !editingText.trim()) {
      setEditingNodeId(null);
      setEditingText('');
      return;
    }


    // Update node text
    dispatch(actionCreators.updateNodeText(editingNodeId, editingText));

    // If editing the root node, update the map name as well
    if (editingNodeId === state.tree.id) {
      setMapName(editingText);
    }

    // Generate child nodes ONLY if not generated before
    if (!editingNode.hasGeneratedChildren) {
      setIsLoading(true);

      if (documentId) {
        toast.loading('🔍 Searching PDF for relevant context...', { id: 'generate', duration: Infinity });
      } else {
        toast.loading('🤖 Generating nodes with AI...', { id: 'generate', duration: Infinity });
      }

      try {
        // Get full path of current node (for context)
        const nodePath = getNodePath(state.tree, editingNodeId);
        const currentNode = findNodeById(state.tree, editingNodeId);

        console.log(' DEBUG currentNode:', {
          id: currentNode?.id,
          type: currentNode?.type,
          text: currentNode?.text,
          hasGeneratedChildren: currentNode?.hasGeneratedChildren
        });

        console.log(' DEBUG nodePath:', {
          pathLength: nodePath?.length,
          fullPath: nodePath?.map(n => `${n.text} (${n.type})`).join(' → '),
          isRoot: nodePath?.length === 1
        });

        // Build node context ALWAYS (for all levels)
        // Context helps AI generate more coherent answers/questions
        let nodeContext = null;
        if (nodePath && currentNode && nodePath.length > 1) {
          // Only send context if NOT root node (level 1)
          const pathLength = nodePath.length;
          const rootNode = nodePath[0];
          const parentNode = pathLength > 1 ? nodePath[pathLength - 2] : null;

          nodeContext = {
            pathLength: pathLength,
            fullPath: nodePath.map(n => n.text),
            firstQuestion: rootNode?.text || '',
            previousQuestion: parentNode?.text || '',
            currentAnswer: currentNode.type === 'answer' ? editingText : parentNode?.text || '',
            currentAnswerNote: currentNode.type === 'answer' ? (currentNode.description || '') : (parentNode?.description || '')
          };

          console.log(' CONTEXT DETECTED:', {
            nodeType: currentNode.type,
            pathLength: nodeContext.pathLength,
            fullPath: nodeContext.fullPath,
            firstQuestion: nodeContext.firstQuestion,
            previousQuestion: nodeContext.previousQuestion,
            currentAnswer: nodeContext.currentAnswer
          });
        } else {
          console.log(' No context (Root node - Level 1)');
        }

        // Call real API with node type and optional context
        // Send PARENT TYPE (not child) so server knows whether to use context
        const nodeCount = parseInt(localStorage.getItem('chatinvis_node_count') || '3');
        console.log('Editor: Generating nodes from edit with frameworkConfig:', frameworkConfigRef.current);
        const responses = await iaService.generateNodes(
          editingText,
          currentNode.type,  // PARENT TYPE (question or answer)
          nodeCount, // Number of nodes to generate from config
          nodeContext,
          documentId,  // Pass documentId for RAG
          frameworkConfigRef.current  // Pass framework config from ref for latest value
        );

        const positions = calculateChildrenPositions(currentNode, responses.length, state.tree);

        // Calculate child type based on parent type and depth
        const pathLength = nodePath?.length || 0;
        const childType = getChildType(currentNode.type, pathLength);

        const childrenNodes = responses.map((response, index) => {
          const position = positions[index];
          // Extract text, description, source and citation from response
          const text = typeof response === 'string' ? response : (response.text || '');
          const description = typeof response === 'object' ? (response.description || '') : '';
          const source = typeof response === 'object' ? (response.source || 'Generated by AI') : 'Generated by AI';
          const citation = typeof response === 'object' ? (response.citation || null) : null;

          const childNode = new MindMapNode(
            `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
            text,
            position.x,
            position.y,
            childType,
            description,
            source,
            citation
          );

          // If PDF is uploaded, make nodes lighter
          if (documentId) {
            if (childType === 'question') {
              childNode.backgroundColor = '#3b82f6';
              childNode.borderColor = '#60a5fa';
            } else if (childType === 'answer') {
              childNode.backgroundColor = '#10b981';
              childNode.borderColor = '#34d399';
            }
          }

          return childNode;
        });

        dispatch(actionCreators.addChildren(editingNodeId, childrenNodes));

        // Log node generation
        try {
          if (mapId) {
            const action = documentId ? 'askQuestionWithPDF' : 'askQuestion';
            const logValue = {
              question: editingText,
              answer: `Generated ${childrenNodes.length} nodes`,
              nodes: childrenNodes.map(n => n.text)
            };

            await nodeLogService.createLog(
              action,
              editingNodeId,
              mapId,
              documentId ? `PDF Document: ${documentId}` : null,
              logValue
            );
            console.log(' Log created for node generation');
          }
        } catch (logError) {
          console.error('Failed to create log:', logError);
        }

        const citationCount = childrenNodes.filter(n => n.citation).length;
        if (documentId && citationCount > 0) {
          toast.success(`✅ Generated ${childrenNodes.length} nodes with ${citationCount} PDF citations`, { id: 'generate', duration: 3000 });
        } else {
          toast.success(`✅ Generated ${childrenNodes.length} nodes`, { id: 'generate', duration: 3000 });
        }
      } catch (error) {
        console.error('Failed to generate nodes:', error);
        toast.error('❌ Failed to generate nodes', { id: 'generate' });
      } finally {
        setIsLoading(false);
      }
    }

    setEditingNodeId(null);
    setEditingText('');
  }, [editingNodeId, editingText, state.tree, iaService, dispatch, documentId]);

  const handleToggleDetailsPopup = useCallback((nodeId) => {
    setDetailsPopupNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  useEffect(() => {
    const { nodes, edges } = treeToFlow(
        state.tree,
        editingNodeId,
        editingText,
        handleNodeDoubleClick,
        handleNodeClick,
        handleAddChildToNode,
        handleAddSibling,
        handleToggleCollapse,
        handleSummarize,
        handleStyleChange,
        handleFeedbackChange,
        handleTextChange,
        handleSubmit,
        isLoading,
        selectedNodeId,
        mapId,
        handlePDFUploaded,
        handleGenerateDirectly,
        detailsPopupNodeId,
        handleToggleDetailsPopup
    );
    setNodes(nodes);
    setEdges(edges);
  }, [state.tree, editingNodeId, editingText, isLoading, setNodes, setEdges, handleNodeDoubleClick, handleNodeClick, handleAddChildToNode, handleAddSibling, handleToggleCollapse, handleSummarize, handleStyleChange, handleFeedbackChange, handleTextChange, handleSubmit, selectedNodeId, mapId, handlePDFUploaded, handleGenerateDirectly, detailsPopupNodeId, handleToggleDetailsPopup]);

  const handleNodeDragStop = useCallback((event, draggedNode) => {
    const targetNode = nodes.find(
      (node) =>
        node.id !== draggedNode.id &&
        draggedNode.position.x < node.position.x + node.width &&
        draggedNode.position.x + draggedNode.width > node.position.x &&
        draggedNode.position.y < node.position.y + node.height &&
        draggedNode.position.y + draggedNode.height > node.position.y
    );

          if (targetNode) {
            // Check if they have roughly the same x coordinate for "same column"
            // Allowing for a small tolerance
            const xTolerance = 50; // pixels
            const areInSameColumn = Math.abs(draggedNode.position.x - targetNode.position.x) < xTolerance;

            if (areInSameColumn) {

              dispatch(actionCreators.swapNodes(draggedNode.id, targetNode.id));
              return;
            }
          }
    const originalNode = findNodeById(state.tree, draggedNode.id);
    if (originalNode) {
      setNodes((nds) =>
        nds.map((n) => {
          if (n.id === draggedNode.id) {
            return { ...n, position: { x: originalNode.x, y: originalNode.y } };
          }
          return n;
        })
      );
    }
  }, [nodes, state.tree]);

  // Zoom functions
  const handleZoomIn = () => {
    // React Flow's controls handle this
  };

  const handleZoomOut = () => {
    // React Flow's controls handle this
  };

  // Function to save map
  const handleSave = useCallback(async () => {
    try {
      toast.loading('Saving map...', { id: 'save-map' });

      if (!mapId) {
        // Create new map if it doesn't exist
        console.log('Creating new map...');
        const newMap = await mapService.createMap({
          title: mapName,
          treeStructure: state.tree,
          documentId: documentId,
          frameworkConfig: frameworkConfigRef.current  // Use ref to get latest value
        });

        console.log('New map created with ID:', newMap._id);
        setMapId(newMap._id);

        toast.success('Map created and saved successfully!', { id: 'save-map' });
        return;
      }

      // Update existing map
      await mapService.saveMindMapState(mapId, {
        tree: state.tree,
        title: mapName,
        documentId: documentId,
        frameworkConfig: frameworkConfigRef.current  // Use ref to get latest value
      });

      toast.success('Map saved successfully!', { id: 'save-map' });
    } catch (error) {
      console.error('Error saving map:', error);
      toast.error('Failed to save map. Please try again.', { id: 'save-map' });
    }
  }, [mapId, state.tree, mapName, documentId, frameworkConfig]);

  return (
    <div className="editor-container">
      {/* Header */}
      <header className="editor-header">
        <div className="editor-header-left">
          <button className="back-button" onClick={() => navigate('/')}>
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            value={mapName}
            onChange={(e) => setMapName(e.target.value)}
            className="map-name-input"
          />
        </div>

        <div className="editor-header-right">
          <button className="editor-btn secondary" onClick={handleSave}>
            <Save size={18} />
            Save
          </button>
          <button className="editor-btn secondary">
            <Share2 size={18} />
            Share
          </button>
          <button className="editor-btn primary" onClick={() => setIsSettingsOpen(true)}>
            <Settings size={18} />
            Settings
          </button>
        </div>
      </header>

      {/* Toolbar */}
      <div className="editor-toolbar">
        <Toolbar
          selectedNode={selectedNode}
          onAddNode={handleAddNode}
          onDeleteNode={handleDeleteNode}
          onReorganize={handleReorganize}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          documentId={documentId}
          onRemoveDocument={handleRemoveDocument}
          onShowLogs={() => {
            console.log(' onShowLogs clicked - setting isLogsOpen to true');
            setIsLogsOpen(true);
          }}
          onShowUserCommands={() => setIsUserCommandsOpen(true)}
        />
      </div>

      {/* Canvas */}
      <div style={{ width: '100vw', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          onClick={handleCanvasClick}
          onNodeDragStop={handleNodeDragStop}
          fitView
        >
          <Controls />
          <Background />
          <MiniMap nodeColor={n => n.data.node.backgroundColor} nodeStrokeWidth={3} zoomable pannable />
        </ReactFlow>
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mapId={mapId}
        currentTree={state.tree}
        currentMapName={mapName}
        currentDocumentId={documentId}
        onFrameworkSaved={reloadFrameworkFromDB}
      />

      {/* Logs Viewer */}
      {isLogsOpen && (
        <LogsViewer
          mapId={mapId}
          onClose={() => {
            console.log(' Closing LogsViewer');
            setIsLogsOpen(false);
          }}
        />
      )}
      {console.log(' Editor render - isLogsOpen:', isLogsOpen, 'mapId:', mapId)}

      {/* Node Detail Panel */}
      {isDetailPanelOpen && selectedNode && (
        <NodeDetailPanel
          node={selectedNode}
          onClose={() => setIsDetailPanelOpen(false)}
          onUpdateDescription={handleUpdateDescription}
        />
      )}

      {/* User Commands Panel */}
      {isUserCommandsOpen && (
        <UserCommandsPanel
          onClose={() => setIsUserCommandsOpen(false)}
          onCreateNewCommand={() => {
            console.log('Creating new command');
          }}
        />
      )}

      {/* Command Execution Menu */}
      {commandMenuVisible && commandMenuNode && (
        <CommandExecutionMenu
          node={commandMenuNode}
          nodes={nodes}
          edges={edges}
          commands={userCommands}
          onExecute={handleCommandExecute}
          onClose={() => setCommandMenuVisible(false)}
          position={commandMenuPosition}
        />
      )}

      {/* Toast Notifications */}
      <Toaster
        position="bottom-right"
        reverseOrder={false}
        gutter={8}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#fff',
            color: '#000',
          },
        }}
      />
    </div>
  );
};

export default Editor;
