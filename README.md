# MindInVis

> Web application for creating interactive mind maps powered by AI (LLMs)

![Node.js](https://img.shields.io/badge/Node.js-≥18.0.0-green?logo=nodedotjs)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

## What is MindInVis?

MindInVis is a full-stack web application for creating interactive mind maps with LLM integration. Users can ask questions and the system generates structured responses that are visualized as nodes in the mind map.

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

| Layer | Technologies |
|-------|--------------|
| **Frontend** | React 18, Vite, ReactFlow, Zustand, TanStack Query, Framer Motion, Axios |
| **Backend** | Node.js, Express, LangChain, Mongoose, JWT, Winston, Helmet |
| **Database** | MongoDB |
| **LLM Providers** | OpenAI (GPT-4) |

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

   # Database
   MONGODB_URI=mongodb://localhost:27017/mindinvis

   # Server
   NODE_ENV=development
   PORT=5000
   ```

   Create `.env` in `client/`:
   ```env
   VITE_API_URL=http://localhost:5000
   ```

4. **Initialize database**
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
