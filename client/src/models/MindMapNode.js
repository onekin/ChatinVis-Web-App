class MindMapNode {
  constructor(id, text, x, y, type, description = '', source = '', citation = null) {
    // Identification and content
    this.id = id;
    this.text = text;
    this.type = type;
    this.description = description;
    this.source = source;
    this.citation = citation;

    // User feedback
    this.feedback = {
      message: '',
      rating: null // 0-4, null if no rating
    };

    // Position
    this.x = x;
    this.y = y;
    this.initialX = x;
    this.initialY = y;

    // Dimensions and style - Calculate dynamically based on text length
    const textLength = text.length;
    if (textLength <= 30) {
      this.width = 200;
      this.height = 80;
      this.fontSize = 16;
    } else if (textLength <= 60) {
      this.width = 220;
      this.height = 90;
      this.fontSize = 14;
    } else if (textLength <= 100) {
      this.width = 250;
      this.height = 100;
      this.fontSize = 13;
    } else if (textLength <= 150) {
      this.width = 280;
      this.height = 120;
      this.fontSize = 12;
    } else {
      this.width = 300;
      this.height = 140;
      this.fontSize = 11;
    }

    // Assign colors based on type and saved configuration
    if (type === 'question') {
      this.backgroundColor = localStorage.getItem('mindinvis_question_bg') || '#1e3a8a';
      this.borderColor = localStorage.getItem('mindinvis_question_border') || '#3b82f6';
    } else if (type === 'answer') {
      this.backgroundColor = localStorage.getItem('mindinvis_answer_bg') || '#065f46';
      this.borderColor = localStorage.getItem('mindinvis_answer_border') || '#10b981';
    } else if (type === 'root') {
      this.backgroundColor = '#581c87';
      this.borderColor = '#8b5cf6';
    } else {
      this.backgroundColor = '#0f1419';
      this.borderColor = '#8b5cf6';
    }
    this.borderWidth = 2;

    // Relations (no parent reference to avoid circularity)
    this.children = [];

    // Metadata
    this.collapsed = false;
    this.hasGeneratedChildren = false;
    this.createdAt = Date.now();
    this.lastModified = Date.now();
  }

  /**
   * Creates a child node with relative position
   * NOTE: Does not maintain parent reference to avoid circular references
   */
  createChild(text, offsetX, offsetY, type, description = '', source = '') {
    const childNode = new MindMapNode(
      `node-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
      text,
      this.x + offsetX,
      this.y + offsetY,
      type,
      description,
      source
    );
    return childNode;
  }

  /**
   * Adds an existing child node to this node
   */
  addChild(childNode) {
    this.children.push(childNode);
    this.lastModified = Date.now();
    return childNode;
  }

  /**
   * Serializes the node to JSON for saving/persisting
   */
  toJSON() {
    return {
      id: this.id,
      text: this.text,
      type: this.type,
      description: this.description,
      source: this.source,
      citation: this.citation,
      feedback: this.feedback,
      x: this.x,
      y: this.y,
      initialX: this.initialX,
      initialY: this.initialY,
      width: this.width,
      height: this.height,
      fontSize: this.fontSize,
      backgroundColor: this.backgroundColor,
      borderColor: this.borderColor,
      borderWidth: this.borderWidth,
      collapsed: this.collapsed,
      hasGeneratedChildren: this.hasGeneratedChildren,
      createdAt: this.createdAt,
      lastModified: this.lastModified,
      children: this.children.map(child => child.toJSON())
    };
  }

  /**
   * Deserializes a node from JSON with validation
   */
  static fromJSON(data) {
    // Validate required data
    if (!data || typeof data !== 'object') {
      throw new Error('Invalid node data: must be an object');
    }

    if (!data.id || typeof data.id !== 'string') {
      throw new Error('Invalid node data: id is required and must be a string');
    }

    if (typeof data.text !== 'string') {
      throw new Error('Invalid node data: text must be a string');
    }

    if (typeof data.x !== 'number' || typeof data.y !== 'number') {
      throw new Error('Invalid node data: x and y must be numbers');
    }

    // Create node with validated values
    // Support both 'type' and 'tipo' for backwards compatibility
    const nodeType = data.type || data.tipo || 'question';
    const node = new MindMapNode(
      data.id,
      data.text,
      data.x,
      data.y,
      nodeType,
      data.description || '',
      data.source || '',
      data.citation || null
    );

    // Restore initial positions
    node.initialX = typeof data.initialX === 'number' ? data.initialX : data.x;
    node.initialY = typeof data.initialY === 'number' ? data.initialY : data.y;

    // Restore visual properties with default values
    node.width = typeof data.width === 'number' && data.width > 0 ? data.width : 200;
    node.height = typeof data.height === 'number' && data.height > 0 ? data.height : 80;
    node.fontSize = typeof data.fontSize === 'number' && data.fontSize > 0 ? data.fontSize : 16;
    node.backgroundColor = typeof data.backgroundColor === 'string' ? data.backgroundColor : node.backgroundColor;
    node.borderColor = typeof data.borderColor === 'string' ? data.borderColor : node.borderColor;
    node.borderWidth = typeof data.borderWidth === 'number' && data.borderWidth >= 0 ? data.borderWidth : 2;

    // Restore feedback
    if (data.feedback && typeof data.feedback === 'object') {
      node.feedback = {
        message: typeof data.feedback.message === 'string' ? data.feedback.message : '',
        rating: typeof data.feedback.rating === 'number' ? data.feedback.rating : null
      };
    }

    // Restore metadata
    node.collapsed = Boolean(data.collapsed);
    node.hasGeneratedChildren = Boolean(data.hasGeneratedChildren);
    node.createdAt = typeof data.createdAt === 'number' ? data.createdAt : Date.now();
    node.lastModified = typeof data.lastModified === 'number' ? data.lastModified : Date.now();

    // Recursively restore children with error handling
    if (Array.isArray(data.children)) {
      node.children = data.children
        .map((childData, index) => {
          try {
            return MindMapNode.fromJSON(childData);
          } catch (error) {
            console.error(`Error deserializing child ${index}:`, error);
            return null;
          }
        })
        .filter(child => child !== null);
    }

    return node;
  }

  /**
   * Clones this node (shallow - without children)
   */
  clone() {
    const cloned = new MindMapNode(
      `${this.id}-clone-${Date.now()}`,
      this.text,
      this.x,
      this.y,
      this.type,
      this.description,
      this.source,
      this.citation
    );

    cloned.feedback = { ...this.feedback };
    cloned.initialX = this.initialX;
    cloned.initialY = this.initialY;
    cloned.width = this.width;
    cloned.height = this.height;
    cloned.fontSize = this.fontSize;
    cloned.backgroundColor = this.backgroundColor;
    cloned.borderColor = this.borderColor;
    cloned.borderWidth = this.borderWidth;
    cloned.collapsed = this.collapsed;
    cloned.hasGeneratedChildren = this.hasGeneratedChildren;

    return cloned;
  }

  /**
   * Clones this node and all its children (deep clone)
   */
  deepClone() {
    const cloned = this.clone();
    cloned.children = this.children.map(child => child.deepClone());
    return cloned;
  }
}

export default MindMapNode;
