import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pdfService from '../services/pdf.service.js';
import MindMap from '../models/MindMap.js';


// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-originalname
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// File filter to validate file types (optional)
const fileFilter = (req, file, cb) => {
  // Accept any file type, but you can add restrictions here
  // Example: only images
  // const allowedTypes = /jpeg|jpg|png|gif|pdf/;
  // const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  // const mimetype = allowedTypes.test(file.mimetype);

  // if (mimetype && extname) {
  //   return cb(null, true);
  // }
  // cb(new Error('Invalid file type. Only images and PDFs are allowed.'));

  cb(null, true); // Accept all files
};

// Configure multer
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
  fileFilter: fileFilter
});

// Controller function to handle file upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(' File uploaded successfully:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    // Return file information
    res.status(200).json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        path: `/uploads/${req.file.filename}` // URL path to access the file
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload file'
    });
  }
};

// Controller function to handle multiple files upload
export const uploadMultipleFiles = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    console.log(`${req.files.length} files uploaded successfully`);

    const filesInfo = req.files.map(file => ({
      filename: file.filename,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      path: `/uploads/${file.filename}`
    }));

    res.status(200).json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      files: filesInfo
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload files'
    });
  }
};


// Controller function to delete a file
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    const filePath = path.join(uploadsDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }

    // Delete file
    fs.unlinkSync(filePath);

    console.log('File deleted:', filename);

    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete file'
    });
  }
};

export const uploadPDF = async (req, res) => {
  try {
    console.log(' uploadPDF called - req.file:', req.file ? 'present' : 'missing');
    console.log(' req.body:', req.body);
    console.log(' req.user:', req.user);

    if (!req.file) {
      console.log(' No file uploaded');
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    console.log(' File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path
    });

    if (req.file.mimetype !== 'application/pdf') {
      console.log(' Not a PDF file');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'Only PDF files are allowed'
      });
    }

    const userId = req.user.id;
    const { mindMapId } = req.body;

    console.log(' userId:', userId);
    console.log(' mindMapId:', mindMapId);

    if (!mindMapId) {
      console.log(' mindMapId missing');
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        error: 'mindMapId is required'
      });
    }

    console.log(' Processing PDF with RAG:', {
      filename: req.file.originalname,
      size: req.file.size,
      mindMapId
    });

    const document = await pdfService.processPDF(
      req.file.path,
      userId,
      mindMapId,
      req.file.originalname
    );

    console.log(' PDF processed successfully, document ID:', document._id);

    await MindMap.findByIdAndUpdate(mindMapId, {
      documentId: document._id
    });

    console.log(` MindMap ${mindMapId} updated with documentId ${document._id}`);

    res.status(200).json({
      success: true,
      message: 'PDF processed successfully',
      document: {
        id: document._id,
        filename: document.originalFilename,
        pages: document.metadata.pages,
        chunks: document.chunks.length,
        status: document.status
      }
    });

  } catch (error) {
    console.error(' Error processing PDF:', error);
    console.error(' Error stack:', error.stack);

    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Failed to process PDF'
    });
  }
}


