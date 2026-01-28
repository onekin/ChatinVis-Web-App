# MindInVis - Servidor

Backend de MindInVis construido con Node.js, Express y LangChain.

## Estructura

```
server/
├── src/
│   ├── controllers/       # Controladores de rutas
│   │   ├── llm.controller.js
│   │   ├── mindmap.controller.js
│   │   └── user.controller.js
│   ├── services/          # Lógica de negocio
│   │   ├── llm/          # Servicios LLM
│   │   │   ├── LLMManager.js
│   │   │   ├── PromptBuilder.js
│   │   │   └── LLMClient.js
│   │   ├── mindmap/      # Servicios de mind map
│   │   │   └── MindmapManager.js
│   │   ├── logging/      # Logging
│   │   │   └── LogManager.js
│   │   └── storage/      # Gestión de configuración
│   │       ├── ModelManager.js
│   │       └── ParameterManager.js
│   ├── models/           # Modelos de datos
│   │   ├── Problem.js
│   │   ├── Intervention.js
│   │   ├── Consequence.js
│   │   ├── User.js
│   │   └── Mindmap.js
│   ├── routes/           # Definición de rutas
│   │   ├── llm.routes.js
│   │   ├── mindmap.routes.js
│   │   └── user.routes.js
│   ├── middleware/       # Middleware
│   │   ├── auth.js
│   │   ├── validate.js
│   │   └── errorHandler.js
│   ├── config/          # Configuración
│   │   ├── database.js
│   │   └── llm.js
│   ├── utils/           # Utilidades
│   │   ├── FileUtils.js
│   │   └── LLMTextUtils.js
│   └── index.js         # Punto de entrada
└── package.json
```

## Arquitectura

### Controllers
Manejan las peticiones HTTP y delegan la lógica a los services.

### Services

#### LLM Services
- **LLMManager**: Gestiona las llamadas a LLMs (OpenAI, Anthropic)
- **PromptBuilder**: Construye prompts estructurados para LLMs
- **LLMClient**: Cliente unificado para diferentes proveedores LLM

#### Mindmap Services
- **MindmapManager**: Orchestrador principal del mind map
  - Maneja interacciones de pregunta/respuesta
  - Creación y gestión de nodos
  - Procesamiento de feedback
  - Generación de resúmenes

#### Storage Services
- **ModelManager**: Gestión de configuración de modelos LLM
- **ParameterManager**: Gestión de parámetros de usuario

#### Logging Services
- **LogManager**: Registro de exploraciones y actividad

### Models
Modelos de datos migrados de ChatInVis:
- **Problem**: Modelo de problema
- **Intervention**: Modelo de intervención
- **Consequence**: Modelo de consecuencia
- **User**: Usuario del sistema
- **Mindmap**: Mind map completo

### Routes
Endpoints API REST:

#### LLM Routes
- `POST /api/llm/query` - Enviar pregunta al LLM
- `POST /api/llm/feedback` - Enviar feedback sobre respuesta

#### Mindmap Routes
- `GET /api/mindmaps` - Obtener mind maps del usuario
- `POST /api/mindmaps` - Crear nuevo mind map
- `GET /api/mindmaps/:id` - Obtener mind map específico
- `PUT /api/mindmaps/:id` - Actualizar mind map
- `DELETE /api/mindmaps/:id` - Eliminar mind map

#### User Routes
- `POST /api/users/register` - Registro
- `POST /api/users/login` - Login
- `GET /api/users/me` - Perfil actual

### Middleware
- **auth**: Autenticación JWT
- **validate**: Validación de datos de entrada
- **errorHandler**: Manejo centralizado de errores

## Variables de Entorno

```env
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/mindinvis

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRE=7d

# OpenAI
OPENAI_API_KEY=your-openai-key

# Anthropic
ANTHROPIC_API_KEY=your-anthropic-key
```

## Scripts

```bash
npm run dev          # Desarrollo con nodemon
npm start            # Producción
npm run build        # Build TypeScript (si aplica)
npm run lint         # Linting
npm run test         # Tests
```

## Integración con LangChain

El servidor usa LangChain para integración unificada con múltiples proveedores LLM:

- OpenAI: GPT-4, GPT-3.5-turbo
- Anthropic: Claude 2.0, Claude Instant

## Base de Datos

Esquema principal:
- `users` - Usuarios del sistema
- `mindmaps` - Mind maps creados
- `nodes` - Nodos individuales
- `connections` - Conexiones entre nodos
- `explorations` - Registro de exploraciones
- `settings` - Configuración de usuario
