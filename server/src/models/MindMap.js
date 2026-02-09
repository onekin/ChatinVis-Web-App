import mongoose from 'mongoose';

const mindMapSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      default: 'Untitled map'
    },
    description: {
      type: String,
      default: null
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rootNode: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MindMapNode',
      required: true
    },
    nodes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MindMapNode'
      }
    ],
    treeStructure: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    category: {
      type: String,
      enum: ['Learning', 'Work', 'Business', 'Personal', 'Other'],
      default: 'Other'
    },
    isPublic: {
      type: Boolean,
      default: false
    },
    isStarred: {
      type: Boolean,
      default: false
    },
    aiGenerated: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      enum: ['cyan', 'purple', 'blue', 'pink', 'green', 'orange', 'yellow', 'teal'],
      default: 'cyan'
    },
    nodeCount: {
      type: Number,
      default: 1
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      default: null
    },
    frameworkConfig: {
      type: {
        type: String,
        enum: ['predefined', 'custom'],
        default: null
      },
      value: {
        type: String,
        default: null
      },
      enabled: {
        type: Boolean,
        default: false
      }
    },
    collaborators: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        role: {
          type: String,
          enum: ['viewer', 'editor', 'owner'],
          default: 'viewer'
        },
        addedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    metadata: {
      lastEditedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      editHistory: [
        {
          action: String,
          user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
          },
          timestamp: {
            type: Date,
            default: Date.now
          }
        }
      ]
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
mindMapSchema.index({ owner: 1, createdAt: -1 });
mindMapSchema.index({ isPublic: 1 });
mindMapSchema.index({ tags: 1 });
mindMapSchema.index({ 'collaborators.user': 1 });

// Pre-save hook to update nodeCount
mindMapSchema.pre('save', async function (next) {
  if (this.isModified('nodes')) {
    this.nodeCount = this.nodes.length;
  }
  next();
});

const MindMap = mongoose.model('MindMap', mindMapSchema);

export default MindMap;
