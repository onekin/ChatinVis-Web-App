/**
 * Utilities for working with node trees in an immutable way
 */

/**
 * Finds a node by its ID in the tree
 * @param {Object} tree - Root node of the tree
 * @param {string} nodeId - ID of the node to find
 * @returns {Object|null} - The found node or null
 */
export function findNodeById(tree, nodeId) {
  if (!tree) return null;
  if (tree.id === nodeId) return tree;

  if (tree.children && tree.children.length > 0) {
    for (const child of tree.children) {
      const found = findNodeById(child, nodeId);
      if (found) return found;
    }
  }

  return null;
}

/**
 * Updates a specific node in the tree immutably
 * @param {Object} tree - Root node of the tree
 * @param {string} nodeId - ID of the node to update
 * @param {Function} updateFn - Function that receives the node and returns updated properties
 * @returns {Object} - New tree with the updated node
 */
export function updateNode(tree, nodeId, updateFn) {
  if (!tree) return tree;

  if (tree.id === nodeId) {
    const updates = updateFn(tree);
    return {
      ...tree,
      ...updates,
      lastModified: Date.now()
    };
  }

  if (tree.children && tree.children.length > 0) {
    const newChildren = tree.children.map(child =>
      updateNode(child, nodeId, updateFn)
    );

    // Only create a new object if a child changed
    const hasChanged = newChildren.some((child, idx) => child !== tree.children[idx]);
    if (hasChanged) {
      return {
        ...tree,
        children: newChildren
      };
    }
  }

  return tree;
}

/**
 * Adds a child node to a specific node
 * @param {Object} tree - Root node of the tree
 * @param {string} parentId - ID of the parent node
 * @param {Object} newChild - New child node to add
 * @returns {Object} - New tree with the child added
 */
export function addChildToNode(tree, parentId, newChild) {
  if (!tree) return tree;

  if (tree.id === parentId) {
    return {
      ...tree,
      children: [...tree.children, newChild],
      lastModified: Date.now()
    };
  }

  if (tree.children && tree.children.length > 0) {
    const newChildren = tree.children.map(child =>
      addChildToNode(child, parentId, newChild)
    );

    const hasChanged = newChildren.some((child, idx) => child !== tree.children[idx]);
    if (hasChanged) {
      return {
        ...tree,
        children: newChildren
      };
    }
  }

  return tree;
}

/**
 * Deletes a node from the tree
 * @param {Object} tree - Root node of the tree
 * @param {string} nodeId - ID of the node to delete
 * @returns {Object|null} - New tree without the node (null if root was deleted)
 */
export function deleteNode(tree, nodeId) {
  if (!tree) return null;

  // No permitir eliminar la raíz
  if (tree.id === nodeId) {
    return null;
  }

  if (tree.children && tree.children.length > 0) {
    const newChildren = tree.children
      .filter(child => child.id !== nodeId)
      .map(child => deleteNode(child, nodeId));

    const hasChanged =
      newChildren.length !== tree.children.length ||
      newChildren.some((child, idx) => child !== tree.children[idx]);

    if (hasChanged) {
      return {
        ...tree,
        children: newChildren,
        lastModified: Date.now()
      };
    }
  }

  return tree;
}

/**
 * Counts the total number of nodes in the tree
 * @param {Object} tree - Root node of the tree
 * @returns {number} - Total number of nodes
 */
export function countNodes(tree) {
  if (!tree) return 0;

  let count = 1; // Contar este nodo

  if (tree.children && tree.children.length > 0) {
    count += tree.children.reduce((sum, child) => sum + countNodes(child), 0);
  }

  return count;
}

/**
 * Gets the maximum depth of the tree
 * @param {Object} tree - Root node of the tree
 * @returns {number} - Maximum depth
 */
export function getMaxDepth(tree) {
  if (!tree) return 0;

  if (!tree.children || tree.children.length === 0) {
    return 1;
  }

  const childDepths = tree.children.map(child => getMaxDepth(child));
  return 1 + Math.max(...childDepths);
}

/**
 * Validates that a node tree is correct
 * @param {Object} tree - Root node of the tree
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateNodeTree(tree) {
  const errors = [];

  if (!tree) {
    errors.push('Tree cannot be null or undefined');
    return { valid: false, errors };
  }

  const seenIds = new Set();

  function validate(node, path = 'root') {
    if (!node.id) {
      errors.push(`Nodo en ${path} no tiene ID`);
    } else if (seenIds.has(node.id)) {
      errors.push(`ID duplicado: ${node.id} en ${path}`);
    } else {
      seenIds.add(node.id);
    }

    if (typeof node.text !== 'string') {
      errors.push(`Nodo ${node.id} en ${path} no tiene texto válido`);
    }

    if (typeof node.x !== 'number' || typeof node.y !== 'number') {
      errors.push(`Nodo ${node.id} en ${path} no tiene coordenadas válidas`);
    }

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child, idx) => {
        validate(child, `${path}.children[${idx}]`);
      });
    }
  }

  validate(tree);

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Deep-clones a node tree immutably
 * @param {Object} tree - Root node of the tree
 * @returns {Object} - New cloned tree
 */
export function cloneTree(tree) {
  if (!tree) return null;

  return {
    ...tree,
    children: tree.children ? tree.children.map(child => cloneTree(child)) : []
  };
}

/**
 * Traverses the tree and executes a function on each node
 * @param {Object} tree - Root node of the tree
 * @param {Function} fn - Function to execute on each node (node, depth, path)
 */
export function traverseTree(tree, fn, depth = 0, path = []) {
  if (!tree) return;

  fn(tree, depth, [...path, tree.id]);

  if (tree.children && tree.children.length > 0) {
    tree.children.forEach(child => {
      traverseTree(child, fn, depth + 1, [...path, tree.id]);
    });
  }
}

/**
 * Calculates initial positions for child nodes (before applying dynamic layout)
 * Final positions will be recalculated by applyDynamicLayout
 * @param {Object} parentNode - Parent node
 * @param {number} childrenCount - Number of child nodes to create
 * @param {Object} tree - Full tree (not used, kept for compatibility)
 * @returns {Array} - Array of positions {x, y}
 */
export function calculateChildrenPositions(parentNode, childrenCount, tree) {
  // Temporary positions - dynamic layout will recalculate them
  const positions = [];

  for (let i = 0; i < childrenCount; i++) {
    positions.push({
      x: parentNode.x + LAYOUT_CONFIG.horizontalSpacing,
      y: parentNode.y  // El layout dinámico calculará la Y correcta
    });
  }

  return positions;
}

/**
 * Resets all node positions to their initial positions
 * @param {Object} tree - Root node of the tree
 * @returns {Object} - New tree with reset positions
 */
export function resetAllPositions(tree) {
  if (!tree) return null;

  const resetNode = {
    ...tree,
    x: tree.initialX || tree.x,
    y: tree.initialY || tree.y,
    lastModified: Date.now()
  };

  if (tree.children && tree.children.length > 0) {
    resetNode.children = tree.children.map(child => resetAllPositions(child));
  }

  return resetNode;
}

/**
 * Finds the parent node of a specific node
 * @param {Object} tree - Root node of the tree
 * @param {string} nodeId - ID of the child node
 * @returns {Object|null} - The found parent node or null
 */
export function findParentNode(tree, nodeId) {
  if (!tree || !tree.children) return null;

  for (const child of tree.children) {
    if (child.id === nodeId) {
      return tree;
    }
    const foundParent = findParentNode(child, nodeId);
    if (foundParent) {
      return foundParent;
    }
  }

  return null;
}

/**
 * Gets the full path from the root to a specific node
 * @param {Object} tree - Root node of the tree
 * @param {string} nodeId - ID of the target node
 * @returns {Array<Object>|null} - Array of nodes in the path [root, ..., target] or null if not found
 */
export function getNodePath(tree, nodeId) {
  if (!tree) return null;
  
  function findPath(node, targetId, currentPath = []) {
    const newPath = [...currentPath, node];
    
    if (node.id === targetId) {
      return newPath;
    }
    
    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        const foundPath = findPath(child, targetId, newPath);
        if (foundPath) {
          return foundPath;
        }
      }
    }
    
    return null;
  }
  
  return findPath(tree, nodeId);
}

// ============================================
// DYNAMIC LAYOUT - MindMeister-like system
// ============================================

const LAYOUT_CONFIG = {
  horizontalSpacing: 300,    // Horizontal space between columns
  minVerticalSpacing: 30,    // Minimum space between sibling nodes
  nodeHeight: 80,            // Base node height
};

/**
 * Calculates the total height occupied by a subtree (including all visible descendants)
 * @param {Object} node - Root node of the subtree
 * @returns {number} - Total subtree height in pixels
 */
export function getSubtreeHeight(node) {
  if (!node) return 0;

  // Si el nodo está colapsado o no tiene hijos visibles, solo cuenta su propia altura
  if (node.collapsed || !node.children || node.children.length === 0) {
    return node.height || LAYOUT_CONFIG.nodeHeight;
  }

  // Calcular la altura total de todos los hijos
  let totalChildrenHeight = 0;
  for (let i = 0; i < node.children.length; i++) {
    totalChildrenHeight += getSubtreeHeight(node.children[i]);
    // Add spacing between siblings (except after the last one)
    if (i < node.children.length - 1) {
      totalChildrenHeight += LAYOUT_CONFIG.minVerticalSpacing;
    }
  }

  // El subárbol ocupa al menos la altura del nodo padre o la de sus hijos
  const nodeHeight = node.height || LAYOUT_CONFIG.nodeHeight;
  return Math.max(nodeHeight, totalChildrenHeight);
}

/**
 * Applies the dynamic layout to the entire tree, repositioning all nodes
 * @param {Object} tree - Root node of the tree
 * @returns {Object} - New tree with updated positions
 */
export function applyDynamicLayout(tree) {
  if (!tree) return null;

  // Clonar el árbol para no mutarlo
  const newTree = cloneTree(tree);

  // Aplicar layout recursivamente empezando desde la raíz
  layoutNode(newTree, newTree.x, newTree.y);

  return newTree;
}

/**
 * Applies layout to a node and all its descendants
 * @param {Object} node - Node to position
 * @param {number} x - X position of the node
 * @param {number} centerY - Y center where the subtree should be positioned
 */
function layoutNode(node, x, centerY) {
  // Posicionar este nodo
  node.x = x;
  node.y = centerY;
  node.initialX = x;
  node.initialY = centerY;

  // If collapsed or has no children, finish
  if (node.collapsed || !node.children || node.children.length === 0) {
    return;
  }

  // Calcular la altura total de los hijos
  const childrenHeights = node.children.map(child => getSubtreeHeight(child));
  const totalHeight = childrenHeights.reduce((sum, h, i) => {
    return sum + h + (i > 0 ? LAYOUT_CONFIG.minVerticalSpacing : 0);
  }, 0);

  // Posicionar hijos centrados verticalmente respecto al padre
  const childX = x + LAYOUT_CONFIG.horizontalSpacing;
  let currentY = centerY - totalHeight / 2;

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    const childHeight = childrenHeights[i];

    // El centro del hijo es el punto medio de su espacio asignado
    const childCenterY = currentY + childHeight / 2;

    // Aplicar layout recursivamente al hijo
    layoutNode(child, childX, childCenterY);

    // Mover el cursor al siguiente espacio
    currentY += childHeight + LAYOUT_CONFIG.minVerticalSpacing;
  }
}

/**
 * Recalculates the layout only for a specific subtree and adjusts ancestors
 * @param {Object} tree - Full tree
 * @param {string} nodeId - ID of the node whose subtree changed
 * @returns {Object} - New tree with updated layout
 */
export function relayoutFromNode(tree, nodeId) {
  // Por ahora, recalculamos todo el árbol para simplicidad
  // Una optimización futura sería solo recalcular lo necesario
  return applyDynamicLayout(tree);
}
