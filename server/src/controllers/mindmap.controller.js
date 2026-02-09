import { validationResult } from 'express-validator';
import openaiService from '../services/openai.service.js';
import MindMap from '../models/MindMap.js';
import MindMapNode from '../models/MindMapNode.js';


// Create a new mind map
export const createMindMap = async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const userId = req.user.id;

    // Create root node
    const rootNode = await MindMapNode.create({
      id: `root-${Date.now()}`,
      text: title || 'Tema Central',
      type: 'pregunta',
      x: 200,
      y: 400
    });

    // Create mind map
    const mindMap = await MindMap.create({
      title: title || 'Untitled map',
      description,
      owner: userId,
      rootNode: rootNode._id,
      nodes: [rootNode._id],
      category: category || 'Other'
    });

    // Populate and return
    await mindMap.populate(['owner', 'rootNode']);

    res.status(201).json({
      success: true,
      message: 'Mind map created successfully',
      data: mindMap
    });
  } catch (error) {
    console.error('Create mind map error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create mind map'
    });
  }
};

// Get all mind maps for user
export const getUserMindMaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10, sortBy = 'createdAt' } = req.query;

    const skip = (page - 1) * limit;

    const mindMaps = await MindMap.find({ owner: userId })
      .sort({ [sortBy]: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('owner', 'name email')
      .populate('rootNode');

    const total = await MindMap.countDocuments({ owner: userId });

    res.status(200).json({
      success: true,
      data: mindMaps,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        pageSize: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get user mind maps error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch mind maps'
    });
  }
};

// Get single mind map by ID
export const getMindMapById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mindMap = await MindMap.findById(id)
      .populate('owner', 'name email')
      .populate('rootNode')
      .populate('nodes')
      .populate('collaborators.user', 'name email');

    if (!mindMap) {
      return res.status(404).json({
        success: false,
        error: 'Mind map not found'
      });
    }

    // Check if user has access
    const isOwner = mindMap.owner._id.toString() === userId;
    const isCollaborator = mindMap.collaborators.some(c => c.user._id.toString() === userId);

    if (!isOwner && !isCollaborator && !mindMap.isPublic) {
      return res.status(403).json({
        success: false,
        error: 'You do not have access to this mind map'
      });
    }

    res.status(200).json({
      success: true,
      data: mindMap
    });
  } catch (error) {
    console.error('Get mind map error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch mind map'
    });
  }
};

// Update mind map
export const updateMindMap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, description, category, isPublic, isStarred, tags } = req.body;

    let mindMap = await MindMap.findById(id);

    if (!mindMap) {
      return res.status(404).json({
        success: false,
        error: 'Mind map not found'
      });
    }

    // Check if user is owner
    if (mindMap.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can update this mind map'
      });
    }

    // Update fields
    if (title) mindMap.title = title;
    if (description !== undefined) mindMap.description = description;
    if (category) mindMap.category = category;
    if (isPublic !== undefined) mindMap.isPublic = isPublic;
    if (isStarred !== undefined) mindMap.isStarred = isStarred;
    if (tags) mindMap.tags = tags;

    // Add to edit history
    if (!mindMap.metadata) {
      mindMap.metadata = {};
    }
    if (!mindMap.metadata.editHistory) {
      mindMap.metadata.editHistory = [];
    }

    mindMap.metadata.editHistory.push({
      action: 'updated',
      user: userId,
      timestamp: new Date()
    });
    mindMap.metadata.lastEditedBy = userId;

    await mindMap.save();

    res.status(200).json({
      success: true,
      message: 'Mind map updated successfully',
      data: mindMap
    });
  } catch (error) {
    console.error('Update mind map error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update mind map'
    });
  }
};

// Delete mind map
export const deleteMindMap = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mindMap = await MindMap.findById(id);

    if (!mindMap) {
      return res.status(404).json({
        success: false,
        error: 'Mind map not found'
      });
    }

    // Check if user is owner
    if (mindMap.owner.toString() !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Only the owner can delete this mind map'
      });
    }

    // Delete all nodes associated with this mind map
    await MindMapNode.deleteMany({ _id: { $in: mindMap.nodes } });

    // Delete the mind map
    await MindMap.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Mind map deleted successfully'
    });
  } catch (error) {
    console.error('Delete mind map error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete mind map'
    });
  }
};

// Save mind map state (all nodes and structure)
export const saveMindMapState = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { tree, title, documentId, frameworkConfig } = req.body;

    let mindMap = await MindMap.findById(id);

    if (!mindMap) {
      return res.status(404).json({
        success: false,
        error: 'Mind map not found'
      });
    }

    // Check if user is owner or editor
    const isOwner = mindMap.owner.toString() === userId;
    const isEditor = mindMap.collaborators.some(
      c => c.user.toString() === userId && (c.role === 'editor' || c.role === 'owner')
    );

    if (!isOwner && !isEditor) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to edit this mind map'
      });
    }

    // Save all nodes recursively
    const saveNodes = async (node) => {
      const savedNode = await MindMapNode.findOneAndUpdate(
        { id: node.id },
        {
          id: node.id,
          text: node.text,
          type: node.tipo || node.type || 'respuesta',
          x: node.x,
          y: node.y,
          width: node.width,
          height: node.height,
          fontSize: node.fontSize,
          backgroundColor: node.backgroundColor,
          borderColor: node.borderColor,
          borderWidth: node.borderWidth,
          description: node.description,
          source: node.source,
          feedback: node.feedback || { message: '', rating: null },
          collapsed: node.collapsed,
          hasGeneratedChildren: node.hasGeneratedChildren
        },
        { upsert: true, new: true }
      );

      if (!mindMap.nodes.includes(savedNode._id)) {
        mindMap.nodes.push(savedNode._id);
      }

      if (node.children && node.children.length > 0) {
        for (const child of node.children) {
          await saveNodes(child);
        }
      }

      return savedNode;
    };

    if (tree) {
      await saveNodes(tree);
      // Also save the tree structure for easy reconstruction
      console.log(' Saving tree structure to database');
      mindMap.treeStructure = tree;
    }

    if (title) {
      mindMap.title = title;
    }

    // Update documentId (can be null to remove document)
    if (documentId !== undefined) {
      mindMap.documentId = documentId;
      console.log(' Updating documentId:', documentId || 'removed');
    }

    // Update frameworkConfig
    if (frameworkConfig !== undefined) {
      mindMap.frameworkConfig = frameworkConfig;
      console.log(' Updating frameworkConfig:', frameworkConfig?.enabled ? frameworkConfig.value : 'disabled');
    }

    // Update edit history
    if (!mindMap.metadata) {
      mindMap.metadata = {};
    }
    if (!mindMap.metadata.editHistory) {
      mindMap.metadata.editHistory = [];
    }

    mindMap.metadata.editHistory.push({
      action: 'saved',
      user: userId,
      timestamp: new Date()
    });
    mindMap.metadata.lastEditedBy = userId;

    await mindMap.save();

    res.status(200).json({
      success: true,
      message: 'Mind map state saved successfully',
      data: mindMap
    });
  } catch (error) {
    console.error('Save mind map state error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save mind map state'
    });
  }
};

// Get recent mind maps
export const getRecentMindMaps = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = req.query.limit || 5;

    console.log(`\n GET /api/mindmap/recent - User: ${userId}`);

    const mindMaps = await MindMap.find({ owner: userId })
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .populate('owner', 'name email')
      .populate('rootNode');

    console.log(` Found ${mindMaps.length} recent maps for user ${userId}`);
    mindMaps.forEach((map, idx) => {
      console.log(`  ${idx + 1}. ${map.title} (${map._id}) - Updated: ${map.updatedAt}`);
    });

    res.status(200).json({
      success: true,
      data: mindMaps
    });
  } catch (error) {
    console.error('Get recent mind maps error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch recent mind maps'
    });
  }
};

// ==================== AI GENERATION OPERATIONS ====================

export const generateNodes = async (req, res, next) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn(' Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nodeText, nodeTipo, count = 3, nodeContext, documentId, frameworkConfig } = req.body;

    console.log('\n' + ''.repeat(80));
    console.log(' POST /api/mindmap/generate-nodes');
    console.log('═'.repeat(80));
    console.log(`Request Parameters:`);
    console.log(`  • Node Text: "${nodeText}"`);
    console.log(`  • Node Type: ${nodeTipo}`);
    console.log(`  • Count: ${count}`);
    console.log(`  • Document ID: ${documentId || 'None'}`);
    
    if (nodeContext) {
      console.log(`\n CONTEXT RECEIVED (Respuestas con contexto):`);
      console.log(`  • Path Length: ${nodeContext.pathLength}`);
      console.log(`  • Full Path: ${nodeContext.fullPath?.join(' → ') || 'N/A'}`);
      console.log(`  • Root (L1): "${nodeContext.firstQuestion}"`);
      console.log(`  • Pregunta (L${nodeContext.pathLength - 1}): "${nodeContext.previousQuestion}"`);
      console.log(`  • Generando respuesta desde: "${nodeContext.currentAnswer}"`);
      console.log(`\n  → PromptBuilder will use CONTEXTUAL prompt`);
    } else {
      console.log(`\n  NO CONTEXT (Respuestas básicas)`);
      console.log(`  → PromptBuilder will use BASIC prompt`);
    }

    if (frameworkConfig && frameworkConfig.enabled) {
      console.log(`\n FRAMEWORK ENABLED:`);
      console.log(`  • Type: ${frameworkConfig.type}`);
      console.log(`  • Value: ${frameworkConfig.value}`);
    }

    // Call OpenAI service
    console.log('\n Calling OpenAI service...');
    const result = await openaiService.generateNodes(nodeText, nodeTipo, count, nodeContext, documentId, frameworkConfig);

    console.log(`\n Successfully generated ${result.nodes.length} nodes`);
    console.log('═'.repeat(80) + '\n');

    // Success response
    res.json({
      success: true,
      nodes: result.nodes,
      metadata: {
        model: 'gpt-3.5-turbo',
        count: result.nodes.length,
        tipo: nodeTipo,
        hasContext: !!nodeContext
      }
    });
  } catch (error) {
    console.error(' Controller error:', error.message);
    next(error);
  }
};

export const generateNodeDetail = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { nodeText, nodeTipo } = req.body;

    console.log(`\nPOST /api/mindmap/generate-detail`);
    console.log(`   Input: nodeText="${nodeText}", nodeTipo="${nodeTipo}"`);

    const nodeContext = {
      _styles: [
        { name: 'Number of items', value: 1 },
        { name: 'Description', value: 'are concise, clear and informative (maximum 3-4 sentences)' }
      ]
    };

    let question;
    if (nodeTipo === 'pregunta' || nodeTipo === 'root') {
      question = `Provide a brief explanation (3-4 sentences maximum) about: "${nodeText}". Focus on the main concept and its importance.`;
    } else {
      question = `Provide a brief explanation (3-4 sentences maximum) about: "${nodeText}". Explain what it means and why it matters.`;
    }

    const result = await openaiService.generateStructuredNodes(
      nodeContext,
      question,
      'basic',
      {}
    );

    console.log(`Successfully generated detail for node`);
    console.log('Result structure:', {
      hasParseError: !!result.parseError,
      hasItems: !!result.items,
      itemsLength: result.items?.length,
      hasRaw: !!result.raw
    });

    let description = '';

    if (result.parseError) {
      console.warn('Failed to parse JSON, using raw response');
      description = result.raw || 'Error al generar descripción';
    } else if (result.items && Array.isArray(result.items) && result.items.length > 0) {
      const firstItem = result.items[0];
      console.log('First item:', JSON.stringify(firstItem).substring(0, 200));
      
      // Handle different response formats from OpenAI
      if (firstItem.description) {
        // Standard format: {"GPT_item_name": "...", "description": "..."}
        description = firstItem.description;
      } else if (firstItem.GPT_item_name) {
        description = firstItem.GPT_item_name;
      } else {
        // OpenAI might return: {"Topic Name": {"description": "..."}}
        for (const [key, value] of Object.entries(firstItem)) {
          if (key !== 'description' && key !== 'excerpt' && typeof value === 'object' && value.description) {
            description = value.description;
            break;
          } else if (key !== 'description' && typeof value === 'string') {
            description = value;
            break;
          }
        }
      }
    } else if (result.raw) {
      description = result.raw;
    } else {
      console.warn('Unexpected result structure:', result);
      description = 'No se pudo generar una descripción';
    }

    console.log('Description extracted:', description.substring(0, 100) + '...');

    res.json({
      success: true,
      description: description,
      metadata: {
        model: 'gpt-3.5-turbo',
        tipo: nodeTipo
      }
    });
  } catch (error) {
    console.error('Controller error generating detail:', error.message);
    next(error);
  }
};

export const aggregateNodes = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.warn('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { question, nodes, clusterCount = 3 } = req.body;

    console.log(`\nPOST /api/mindmap/aggregate-nodes`);
    console.log(`   Question: "${question}"`);
    console.log(`   Nodes to cluster: ${nodes.length}, Clusters: ${clusterCount}`);

    const result = await openaiService.aggregateNodes(question, nodes, clusterCount);

    // Check if parsing failed
    if (result.parseError) {
      console.error('Failed to parse aggregation response:', result.parseError);
      console.error('Raw response:', result.raw?.substring(0, 500));
      throw new Error(`AI response parsing failed: ${result.parseError}`);
    }

    // Validate result has clusters array
    if (!result.clusters || !Array.isArray(result.clusters)) {
      console.error('Invalid result structure:', result);
      throw new Error('AI response missing clusters array');
    }

    console.log(`Successfully aggregated nodes into clusters`);

    res.json({
      success: true,
      clusters: result.clusters,
      metadata: {
        model: 'gpt-3.5-turbo',
        nodesProcessed: nodes.length,
        clustersGenerated: clusterCount
      }
    });
  } catch (error) {
    console.error('Controller error aggregating nodes:', error.message);
    next(error);
  }
};
