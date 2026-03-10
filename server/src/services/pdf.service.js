import fs from 'fs';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import Document from '../models/Document.js';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

class PDFService {
  constructor() {
    this.textSplitter = null;
    this.embeddings = null;
    this.PDFParse = null;
    this.initialized = false;
  }

  initialize() {
    if (this.initialized) return;

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', ' ', '']
    });

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });

    this.initialized = true;
  }

  async loadPDFParse() {
    if (!this.PDFParse) {
      this.PDFParse = require('pdf-parse');
    }
    return this.PDFParse;
  }

  async processPDF(filePath, userId, mindMapId, originalFilename) {
    try {
      this.initialize();
      console.log('[PDF Service] Leyendo PDF:', originalFilename);
      const PDFParse = await this.loadPDFParse();
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await PDFParse(dataBuffer);

      const fullText = pdfData.text;
      const numPages = pdfData.numpages;

      console.log(`[PDF Service] Extraidas ${numPages} paginas`);
      console.log(`[PDF Service] Total caracteres: ${fullText.length}`);

      if (!fullText || fullText.trim().length === 0) {
        throw new Error('El PDF no contiene texto extraible. Puede ser un PDF escaneado.');
      }

      console.log('[PDF Service] Dividiendo texto en chunks...');
      const textChunks = await this.textSplitter.createDocuments([fullText]);
      console.log(`[PDF Service] Creados ${textChunks.length} chunks`);

      console.log('[PDF Service] Generando embeddings (esto puede tardar)...');
      const chunks = [];

      for (let i = 0; i < textChunks.length; i++) {
        const chunk = textChunks[i];
        const embedding = await this.embeddings.embedQuery(chunk.pageContent);

        chunks.push({
          chunkId: `chunk_${i}`,
          text: chunk.pageContent,
          pageNumber: this.estimatePageNumber(i, textChunks.length, numPages),
          position: i,
          embedding: embedding,
          stats: {
            wordCount: chunk.pageContent.split(/\s+/).length,
            charCount: chunk.pageContent.length,
            tokenCount: Math.ceil(chunk.pageContent.length / 4)
          }
        });

        if ((i + 1) % 10 === 0 || i === textChunks.length - 1) {
          console.log(`  Procesados ${i + 1}/${textChunks.length} chunks...`);
        }
      }

      console.log('[PDF Service] Embeddings generados exitosamente');

      console.log('[PDF Service] Guardando en MongoDB...');
      const document = new Document({
        originalFilename,
        uploadedBy: userId,
        mindMapId,
        filePath,
        metadata: {
          title: originalFilename.replace('.pdf', ''),
          pages: numPages,
          wordCount: fullText.split(/\s+/).length,
          processedAt: new Date()
        },
        chunks,
        status: 'completed'
      });

      await document.save();

      console.log('[PDF Service] Documento guardado con ID:', document._id);
      console.log(`[PDF Service] Resumen:`);
      console.log(`   - Paginas: ${numPages}`);
      console.log(`   - Palabras: ${document.metadata.wordCount}`);
      console.log(`   - Chunks: ${chunks.length}`);

      return document;

    } catch (error) {
      console.error('[PDF Service] Error procesando PDF:', error.message);
      throw error;
    }
  }

  async searchRelevantChunks(documentId, query, topK = 5) {
    try {
      this.initialize();
      console.log(`[PDF Service] Buscando chunks para: "${query}"`);

      // Paso 1: traer solo chunkId + embedding para calcular similitudes sin cargar texto
      const queryEmbedding = await this.embeddings.embedQuery(query);

      const docMeta = await Document.findById(documentId, { status: 1, 'chunks.chunkId': 1, 'chunks.embedding': 1 });
      if (!docMeta) {
        throw new Error('Document not found');
      }

      if (docMeta.status !== 'completed') {
        throw new Error(`Document is not ready. Current status: ${docMeta.status}`);
      }

      // Calcular similitudes solo con los embeddings (sin texto en memoria)
      const scored = docMeta.chunks.map(chunk => ({
        chunkId: chunk.chunkId,
        similarity: this.cosineSimilarity(queryEmbedding, chunk.embedding)
      }));

      const topIds = scored
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, topK)
        .map(c => c.chunkId);

      const similarityMap = Object.fromEntries(scored.map(c => [c.chunkId, c.similarity]));

      // Paso 2: traer solo los chunks ganadores con su texto (sin embeddings)
      const docData = await Document.findById(documentId).select({
        'chunks.embedding': 0
      }).lean();

      const topChunks = docData.chunks
        .filter(c => topIds.includes(c.chunkId))
        .map(c => ({ ...c, similarity: similarityMap[c.chunkId] }))
        .sort((a, b) => b.similarity - a.similarity);

      console.log(`[PDF Service] Encontrados ${topChunks.length} chunks relevantes:`);
      topChunks.forEach((result, i) => {
        console.log(`   ${i + 1}. Similitud: ${result.similarity.toFixed(3)} | Page ${result.pageNumber} | ${result.stats.wordCount} palabras`);
      });

      return topChunks;

    } catch (error) {
      console.error('[PDF Service] Error buscando chunks:', error.message);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  estimatePageNumber(chunkIndex, totalChunks, totalPages) {
    return Math.ceil((chunkIndex / totalChunks) * totalPages) || 1;
  }

  async getDocumentStats(documentId) {
    try {
      const document = await Document.findById(documentId);
      if (!document) {
        throw new Error('Document not found');
      }

      const chunkStats = document.chunks.map(chunk => ({
        chunkId: chunk.chunkId,
        pageNumber: chunk.pageNumber,
        wordCount: chunk.stats.wordCount,
        charCount: chunk.stats.charCount
      }));

      const totalWords = document.chunks.reduce((sum, chunk) => sum + chunk.stats.wordCount, 0);
      const avgWordsPerChunk = Math.round(totalWords / document.chunks.length);

      return {
        documentId: document._id,
        filename: document.originalFilename,
        status: document.status,
        metadata: document.metadata,
        chunks: {
          total: document.chunks.length,
          avgWordsPerChunk,
          totalWords,
          details: chunkStats
        }
      };

    } catch (error) {
      console.error('[PDF Service] Error obteniendo estadisticas:', error.message);
      throw error;
    }
  }
}

export default new PDFService();
