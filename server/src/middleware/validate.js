import { body, validationResult } from 'express-validator';

export const validateGenerateNodes = [
  body('nodeText')
    .isString()
    .withMessage('nodeText must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('nodeText must be between 1 and 500 characters'),

  body('nodeTipo')
    .isString()
    .withMessage('nodeTipo must be a string')
    .isIn(['pregunta', 'respuesta', 'root'])
    .withMessage('nodeTipo must be one of: pregunta, respuesta, root'),

  body('count')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('count must be an integer between 1 and 8')
    .toInt(),

  body('nodeContext')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'object' && !Array.isArray(value)) return true;
      throw new Error('nodeContext must be an object or null');
    }),

  body('documentId')
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      if (typeof value === 'string') return true;
      throw new Error('documentId must be a string or null');
    }),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateGenerateDetail = [
  body('nodeText')
    .isString()
    .withMessage('nodeText must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('nodeText must be between 1 and 500 characters'),

  body('nodeTipo')
    .isString()
    .withMessage('nodeTipo must be a string')
    .isIn(['pregunta', 'respuesta', 'root'])
    .withMessage('nodeTipo must be one of: pregunta, respuesta, root'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateGenerateAlternatives = [
  body('question')
    .isString()
    .withMessage('question must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('question must be between 1 and 500 characters'),

  body('existingNodes')
    .isArray({ min: 1 })
    .withMessage('existingNodes must be a non-empty array'),

  body('existingNodes.*.text')
    .optional()
    .isString()
    .withMessage('each node must have a text field'),

  body('existingNodes.*.description')
    .optional()
    .isString()
    .withMessage('each node description must be a string'),

  body('count')
    .optional()
    .isInt({ min: 1, max: 8 })
    .withMessage('count must be an integer between 1 and 8')
    .toInt(),

  body('description')
    .optional()
    .isString()
    .withMessage('description must be a string'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateAggregateNodes = [
  body('question')
    .isString()
    .withMessage('question must be a string')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('question must be between 1 and 500 characters'),

  body('nodes')
    .isArray({ min: 2 })
    .withMessage('nodes must be an array with at least 2 items'),

  body('nodes.*.text')
    .optional()
    .isString()
    .withMessage('each node must have a text field'),

  body('nodes.*.description')
    .optional()
    .isString()
    .withMessage('each node description must be a string'),

  body('clusterCount')
    .optional()
    .isInt({ min: 2, max: 10 })
    .withMessage('clusterCount must be an integer between 2 and 10')
    .toInt(),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateCompileCommand = [
  body('objective')
    .optional()
    .isString()
    .isLength({ max: 800 })
    .withMessage('objective must be a string up to 800 chars'),
  body('name')
    .optional()
    .isString()
    .isLength({ max: 120 })
    .withMessage('name must be a string up to 120 chars'),
  body('scope')
    .optional()
    .isString()
    .isLength({ max: 60 })
    .withMessage('scope must be a string up to 60 chars'),
  body('outputType')
    .optional()
    .isString()
    .isLength({ max: 60 })
    .withMessage('outputType must be a string up to 60 chars'),
  body('constraints')
    .optional()
    .isString()
    .isLength({ max: 1000 })
    .withMessage('constraints must be a string up to 1000 chars'),
  body('draftPrompt')
    .optional()
    .isString()
    .isLength({ max: 1500 })
    .withMessage('draftPrompt must be a string up to 1500 chars'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
export const validateCreateUserCommand = [
  body('name')
      .isString()
      .isLength({ min: 3, max: 120 })
      .withMessage('name must be 3-120 characters'),
  body('description')
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('description must be 10-500 characters'),
  body('prompt_template')
      .isString()
      .isLength({ min: 20, max: 3000 })
      .withMessage('prompt_template must be 20-3000 characters'),
  body('scope')
      .isString()
      .isIn(['single_node', 'node_and_subnodes', 'selection', 'graph'])
      .withMessage('invalid scope'),
  body('outputType')
      .isString()
      .isIn(['text', 'svg', 'json', 'html snippet'])
      .withMessage('invalid outputType'),
  body('constraints')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('constraints must be <= 1000 characters'),
  body('originalSpec')
      .optional()
      .isObject()
      .withMessage('originalSpec must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateUpdateUserCommand = [
  body('name')
      .optional()
      .isString()
      .isLength({ min: 3, max: 120 })
      .withMessage('name must be 3-120 characters'),
  body('description')
      .optional()
      .isString()
      .isLength({ min: 10, max: 500 })
      .withMessage('description must be 10-500 characters'),
  body('prompt_template')
      .optional()
      .isString()
      .isLength({ min: 20, max: 3000 })
      .withMessage('prompt_template must be 20-3000 characters'),
  body('constraints')
      .optional()
      .isString()
      .isLength({ max: 1000 })
      .withMessage('constraints must be <= 1000 characters'),
  body('isPublic')
      .optional()
      .isBoolean()
      .withMessage('isPublic must be boolean'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];

export const validateExecuteUserCommand = [
  body('commandId')
      .isString()
      .isMongoId()
      .withMessage('commandId must be a valid MongoDB ID'),
  body('selectedNodes')
      .isArray({ min: 1 })
      .withMessage('selectedNodes must be a non-empty array'),
  body('selectedNodes.*.text')
      .optional()
      .isString()
      .withMessage('node text must be a string'),
  body('params')
      .optional()
      .isObject()
      .withMessage('params must be an object'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }
    next();
  }
];
