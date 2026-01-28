import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    // Metadatos básicos
    originalFilename: { type: String, required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    mindMapId: { type: mongoose.Schema.Types.ObjectId, ref: 'MindMap', required: true },

    // Información del PDF
    metadata: {
        title: String,
        author: String,
        pages: Number,
        wordCount: Number,
        uploadedAt: { type: Date, default: Date.now },
        processedAt: Date
    },

    // Ruta al archivo original
    filePath: { type: String, required: true },

    // Chunks procesados con embeddings
    chunks: [{
        chunkId: String,
        text: { type: String, required: true },
        pageNumber: Number,
        position: Number,

        // Vector embedding (1536 dims para OpenAI text-embedding-3-small)
        embedding: {
            type: [Number],
            index: true
        },

        stats: {
            wordCount: Number,
            charCount: Number,
            tokenCount: Number
        }
    }],

    // Estado de procesamiento
    status: {
        type: String,
        enum: ['pending', 'processing', 'completed', 'failed'],
        default: 'pending'
    },
    errorMessage: String
}, {
    timestamps: true
});

// Índice para búsqueda vectorial
documentSchema.index({ 'chunks.embedding': '2dsphere' });

const Document = mongoose.model('Document', documentSchema);

export default Document;
