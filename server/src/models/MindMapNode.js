import mongoose from 'mongoose';

const mindMapNodeSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true
    },
    text: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['root', 'respuesta', 'pregunta'],
      default: 'respuesta'
    },
    x: {
      type: Number,
      default: 0
    },
    y: {
      type: Number,
      default: 0
    },
    width: {
      type: Number,
      default: 200
    },
    height: {
      type: Number,
      default: 80
    },
    fontSize: {
      type: Number,
      default: 16
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    borderColor: {
      type: String,
      default: '#8b5cf6'
    },
    borderWidth: {
      type: Number,
      default: 2
    },
    description: {
      type: String,
      default: null
    },
    source: {
      type: String,
      default: 'Manual'
    },
    feedback: {
      message: {
        type: String,
        default: ''
      },
      rating: {
        type: Number,
        min: 0,
        max: 4,
        default: null
      }
    },
    collapsed: {
      type: Boolean,
      default: false
    },
    hasGeneratedChildren: {
      type: Boolean,
      default: false
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MindMapNode'
      }
    ],
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MindMapNode',
      default: null
    }
  },
  {
    timestamps: true
  }
);

mindMapNodeSchema.index({ 'mindMap': 1 });

const MindMapNode = mongoose.model('MindMapNode', mindMapNodeSchema);

export default MindMapNode;

