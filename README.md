# MindInVis

A web application for mind mapping with LLM integration, based on ChatInVis.

## Project Structure

```
MindInVis/
├── client/         # Frontend (React + Vite)
├── server/         # Backend (Node.js + Express)
├── shared/         # Shared code
├── database/       # Migrations and seeds
└── docs/           # Documentation
```

## Tech Stack

### Frontend
- React 18
- Vite
- Zustand/Redux (state management)
- D3.js/Vis.js (mind map visualization)
- TailwindCSS/Styled Components

### Backend
- Node.js + Express
- LangChain (LLM integration)
- PostgreSQL/MongoDB (database)
- JWT (authentication)

### LLM APIs
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude)

## Development

### Installation

```bash
# Install dependencies for the entire project
npm install

# Install only frontend
cd client && npm install

# Install only backend
cd server && npm install
```

### Local Development

```bash
# Start everything (frontend + backend)
npm run dev

# Only frontend
npm run dev:client

# Only backend
npm run dev:server
```

### Production Build

```bash
npm run build
```

## Docker

### 🚀 Inicio Rápido

**1. Configurar variables de entorno:**
```bash
cp .env.example .env
# Edita .env y agrega tus API keys
```

**2. Iniciar en producción:**
```bash
docker-compose up -d
```

**3. Acceder a la aplicación:**
- **App**: http://localhost:5000
- **MongoDB Express** (opcional): `docker-compose --profile debug up -d`
  - URL: http://localhost:8081
  - Usuario: `admin` / Contraseña: `admin`

### 📋 Comandos Principales

```bash
# Producción
docker-compose up -d              # Iniciar en background
docker-compose logs -f app        # Ver logs en tiempo real
docker-compose ps                 # Ver estado de contenedores
docker-compose down               # Detener todo
docker-compose down -v            # Detener y eliminar volúmenes

# Desarrollo (con hot-reload)
docker-compose -f docker-compose.dev.yml up
docker-compose -f docker-compose.dev.yml down

# Reconstruir imagen
docker-compose up --build -d

# Acceder al contenedor
docker-compose exec app sh
docker-compose exec mongo mongosh -u admin -p admin123
```

### 🔧 Configuración Avanzada

**Variables de entorno disponibles:**
```env
# API Keys (REQUERIDAS)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=...

# JWT (Cambiar en producción)
JWT_SECRET=tu-secreto-super-seguro

# MongoDB (ya configurado en docker-compose)
MONGODB_URI=mongodb://admin:admin123@mongo:27017/mindinvis?authSource=admin

# Opcional
NODE_ENV=production
PORT=5000
LOG_LEVEL=info
CORS_ORIGIN=http://localhost:5000
```

**Usar MongoDB externo:**
```yaml
# En docker-compose.yml, modifica:
environment:
  - MONGODB_URI=mongodb://tu-host:27017/mindinvis
# Y comenta el servicio 'mongo' y 'depends_on'
```

### 🐛 Modo Desarrollo

Incluye hot-reload para cambios en código:
```bash
docker-compose -f docker-compose.dev.yml up
```

**Características:**
- ✅ Hot reload automático (Vite + Nodemon)
- ✅ MongoDB Express en http://localhost:8081
- ✅ Código fuente montado como volumen
- ✅ Frontend en http://localhost:5173
- ✅ Backend en http://localhost:5000

### 📦 Solo Docker (sin compose)

```bash
# Build
docker build -t mindinvis:latest .

# Run (requiere MongoDB externo)
docker run -p 5000:5000 \
  -e MONGODB_URI=mongodb://host:27017/mindinvis \
  -e OPENAI_API_KEY=sk-... \
  -e ANTHROPIC_API_KEY=... \
  mindinvis:latest
```

### 🔍 Troubleshooting

**El contenedor no inicia:**
```bash
docker-compose logs app
```

**Limpiar todo y empezar de cero:**
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

**Ver logs de MongoDB:**
```bash
docker-compose logs mongo
```

**Conectar a MongoDB desde fuera:**
```bash
mongosh mongodb://admin:admin123@localhost:27017/mindinvis?authSource=admin
```

## Architecture

### Frontend
- **Components**: Reusable React components
- **Services**: Backend API communication
- **Store**: Global application state
- **Hooks**: Custom React hooks

### Backend
- **Controllers**: Route controller logic
- **Services**: Business logic (LLM, Mindmap, etc.)
- **Models**: Data models
- **Routes**: API endpoint definitions
- **Middleware**: Authentication, validation, error handling

### Shared
- **Constants**: Shared constants (icons, prompt styles)
- **Types**: TypeScript type definitions
- **Utils**: Shared utilities

## Migration from ChatInVis

The following components have been migrated:

- `MindmapManager.js` → `server/src/services/mindmap/MindmapManager.js`
- `LLMManagerBackground.js` → `server/src/services/llm/LLMManager.js`
- `PromptBuilder.js` → `server/src/services/llm/PromptBuilder.js`
- Models (Problem, Intervention, Consequence) → `server/src/models/`
- Utils → `server/src/utils/` and `shared/utils/`

## License

MIT
