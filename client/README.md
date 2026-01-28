# MindInVis - Client

MindInVis frontend built with React and Vite.

## Estructura

```
client/
├── public/                 # Archivos estáticos
├── src/
│   ├── assets/            # Imágenes, fuentes, etc.
│   ├── components/        # Componentes React
│   │   ├── mindmap/       # Componentes del mind map
│   │   ├── sidebar/       # Barra lateral con controles
│   │   ├── modals/        # Modales (configuración, ayuda, etc.)
│   │   └── common/        # Componentes reutilizables
│   ├── services/          # Servicios API
│   │   ├── api.js         # Cliente API base
│   │   ├── mindmap.service.js
│   │   └── llm.service.js
│   ├── store/             # Estado global (Zustand)
│   ├── hooks/             # Custom React hooks
│   ├── utils/             # Utilidades
│   ├── styles/            # Estilos globales
│   ├── App.jsx            # Componente principal
│   └── main.jsx           # Punto de entrada
├── package.json
└── vite.config.js
```

## Componentes Principales

### Mindmap Components
- **MindmapCanvas**: Canvas principal del mind map
- **MindmapNode**: Nodo individual del mind map
- **NodeEditor**: Editor de contenido de nodo
- **ConnectionLine**: Líneas de conexión entre nodos

### Sidebar Components
- **PromptInput**: Input para hacer preguntas al LLM
- **HistoryPanel**: Historial de interacciones
- **SettingsPanel**: Configuración de la aplicación
- **ExportPanel**: Exportar mind map

## Servicios

### API Service
Cliente HTTP base con manejo de autenticación y errores.

### Mindmap Service
- Crear/editar/eliminar nodos
- Gestionar conexiones
- Exportar/importar mind maps

### LLM Service
- Enviar prompts al backend
- Recibir respuestas estructuradas
- Manejar feedback

## State Management

Usando Zustand para estado global:
- `useMindmapStore`: Estado del mind map
- `useAuthStore`: Estado de autenticación
- `useSettingsStore`: Configuración de usuario

## Scripts

```bash
npm run dev          # Desarrollo con hot reload
npm run build        # Build para producción
npm run preview      # Preview del build
npm run lint         # Linting
npm run test         # Tests
```
