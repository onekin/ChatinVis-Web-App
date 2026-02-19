# ChatinVis-Web-App

> Web application for creating interactive mind maps powered by AI (LLMs)

![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green?logo=nodedotjs)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

## What is ChatinVis?

ChatInVis is a full-stack web application for creating interactive mind maps with LLM integration. Users can ask questions and the system generates structured responses that are visualized as nodes in the mind map.

### Key Features

- **Interactive visualization** with ReactFlow (zoom, pan, drag & drop)
- **Multi-LLM integration** (OpenAI GPT-4, Google Gemini)
- **PDF analysis** - Extract information from documents
- **Feedback system** - Refine LLM responses
- **Exploration logs** - Complete interaction audit trail
- **JWT authentication** - Secure user system
- **MongoDB persistence** - Save maps and sessions
- **Modern interface** with Framer Motion and Lucide icons

## Project Structure

```
ChatinVis-Web-App/
├── client/              # Frontend React + Vite
│   └── src/
│       ├── components/  # React components
│       │   ├── editor/  # Map editor (ReactFlow, popups, panels)
│       │   ├── auth/    # Login/register
│       │   └── sidebar/ # Side navigation
│       ├── pages/       # Pages (Home, Editor, Config)
│       ├── services/    # API communication
│       └── context/     # Global state
├── server/              # Backend Node.js + Express
│   └── src/
│       ├── routes/      # API endpoints
│       ├── controllers/ # Route logic
│       ├── services/    # LLM, PDF, prompts
│       ├── models/      # MongoDB models
│       └── middleware/  # Auth, validation
├── shared/              # Shared code
└── docs/                # Documentation
```

## Tech Stack

| Layer | Technologies                                                           |
|-------|------------------------------------------------------------------------|
| **Frontend** | React 18, Vite, ReactFlow, Zustand, TanStack Query, Framer Motion, Axios |
| **Backend** | Node.js, Express, LangChain, Mongoose, JWT, Winston, Helmet            |
| **Database** | MongoDB                                                                |
| **LLM Providers** | OpenAI (GPT-4)<br/>                                                         |

## Installation

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- MongoDB (local or remote)

### Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ChatinVis-Web-App
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create `.env` in the root:
   ```env
   # LLM API Keys (at least one required)
   OPENAI_API_KEY=sk-...
   GOOGLE_API_KEY=...

   # Security
   JWT_SECRET=your-secret-key-here
   JWT_EXPIRE=7d

   # Database
   MONGODB_URI=mongodb://localhost:27017/mindinvis

   # Server
   NODE_ENV=development
   PORT=3001
   
   # CORS
   CORS_ORIGIN=http://localhost:3000

   # Logging
   LOG_LEVEL=debug
   ```
   Create `.env` in `client/`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

5. **Initialize database**
   ```bash
   node seed.js
   ```

## Development

```bash
# Start frontend and backend simultaneously
npm run dev

# Or separately:
npm run dev:client    
npm run dev:server    
```

### Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Development (client + server) |
| `npm run build` | Production build |
| `npm run lint` | Project linting |

## User Manual

### Getting Started

#### 1. Register an Account
- Navigate to the application homepage
- Click on "Register" 
- Enter your username, email, and password
- Submit the registration form

#### 2. Login
- Enter your credentials on the login page
- You'll be redirected to your dashboard

### Creating Your First Mind Map

#### Starting a New Map
1. From the dashboard, click "Create Map"
2. Enter a title for your map
3. Optionally select a document (PDF) as context

#### Working with Nodes

**Adding the First Node:**
- Type your question or topic in the input field
- The AI will generate a response and create the first node

**Expanding Nodes:**
- Click on any node to select it
- Type a follow-up question in the input field
- A new child node will be created connected to the selected parent

**Node Interactions:**
- **Drag & Drop:** Move nodes around to organize your map
- **Zoom:** Use mouse wheel to zoom in/out
- **Pan:** Click and drag the background to move the viewport
- **Delete:** Click the trash icon on a node to remove it

#### Using the Feedback System

If you're not satisfied with an AI response:
1. Select the node you want to improve
2. Click the "Feedback" button
3. Enter your refinement instructions
4. The AI will regenerate the node content based on your feedback

### PDF Document Analysis

#### Uploading Documents
1. Go to the "Documents" section
2. Click "Upload PDF"
3. Select your file (max size depends on server configuration)
4. Wait for the processing confirmation

#### Using Documents with Maps
- When creating a new map, select a previously uploaded document
- The AI will use the document content as context when generating responses
- Ask questions about the document content to extract specific information

### Navigation & Interface

#### Sidebar Menu
- **Home:** Return to dashboard
- **My Maps:** View all your saved mind maps
- **Documents:** Manage uploaded PDFs
- **Settings:** Configure LLM preferences and API keys
- **Logout:** End your session

#### Editor Controls
- **Save:** Automatically saves changes (also manual save button available)
- **Undo/Redo:** Navigate through your editing history
- **Export:** Download your mind map as JSON or image
- **Logs:** View exploration history for the current map

### Exploration Logs

Access the complete history of your interactions:
1. Open any mind map
2. Click the "Logs" button
3. View timestamped records of:
   - Questions asked
   - AI responses generated
   - Feedback provided
   - Node modifications

### Advanced Features

#### Multi-LLM Support
- Switch between OpenAI and Google Gemini
- Configure API keys in Settings
- Each map remembers its LLM preference

#### Node Customization
- Edit node titles and content manually
- Color-code nodes for organization
- Add notes and metadata

### Tips & Best Practices

- **Start broad, then narrow:** Begin with general questions, then dive deeper
- **Use feedback effectively:** Be specific about what you want changed
- **Organize as you go:** Arrange nodes logically to maintain clarity
- **Save regularly:** Although auto-save is enabled, manual saves ensure data safety
- **Use documents:** Upload relevant PDFs to get more accurate, context-aware responses

### Troubleshooting

**Map not loading?**
- Check your internet connection
- Refresh the page
- Verify you're logged in

**AI not responding?**
- Ensure API keys are configured correctly in Settings
- Check that your selected LLM provider is available
- Review server logs for errors

**PDF upload failing?**
- Verify file is a valid PDF
- Check file size limits
- Ensure PDF is not password-protected

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Mind Maps
- `GET /api/mindmaps` - List user's maps
- `POST /api/mindmaps` - Create new map
- `GET /api/mindmaps/:id` - Get specific map

### Documents
- `POST /api/upload` - Upload PDF for analysis
- `GET /api/documents` - List documents

### Logs
- `GET /api/nodelogs/:mindmapId` - Get exploration logs

## Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## License

MIT

---

<p align="center">
  <sub>Based on ChatInVis Browser Extension</sub>
</p>



