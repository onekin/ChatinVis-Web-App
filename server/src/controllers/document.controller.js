import pdfService from '../services/pdf.service.js';
import Document from '../models/Document.js';
import fs from 'fs';
import path from 'path';

export const getDocument = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Getting document info for ${id}`);

    const document = await Document.findById(id).select('originalFilename metadata status createdAt');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    res.status(200).json({
      success: true,
      document: {
        id: document._id,
        filename: document.originalFilename,
        metadata: document.metadata,
        status: document.status,
        createdAt: document.createdAt
      }
    });

  } catch (error) {
    console.error('Error getting document:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document'
    });
  }
};

export const downloadPDF = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Downloading PDF for document ${id}`);

    const document = await Document.findById(id).select('originalFilename filePath');

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      console.error('PDF file not found on disk:', document.filePath);
      return res.status(404).json({
        success: false,
        error: 'PDF file not found on server'
      });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${document.originalFilename}"`);

    // Stream the file to the response
    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);

    fileStream.on('error', (error) => {
      console.error('Error streaming file:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to stream PDF file'
      });
    });

  } catch (error) {
    console.error('Error downloading PDF:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to download PDF'
    });
  }
};

export const searchChunks = async (req, res) => {
  try {
    const { id } = req.params;
    const { query, topK = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        success: false,
        error: 'Query is required'
      });
    }

    console.log(`Searching chunks in document ${id} for: "${query}"`);

    const chunks = await pdfService.searchRelevantChunks(id, query, topK);

    res.status(200).json({
      success: true,
      results: chunks.map(chunk => ({
        chunkId: chunk.chunkId,
        text: chunk.text,
        pageNumber: chunk.pageNumber,
        similarity: chunk.similarity,
        stats: chunk.stats
      }))
    });

  } catch (error) {
    console.error('Error searching chunks:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search chunks'
    });
  }
};

export const getStats = async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`Getting stats for document ${id}`);

    const stats = await pdfService.getDocumentStats(id);

    res.status(200).json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get document stats'
    });
  }
};