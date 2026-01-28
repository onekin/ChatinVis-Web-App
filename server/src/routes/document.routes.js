import express from 'express';
import { upload } from '../controllers/upload.controller.js';
import { uploadPDF } from '../controllers/upload.controller.js';
import { searchChunks, getStats, getDocument, downloadPDF } from '../controllers/document.controller.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post('/upload', upload.single('file'), uploadPDF);
router.get('/:id', getDocument);
router.get('/:id/download', downloadPDF);
router.post('/:id/search', searchChunks);
router.get('/:id/stats', getStats);

export default router;
