import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

// Setup for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Validate required environment variables
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'tu-key-aqui') {
  console.warn('WARNING: OPENAI_API_KEY is not configured properly');
  console.warn('AI generation features will not work until you add a valid API key');
  console.warn('The server will continue to run, but AI endpoints will return errors');
}

// Import database connection
import connectDB from './config/database.js';

// Import routes (AFTER dotenv.config())
import mindmapRoutes from './routes/mindmap.routes.js';
import authRoutes from './routes/auth.routes.js';
import uploadRoutes from './routes/upload.routes.js';
import documentRoutes from './routes/document.routes.js';
import nodeLogRoutes from './routes/nodelog.routes.js';
import userCommandRoutes from './routes/user-command.routes.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet()); // Security headers

// Configure CORS to accept multiple origins
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173').split(',').map(o => o.trim());
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('dev')); // HTTP request logging

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    openai: !!process.env.OPENAI_API_KEY
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/mindmap', mindmapRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/logs', nodeLogRoutes);
app.use('/api/user-commands', userCommandRoutes);

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, async () => {
  console.log(`\nServer running on port ${PORT}`);
  console.log(`CORS enabled for: ${process.env.CORS_ORIGIN || 'http://localhost:3000'}`);
  console.log(`OpenAI API configured: ${process.env.OPENAI_API_KEY ? 'configured' : 'not configured'}`);
  console.log(`Health check: http://localhost:${PORT}/health\n`);
  
  // Connect to MongoDB
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

