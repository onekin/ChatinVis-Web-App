# MindInVis

Una aplicación web para mapas mentales con integración de LLMs, basada en ChatInVis.

## Estructura del Proyecto

```
MindInVis/
├── client/         # Frontend (React + Vite)
├── server/         # Backend (Node.js + Express)
├── shared/         # Código compartido entre cliente y servidor
├── docs/           # Documentación del proyecto
└── seed.js         # Script de inicialización de datos
```

## Stack Tecnológico

### Frontend
- **React 18** - Framework de UI
- **Vite** - Build tool y dev server
- **Zustand** - Gestión de estado
- **ReactFlow** - Visualización de mapas mentales
- **D3.js** - Visualización de datos avanzada
- **TanStack Query** - Gestión de datos asíncronos
- **Axios** - Cliente HTTP
- **React Router** - Navegación
- **Framer Motion** - Animaciones

### Backend
- **Node.js + Express** - Servidor y API REST
- **LangChain** - Integración con LLMs
- **Mongoose** - ODM para MongoDB
- **JWT** - Autenticación
- **Winston** - Logging
- **Helmet** - Seguridad HTTP
- **Morgan** - HTTP request logger

### LLM APIs
- **OpenAI** - GPT-4, GPT-3.5-turbo
- **Anthropic** - Claude 2.0
- **Google Generative AI** - Gemini

## Instalación

### Requisitos Previos
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **MongoDB** (instalación local o instancia remota)

### Configuración Inicial

1. **Clonar el repositorio:**
```bash
git clone <repository-url>
cd ChatinVis-Web-App
```

2. **Instalar dependencias:**
```bash
# Instalar todas las dependencias (root + client + server + shared)
npm install

# O instalar manualmente cada workspace:
npm run install:all
```

3. **Configurar variables de entorno:**

Crear archivo `.env` en la raíz del proyecto con:
```env
# API Keys de LLMs (REQUERIDAS)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...

# JWT Secret (Cambiar en producción)
JWT_SECRET=tu-secreto-super-seguro-aqui

# MongoDB URI
MONGODB_URI=mongodb://localhost:27017/mindinvis

# Configuración opcional
NODE_ENV=development
PORT=5000
```

También crear `.env` en `client/`:
```env
VITE_API_URL=http://localhost:5000
```

4. **Inicializar la base de datos:**
```bash
# Ejecutar seed para datos iniciales
node seed.js
```

## Desarrollo

### Ejecutar en modo desarrollo

```bash
# Iniciar frontend y backend simultáneamente
npm run dev

# O iniciar por separado:
npm run dev:client    # Frontend en http://localhost:5173
npm run dev:server    # Backend en http://localhost:5000
```

### Otros comandos útiles

```bash
# Linting
npm run lint              # Lint de todo el proyecto
npm run lint:client       # Solo frontend
npm run lint:server       # Solo backend

# Testing
npm run test              # Tests de todo el proyecto
npm run test:client       # Solo frontend
npm run test:server       # Solo backend

# Build de producción
npm run build             # Build de cliente y servidor
npm run build:client      # Solo frontend
npm run build:server      # Solo servidor
```

## Estructura de Workspaces

Este proyecto usa **npm workspaces** para gestionar múltiples paquetes:

- **Root**: Configuración compartida y scripts principales
- **client**: Aplicación React frontend
- **server**: API backend con Express
- **shared**: Código compartido (constantes, tipos, utilidades)

Las dependencias se instalan de forma centralizada desde la raíz del proyecto.

## Arquitectura del Proyecto

### Frontend (`client/`)
```
src/
├── assets/          # Recursos estáticos (imágenes, fuentes)
├── components/      # Componentes React
│   ├── common/     # Componentes reutilizables
│   ├── mindmap/    # Componentes del mapa mental
│   ├── modals/     # Modales de configuración y ayuda
│   └── sidebar/    # Barra lateral con controles
├── hooks/          # Custom React hooks
├── services/       # Comunicación con la API
├── store/          # Estado global (Zustand)
├── styles/         # Estilos globales
└── utils/          # Utilidades del cliente
```

### Backend (`server/`)
```
src/
├── controllers/    # Controladores de rutas HTTP
├── services/       # Lógica de negocio
│   ├── llm/       # Servicios LLM
│   │   ├── LLMManager.js     # Gestión de llamadas LLM
│   │   ├── PromptBuilder.js  # Construcción de prompts
│   │   └── LLMClient.js      # Cliente LLM
│   ├── mindmap/   # Servicios de mapas mentales
│   │   └── MindmapManager.js # Gestión de mapas
│   ├── logging/   # Logging y auditoría
│   │   └── LogManager.js
│   └── storage/   # Gestión de configuración
│       ├── ModelManager.js
│       └── ParameterManager.js
├── models/        # Modelos de datos (MongoDB/Mongoose)
├── routes/        # Definición de endpoints API
├── middleware/    # Middleware (auth, validación, errores)
├── config/        # Configuración (DB, LLM)
└── utils/         # Utilidades del servidor
```

### Shared (`shared/`)
```
├── constants/     # Constantes compartidas
│   ├── IconsMap.js              # Mapeo de iconos
│   ├── PromptStyles.js          # Estilos de prompts
│   └── ModelDefaultValues.js   # Valores por defecto
├── types/         # Definiciones de tipos
└── utils/         # Utilidades compartidas
```

## Migración desde ChatInVis

Este proyecto es una migración de la extensión de navegador **ChatInVis** a una aplicación web standalone.

### Componentes Migrados

**Servicios del Backend** (desde ChatInVis Extension):
```
LLMManager.js         ← app/scripts/background/LLMManagerBackground.js
MindmapManager.js     ← app/scripts/chatinviz/MindmapManager.js
PromptBuilder.js      ← app/scripts/chatinviz/PromptBuilder.js
LLMClient.js          ← app/scripts/llm/LLMClient.js
LogManager.js         ← app/scripts/background/LogManager.js
ModelManager.js       ← app/scripts/background/ModelManager.js
ParameterManager.js   ← app/scripts/background/ParameterManager.js
```

**Constantes Compartidas** (desde ChatInVis Extension):
```
IconsMap.js           ← app/scripts/chatinviz/IconsMap.js
PromptStyles.js       ← app/scripts/chatinviz/PromptStyles.js
ModelDefaultValues.js ← app/scripts/chatinviz/ModelDefaultValues.js
```

**Modelos de Datos** (desde ChatInVis Extension):
```
Problem.js            ← app/scripts/chatinviz/model/Problem.js
Intervention.js       ← app/scripts/chatinviz/model/Intervention.js
Consequence.js        ← app/scripts/chatinviz/model/Consequence.js
```

**Utilidades** (desde ChatInVis Extension):
```
FileUtils.js          ← app/scripts/utils/FileUtils.js
LLMTextUtils.js       ← app/scripts/utils/LLMTextUtils.js
```

## Características Principales

- Visualización interactiva de mapas mentales con ReactFlow
- Integración con múltiples LLMs (OpenAI, Anthropic, Google)
- Gestión de sesiones de usuario con autenticación JWT
- Almacenamiento persistente en MongoDB
- Sistema de logging y auditoría
- Interfaz responsiva y moderna

## Documentación Adicional

- `STRUCTURE.txt` - Estructura detallada del proyecto
- `docs/` - Documentación adicional de arquitectura y migración

## Contribuir

1. Fork el proyecto
2. Crea tu feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

MIT

## Contacto

Para preguntas o soporte, abre un issue en este repositorio.
