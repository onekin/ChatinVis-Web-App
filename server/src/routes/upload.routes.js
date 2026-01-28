import express from 'express';
import { upload, uploadFile, uploadMultipleFiles, deleteFile } from '../controllers/upload.controller.js';
// Import auth middleware if you want to protect these routes
// import { protect } from '../middleware/auth.js';

const router = express.Router();

// Single file upload
// If you want to protect with authentication: router.post('/single', protect, upload.single('file'), uploadFile);
router.post('/single', upload.single('file'), uploadFile);

// Multiple files upload (max 10 files)
router.post('/multiple', upload.array('files', 10), uploadMultipleFiles);

// Delete file
router.delete('/:filename', deleteFile);

export default router;
