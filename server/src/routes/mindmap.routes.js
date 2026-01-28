import express from 'express';
import {
  generateNodes,
  generateNodeDetail,
  aggregateNodes,
  createMindMap,
  getUserMindMaps,
  getMindMapById,
  updateMindMap,
  deleteMindMap,
  saveMindMapState,
  getRecentMindMaps
} from '../controllers/mindmap.controller.js';
import {
  validateGenerateNodes,
  validateGenerateDetail,
  validateAggregateNodes
} from '../middleware/validate.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// ==================== AI GENERATION ROUTES ====================
// These routes do NOT require authentication
router.post('/generate-nodes', validateGenerateNodes, generateNodes);
router.post('/generate-detail', validateGenerateDetail, generateNodeDetail);
router.post('/aggregate-nodes', validateAggregateNodes, aggregateNodes);

// ==================== DATABASE ROUTES ====================
// All database routes require authentication
router.use(protect);

// Mind map CRUD operations
router.post('/', createMindMap);
router.get('/', getUserMindMaps);
router.get('/recent', getRecentMindMaps);
router.get('/:id', getMindMapById);
router.put('/:id', updateMindMap);
router.delete('/:id', deleteMindMap);
router.post('/:id/save', saveMindMapState);

export default router;

