import mongoose from 'mongoose';

const userCommandSchema = new mongoose.Schema({
    // Identificación
    name: {
        type: String,
        required: true,
        maxlength: 120,
        trim: true
    },

    // Metadata
    description: {
        type: String,
        required: true,
        maxlength: 500
    },

    // Core functionality
    prompt_template: {
        type: String,
        required: true,
        maxlength: 3000
    },

    // Configuración
    scope: {
        type: String,
        enum: ['single_node', 'node_and_subnodes', 'selection', 'graph'],
        required: true
    },

    outputType: {
        type: String,
        enum: ['text', 'svg', 'json', 'html snippet'],
        required: true
    },

    constraints: {
        type: String,
        maxlength: 1000,
        default: ''
    },

    // Ownership
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    // Sharing
    isPublic: {
        type: Boolean,
        default: false
    },
    // Spec
    originalSpec: {
        objective: String,
        draftPrompt: String
    }
}, {
    timestamps: true
});

// Index
userCommandSchema.index({ owner: 1, createdAt: -1 });
userCommandSchema.index({ isPublic: 1, usageCount: -1 });

export default mongoose.model('UserCommand', userCommandSchema);