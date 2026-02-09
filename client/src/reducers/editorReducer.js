import { updateNode, addChildToNode, deleteNode, resetAllPositions, findNodeById, applyDynamicLayout } from '../utils/nodeUtils';

/**
 * Tipos de acciones para el reducer del editor
 */



export const ACTIONS = {
  UPDATE_NODE_TEXT: 'UPDATE_NODE_TEXT',
  UPDATE_NODE_POSITION: 'UPDATE_NODE_POSITION',
  UPDATE_NODE_PROPERTY: 'UPDATE_NODE_PROPERTY',
  UPDATE_NODE_FEEDBACK: 'UPDATE_NODE_FEEDBACK',
  ADD_CHILD: 'ADD_CHILD',
  ADD_SIBLING_AT_INDEX: 'ADD_SIBLING_AT_INDEX',
  ADD_CHILDREN: 'ADD_CHILDREN',
  REPLACE_CHILDREN: 'REPLACE_CHILDREN',
  DELETE_NODE: 'DELETE_NODE',
  SET_TREE: 'SET_TREE',
  MARK_CHILDREN_GENERATED: 'MARK_CHILDREN_GENERATED',
  TOGGLE_COLLAPSE: 'TOGGLE_COLLAPSE',
  RESET_POSITIONS: 'RESET_POSITIONS',
  SWAP_NODES: 'SWAP_NODES',
  UNDO: 'UNDO',
  REDO: 'REDO'
};

/**
 * Estado inicial del editor
 */
export function getInitialState(rootNode) {
  return {
    tree: rootNode,
    history: [rootNode],
    historyIndex: 0,
    maxHistory: 50
  };
}

/**
 * Reducer principal del editor
 * Maneja todas las modificaciones al árbol de nodos de forma inmutable
 */
export function editorReducer(state, action) {
  switch (action.type) {
    case ACTIONS.UPDATE_NODE_TEXT: {
      const { nodeId, text } = action.payload;
      const newTree = updateNode(state.tree, nodeId, (node) => ({
        text,
        lastModified: Date.now()
      }));

      return addToHistory(state, newTree);
    }

    case ACTIONS.UPDATE_NODE_POSITION: {
      const { nodeId, x, y } = action.payload;
      const newTree = updateNode(state.tree, nodeId, () => ({
        x,
        y,
        lastModified: Date.now()
      }));

      // No añadir al historial durante el drag (demasiadas actualizaciones)
      return {
        ...state,
        tree: newTree
      };
    }

    case ACTIONS.UPDATE_NODE_PROPERTY: {
      const { nodeId, property, value } = action.payload;

      // Validar el valor según la propiedad
      const validatedValue = validatePropertyValue(property, value);

      const newTree = updateNode(state.tree, nodeId, (node) => ({
        [property]: validatedValue,
        lastModified: Date.now()
      }));

      return addToHistory(state, newTree);
    }

    case ACTIONS.UPDATE_NODE_FEEDBACK: {
      const { nodeId, feedback } = action.payload;

      const newTree = updateNode(state.tree, nodeId, (node) => ({
        feedback: {
          message: feedback.message || '',
          rating: typeof feedback.rating === 'number' ? Math.max(0, Math.min(4, feedback.rating)) : null
        },
        lastModified: Date.now()
      }));

      return addToHistory(state, newTree);
    }

    case ACTIONS.ADD_CHILD: {
      const { parentId, childNode } = action.payload;
      let newTree = addChildToNode(state.tree, parentId, childNode);

      // Aplicar layout dinámico para posicionar correctamente
      newTree = applyDynamicLayout(newTree);

      return addToHistory(state, newTree);
    }

    case ACTIONS.ADD_SIBLING_AT_INDEX: {
      const { parentId, siblingNode, index } = action.payload;

      let newTree = updateNode(state.tree, parentId, (node) => {
        const newChildren = [...node.children];
        // Insertar hermano en el índice específico (antes del nodo de referencia)
        newChildren.splice(index, 0, siblingNode);
        return {
          children: newChildren,
          lastModified: Date.now()
        };
      });

      // Aplicar layout dinámico para recalcular posiciones
      newTree = applyDynamicLayout(newTree);

      return addToHistory(state, newTree);
    }

    case ACTIONS.ADD_CHILDREN: {
      const { parentId, childrenNodes } = action.payload;

      let newTree = state.tree;
      for (const childNode of childrenNodes) {
        newTree = addChildToNode(newTree, parentId, childNode);
      }

      // Marcar que este nodo ya generó hijos
      newTree = updateNode(newTree, parentId, () => ({
        hasGeneratedChildren: true,
        lastModified: Date.now()
      }));

      // Recalcular layout dinámico
      newTree = applyDynamicLayout(newTree);

      return addToHistory(state, newTree);
    }

    case ACTIONS.REPLACE_CHILDREN: {
      const { parentId, newChildrenNodes } = action.payload;

      // Reemplazar los hijos del nodo padre con los nuevos nodos
      let newTree = updateNode(state.tree, parentId, () => ({
        children: newChildrenNodes,
        hasGeneratedChildren: true,
        lastModified: Date.now()
      }));

      // Recalcular layout dinámico
      newTree = applyDynamicLayout(newTree);

      return addToHistory(state, newTree);
    }

    case ACTIONS.DELETE_NODE: {
      const { nodeId } = action.payload;
      let newTree = deleteNode(state.tree, nodeId);

      // Si se intentó eliminar la raíz, no hacer nada
      if (newTree === null) {
        return state;
      }

      // Recalcular layout dinámico
      newTree = applyDynamicLayout(newTree);

      return addToHistory(state, newTree);
    }

    case ACTIONS.SET_TREE: {
      const { tree } = action.payload;
      return addToHistory(state, tree);
    }

    case ACTIONS.MARK_CHILDREN_GENERATED: {
      const { nodeId } = action.payload;
      const newTree = updateNode(state.tree, nodeId, () => ({
        hasGeneratedChildren: true,
        lastModified: Date.now()
      }));

      return {
        ...state,
        tree: newTree
      };
    }

    case ACTIONS.TOGGLE_COLLAPSE: {
      const { nodeId } = action.payload;
      let newTree = updateNode(state.tree, nodeId, (node) => ({
        collapsed: !node.collapsed,
        lastModified: Date.now()
      }));

      // Recalcular layout dinámico al colapsar/expandir
      newTree = applyDynamicLayout(newTree);

      return {
        ...state,
        tree: newTree
      };
    }

    case ACTIONS.RESET_POSITIONS: {
      // Usar layout dinámico para reorganizar
      const newTree = applyDynamicLayout(state.tree);
      return addToHistory(state, newTree);
    }

    case ACTIONS.SWAP_NODES: {
      const { sourceNodeId, targetNodeId } = action.payload;
      const sourceNode = findNodeById(state.tree, sourceNodeId);
      const targetNode = findNodeById(state.tree, targetNodeId);

      if (!sourceNode || !targetNode) {
        return state;
      }

      let newTree = updateNode(state.tree, sourceNodeId, () => ({
        x: targetNode.x,
        y: targetNode.y,
      }));

      newTree = updateNode(newTree, targetNodeId, () => ({
        x: sourceNode.x,
        y: sourceNode.y,
      }));

      return addToHistory(state, newTree);
    }

    case ACTIONS.UNDO: {
      if (state.historyIndex > 0) {
        const newHistoryIndex = state.historyIndex - 1;
        return {
          ...state,
          tree: state.history[newHistoryIndex],
          historyIndex: newHistoryIndex
        };
      }
      return state;
    }

    case ACTIONS.REDO: {
      if (state.historyIndex < state.history.length - 1) {
        const newHistoryIndex = state.historyIndex + 1;
        return {
          ...state,
          tree: state.history[newHistoryIndex],
          historyIndex: newHistoryIndex
        };
      }
      return state;
    }

    default:
      return state;
  }
}

/**
 * Añade un nuevo estado al historial (para undo/redo)
 */
function addToHistory(state, newTree) {
  // Eliminar estados futuros si estamos en medio del historial
  const newHistory = state.history.slice(0, state.historyIndex + 1);

  // Añadir nuevo estado
  newHistory.push(newTree);

  // Limitar tamaño del historial
  if (newHistory.length > state.maxHistory) {
    newHistory.shift();
  }

  return {
    ...state,
    tree: newTree,
    history: newHistory,
    historyIndex: newHistory.length - 1
  };
}

/**
 * Valida y sanitiza valores de propiedades
 */
function validatePropertyValue(property, value) {
  switch (property) {
    case 'width':
      return Math.max(100, Math.min(500, Number(value) || 200));

    case 'height':
      return Math.max(50, Math.min(300, Number(value) || 80));

    case 'fontSize':
      return Math.max(10, Math.min(32, Number(value) || 16));

    case 'borderWidth':
      return Math.max(0, Math.min(10, Number(value) || 2));

    case 'backgroundColor':
    case 'borderColor':
      // Validación básica de color hex
      if (typeof value === 'string' && /^#[0-9A-Fa-f]{6}$/.test(value)) {
        return value;
      }
      return property === 'backgroundColor' ? '#ffffff' : '#8b5cf6';

    default:
      return value;
  }
}

/**
 * Action creators para facilitar el dispatch
 */
export const actionCreators = {
  updateNodeText: (nodeId, text) => ({
    type: ACTIONS.UPDATE_NODE_TEXT,
    payload: { nodeId, text }
  }),

  updateNodePosition: (nodeId, x, y) => ({
    type: ACTIONS.UPDATE_NODE_POSITION,
    payload: { nodeId, x, y }
  }),

  updateNodeProperty: (nodeId, property, value) => ({
    type: ACTIONS.UPDATE_NODE_PROPERTY,
    payload: { nodeId, property, value }
  }),

  updateNodeFeedback: (nodeId, feedback) => ({
    type: ACTIONS.UPDATE_NODE_FEEDBACK,
    payload: { nodeId, feedback }
  }),

  addChild: (parentId, childNode) => ({
    type: ACTIONS.ADD_CHILD,
    payload: { parentId, childNode }
  }),

  addSiblingAtIndex: (parentId, siblingNode, index) => ({
    type: ACTIONS.ADD_SIBLING_AT_INDEX,
    payload: { parentId, siblingNode, index }
  }),

  addChildren: (parentId, childrenNodes) => ({
    type: ACTIONS.ADD_CHILDREN,
    payload: { parentId, childrenNodes }
  }),

  replaceChildren: (parentId, newChildrenNodes) => ({
    type: ACTIONS.REPLACE_CHILDREN,
    payload: { parentId, newChildrenNodes }
  }),

  deleteNode: (nodeId) => ({
    type: ACTIONS.DELETE_NODE,
    payload: { nodeId }
  }),

  setTree: (tree) => ({
    type: ACTIONS.SET_TREE,
    payload: { tree }
  }),

  markChildrenGenerated: (nodeId) => ({
    type: ACTIONS.MARK_CHILDREN_GENERATED,
    payload: { nodeId }
  }),

  toggleCollapse: (nodeId) => ({
    type: ACTIONS.TOGGLE_COLLAPSE,
    payload: { nodeId }
  }),

  resetPositions: () => ({
    type: ACTIONS.RESET_POSITIONS,
    payload: {}
  }),

  swapNodes: (sourceNodeId, targetNodeId) => ({
    type: ACTIONS.SWAP_NODES,
    payload: { sourceNodeId, targetNodeId }
  }),

  undo: () => ({ type: ACTIONS.UNDO }),
  redo: () => ({ type: ACTIONS.REDO })
};
