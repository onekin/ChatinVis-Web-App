import mongoose from 'mongoose';

const nodeLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: [
      'askFirstQuestion',
      'askQuestion',
      'askFirstQuestionWithPDF',
      'askQuestionWithPDF',
      'selectAnswer',
      'editFeedback',
      'newFeedback',
      'consultNote',
      'summarize',
      'createNode',
      'editNode',
      'deleteNode',
      'moveNode',
      'changeNodeColor',
      'changeNodeStyle'
    ]
  },
  nodeId: {
    type: String,
    required: true
  },
  source: {
    type: String,
    default: null
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },
  mapId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MindMap',
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: false
});

// Índices para búsquedas rápidas
nodeLogSchema.index({ mapId: 1, timestamp: -1 });
nodeLogSchema.index({ nodeId: 1, timestamp: -1 });
nodeLogSchema.index({ action: 1 });

const NodeLog = mongoose.model('NodeLog', nodeLogSchema);
export default NodeLog;
