# Arquitectura de ChatInVis

## Visión General

ChatInVis es una aplicación web full-stack para crear mind maps interactivos con integración de LLM. El usuario puede hacer preguntas, y el sistema genera respuestas estructuradas que se visualizan como nodos en el mind map.

## Stack Tecnológico

### Frontend
- **React 18**: Framework UI
- **Vite**: Build tool y dev server
- **Zustand**: State management
- **D3.js/Vis.js**: Visualización de grafos
- **Axios**: Cliente HTTP
- **TanStack Query**: Cache y sincronización de datos

### Backend
- **Node.js + Express**: Server HTTP
- **LangChain**: Integración LLM unificada
- **PostgreSQL/MongoDB**: Base de datos
- **JWT**: Autenticación
- **Winston**: Logging

### LLM Providers
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 2.0

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────┐
│                   CLIENT (React)                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Mindmap     │  │   Sidebar    │  │   Modals     │  │
│  │  Canvas      │  │   Controls   │  │   Settings   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Services (API Communication)              │  │
│  │  - MindmapService  - LLMService  - AuthService   │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │      State Management (Zustand)                   │  │
│  │  - MindmapStore  - AuthStore  - SettingsStore    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         │ HTTP/REST API
                         │
┌─────────────────────────────────────────────────────────┐
│                SERVER (Node.js + Express)               │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Routes & Controllers                 │  │
│  │  /api/llm/*  /api/mindmaps/*  /api/users/*      │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │                  Services                         │  │
│  │  ┌────────────┐  ┌──────────────┐               │  │
│  │  │ LLM        │  │ Mindmap      │               │  │
│  │  │ - Manager  │  │ - Manager    │               │  │
│  │  │ - Prompt   │  │              │               │  │
│  │  │ - Client   │  │              │               │  │
│  │  └────────────┘  └──────────────┘               │  │
│  │  ┌────────────┐  ┌──────────────┐               │  │
│  │  │ Storage    │  │ Logging      │               │  │
│  │  │ - Model    │  │ - Log        │               │  │
│  │  │ - Param    │  │ - Rating     │               │  │
│  │  └────────────┘  └──────────────┘               │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Database Models                      │  │
│  │  User  Mindmap  Node  Connection  Exploration    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                         │
                         │
         ┌───────────────┴───────────────┐
         │                               │
    ┌────────┐                     ┌──────────┐
    │ OpenAI │                     │Anthropic │
    │  API   │                     │   API    │
    └────────┘                     └──────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                 ┌───────────────┐
                 │   LangChain   │
                 └───────────────┘
```

## Flujo de Datos Principal

### 1. Usuario hace una pregunta

```
User Input (Client)
    │
    ├─> React Component (PromptInput)
    │
    ├─> Service (LLMService.queryLLM)
    │
    ├─> HTTP POST /api/llm/query
    │
    ├─> Server Controller (llm.controller.handleQuery)
    │
    ├─> LLMManager.query()
    │   │
    │   ├─> PromptBuilder.buildPrompt() - Construye prompt estructurado
    │   │
    │   ├─> LLMClient.call() - Llama a LangChain
    │   │
    │   └─> LangChain -> OpenAI/Anthropic API
    │
    ├─> Respuesta LLM (JSON estructurado)
    │
    ├─> MindmapManager.createResponseNode()
    │   │
    │   ├─> Mindmap.createNode() - Guarda en DB
    │   │
    │   └─> LogManager.logExploration()
    │
    └─> Respuesta al Cliente
        │
        └─> React Component actualiza UI con nuevo nodo
```

### 2. Usuario da feedback

```
User Feedback (Client)
    │
    ├─> React Component (NodeFeedback)
    │
    ├─> Service (LLMService.sendFeedback)
    │
    ├─> HTTP POST /api/llm/feedback
    │
    ├─> Server Controller (llm.controller.handleFeedback)
    │
    ├─> MindmapManager.processFeedback()
    │   │
    │   ├─> LLMManager.refinement() - Genera respuesta mejorada
    │   │
    │   └─> Mindmap.updateNode()
    │
    └─> Respuesta actualizada al Cliente
```

## Componentes Clave

### Frontend

#### MindmapCanvas
Componente principal que renderiza el mind map usando D3.js o Vis.js.

**Responsabilidades:**
- Renderizar nodos y conexiones
- Manejar interacciones (drag, zoom, pan)
- Actualizar visualización cuando cambia el estado

#### PromptInput
Input para que el usuario haga preguntas al LLM.

**Responsabilidades:**
- Capturar input del usuario
- Enviar query al backend
- Mostrar loading state

#### MindmapStore (Zustand)
Estado global del mind map actual.

**Estado:**
```javascript
{
  currentMindmap: {},
  nodes: [],
  connections: [],
  selectedNode: null,
  isLoading: false
}
```

**Acciones:**
- `loadMindmap(id)`
- `addNode(node)`
- `updateNode(id, updates)`
- `deleteNode(id)`
- `selectNode(id)`

### Backend

#### LLMManager
Gestiona todas las interacciones con LLMs.

**Métodos principales:**
- `query(prompt, context)`: Envía pregunta al LLM
- `refinement(originalResponse, feedback)`: Refina respuesta basada en feedback
- `summarize(nodes)`: Genera resumen de conjunto de nodos

#### MindmapManager
Orchestrador principal del mind map.

**Métodos principales:**
- `createQuestionNode(mindmapId, question)`: Crea nodo de pregunta
- `createResponseNode(mindmapId, parentId, response)`: Crea nodo de respuesta
- `processFeedback(nodeId, feedback)`: Procesa feedback del usuario
- `generateSummary(mindmapId, nodeIds)`: Genera resumen

#### PromptBuilder
Construye prompts estructurados para el LLM.

**Métodos principales:**
- `buildQueryPrompt(question, context)`: Prompt para preguntas
- `buildFeedbackPrompt(response, feedback)`: Prompt para refinamiento
- `buildSummaryPrompt(nodes)`: Prompt para resumen

## Modelos de Datos

### User
```javascript
{
  id: UUID,
  email: String,
  password: String (hashed),
  name: String,
  settings: {
    preferredModel: String,
    theme: String,
    defaultMindmapLayout: String
  },
  createdAt: Date,
  updatedAt: Date
}
```

### Mindmap
```javascript
{
  id: UUID,
  userId: UUID,
  title: String,
  description: String,
  rootNodeId: UUID,
  createdAt: Date,
  updatedAt: Date
}
```

### Node
```javascript
{
  id: UUID,
  mindmapId: UUID,
  parentId: UUID | null,
  type: 'question' | 'answer' | 'problem' | 'intervention' | 'consequence',
  content: String | Object,
  metadata: {
    model: String,
    timestamp: Date,
    feedback: Array
  },
  position: { x: Number, y: Number },
  style: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Connection
```javascript
{
  id: UUID,
  mindmapId: UUID,
  sourceNodeId: UUID,
  targetNodeId: UUID,
  type: String,
  style: Object,
  createdAt: Date
}
```

### Exploration (Log)
```javascript
{
  id: UUID,
  userId: UUID,
  mindmapId: UUID,
  nodeId: UUID,
  action: String, // 'query', 'feedback', 'edit', 'delete'
  data: Object,
  timestamp: Date
}
```

## API Endpoints

### LLM
- `POST /api/llm/query` - Enviar pregunta
- `POST /api/llm/feedback` - Enviar feedback
- `POST /api/llm/summarize` - Generar resumen

### Mindmaps
- `GET /api/mindmaps` - Listar mind maps del usuario
- `POST /api/mindmaps` - Crear nuevo mind map
- `GET /api/mindmaps/:id` - Obtener mind map específico
- `PUT /api/mindmaps/:id` - Actualizar mind map
- `DELETE /api/mindmaps/:id` - Eliminar mind map
- `GET /api/mindmaps/:id/export` - Exportar mind map

### Nodes
- `POST /api/mindmaps/:id/nodes` - Crear nodo
- `PUT /api/nodes/:id` - Actualizar nodo
- `DELETE /api/nodes/:id` - Eliminar nodo

### Users
- `POST /api/users/register` - Registro
- `POST /api/users/login` - Login
- `GET /api/users/me` - Perfil actual
- `PUT /api/users/me` - Actualizar perfil
- `PUT /api/users/me/settings` - Actualizar settings

## Seguridad

### Autenticación
- JWT tokens para autenticación
- Refresh tokens para renovación
- Tokens almacenados en httpOnly cookies

### Autorización
- Middleware de autenticación en todas las rutas protegidas
- Verificación de ownership de recursos (un usuario solo puede acceder a sus mind maps)

### Validación
- Validación de input usando express-validator
- Sanitización de datos
- Rate limiting para prevenir abuse

### API Keys
- API keys de LLM almacenadas en variables de entorno
- Nunca expuestas al cliente
- Rotación periódica recomendada

## Escalabilidad

### Caching
- TanStack Query en cliente para cache de datos
- Redis para cache en servidor (opcional)

### Rate Limiting
- Límites por usuario para queries LLM
- Límites globales para prevenir abuse

### Queue System
- Bull/BullMQ para procesar queries LLM de forma asíncrona (opcional)
- Permite manejar picos de tráfico

## Monitoreo y Logging

### Logging
- Winston para logging estructurado
- Niveles: error, warn, info, debug
- Logs de todas las llamadas LLM para auditoría

### Métricas
- Número de queries por usuario
- Tiempo de respuesta de LLM
- Errores y fallos

### Error Tracking
- Sentry o similar para tracking de errores
- Alertas para errores críticos
