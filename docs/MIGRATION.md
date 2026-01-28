# Guía de Migración: ChatInVis → MindInVis

Esta guía documenta cómo los componentes de la extensión ChatInVis han sido migrados a la aplicación web MindInVis.

## Mapeo de Archivos

### Core Managers

| ChatInVis (Extension) | MindInVis (Web App) |
|----------------------|---------------------|
| `app/scripts/chatinviz/MindmapManager.js` | `server/src/services/mindmap/MindmapManager.js` |
| `app/scripts/background/LLMManagerBackground.js` | `server/src/services/llm/LLMManager.js` |
| `app/scripts/chatinviz/PromptBuilder.js` | `server/src/services/llm/PromptBuilder.js` |
| `app/scripts/llm/LLMClient.js` | `server/src/services/llm/LLMClient.js` |
| `app/scripts/chatinviz/HomePageManager.js` | ❌ No necesario (no hay página de MindMeister) |

### Models

| ChatInVis | MindInVis |
|-----------|-----------|
| `app/scripts/chatinviz/model/Problem.js` | `server/src/models/Problem.js` |
| `app/scripts/chatinviz/model/Intervention.js` | `server/src/models/Intervention.js` |
| `app/scripts/chatinviz/model/Consequence.js` | `server/src/models/Consequence.js` |

### Background Services

| ChatInVis | MindInVis |
|-----------|-----------|
| `app/scripts/background/LogManager.js` | `server/src/services/logging/LogManager.js` |
| `app/scripts/background/ModelManager.js` | `server/src/services/storage/ModelManager.js` |
| `app/scripts/background/ParameterManager.js` | `server/src/services/storage/ParameterManager.js` |
| `app/scripts/background/RatingManager.js` | `server/src/services/logging/RatingManager.js` |

### Utilities

| ChatInVis | MindInVis |
|-----------|-----------|
| `app/scripts/utils/FileUtils.js` | `server/src/utils/FileUtils.js` |
| `app/scripts/utils/LLMTextUtils.js` | `server/src/utils/LLMTextUtils.js` |
| `app/scripts/utils/Utils.js` | `server/src/utils/helpers.js` |
| `app/scripts/utils/ChromeStorage.js` | ❌ Reemplazado por base de datos |
| `app/scripts/utils/Alerts.js` | `client/src/utils/notifications.js` |

### Constants

| ChatInVis | MindInVis |
|-----------|-----------|
| `app/scripts/chatinviz/IconsMap.js` | `shared/constants/IconsMap.js` |
| `app/scripts/chatinviz/PromptStyles.js` | `shared/constants/PromptStyles.js` |
| `app/scripts/chatinviz/ModelDefaultValues.js` | `shared/constants/ModelDefaultValues.js` |
| `app/scripts/chatinviz/TemplateNodes.js` | `shared/constants/TemplateNodes.js` |

### MindMeister Integration

| ChatInVis | MindInVis |
|-----------|-----------|
| `app/scripts/mindmeister/MindmeisterClient.js` | ❌ Eliminado - Implementación propia |
| `app/scripts/mindmeister/wrapper/*` | ❌ Eliminado - No necesario |

## Cambios Arquitectónicos Principales

### 1. De Extension a Web App

**Antes (Extension):**
```javascript
// content_script.js
chrome.runtime.sendMessage({ type: 'LLM_QUERY', data: prompt })

// background.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'LLM_QUERY') {
    // Procesar con LLMManagerBackground
  }
})
```

**Después (Web App):**
```javascript
// client/src/services/llm.service.js
export const queryLLM = async (prompt) => {
  const response = await api.post('/api/llm/query', { prompt })
  return response.data
}

// server/src/controllers/llm.controller.js
export const handleQuery = async (req, res) => {
  const { prompt } = req.body
  const result = await LLMManager.query(prompt)
  res.json(result)
}
```

### 2. De Chrome Storage a Base de Datos

**Antes:**
```javascript
// ChromeStorage.js
chrome.storage.local.set({ key: value })
chrome.storage.local.get(['key'], (result) => {
  console.log(result.key)
})
```

**Después:**
```javascript
// Server con PostgreSQL/MongoDB
const user = await User.findById(userId)
user.settings = newSettings
await user.save()
```

### 3. De MindMeister API a Implementación Propia

**Antes:**
```javascript
// MindmeisterClient.js - Dependía de API de MindMeister
const node = await mindmeisterClient.createNode(parentId, text)
```

**Después:**
```javascript
// MindmapManager.js - Implementación propia
const node = await Mindmap.createNode({
  mindmapId,
  parentId,
  content: text,
  type: 'question'
})
```

## Funcionalidades a Re-implementar

### 1. Visualización de Mind Map
- **ChatInVis**: Usaba el DOM de MindMeister
- **MindInVis**: Necesita librería propia (D3.js, Vis.js, React Flow)

### 2. Autenticación
- **ChatInVis**: Usaba sesión de MindMeister
- **MindInVis**: Sistema JWT propio

### 3. Persistencia
- **ChatInVis**: Chrome Storage + API MindMeister
- **MindInVis**: Base de datos propia (PostgreSQL/MongoDB)

### 4. PDF Processing
- **ChatInVis**: `app/resources/pdfjs/`
- **MindInVis**: Copiar a `client/public/pdfjs/` o usar CDN

## Pasos de Migración

### 1. Copiar Lógica de Negocio
```bash
# Copiar managers principales
cp app/scripts/chatinviz/MindmapManager.js MindInVis/server/src/services/mindmap/
cp app/scripts/background/LLMManagerBackground.js MindInVis/server/src/services/llm/LLMManager.js

# Copiar modelos
cp app/scripts/chatinviz/model/*.js MindInVis/server/src/models/

# Copiar constantes a shared
cp app/scripts/chatinviz/IconsMap.js MindInVis/shared/constants/
cp app/scripts/chatinviz/PromptStyles.js MindInVis/shared/constants/
```

### 2. Refactorizar Dependencias de Chrome
- Eliminar referencias a `chrome.runtime.*`
- Eliminar referencias a `chrome.storage.*`
- Reemplazar con llamadas HTTP/fetch

### 3. Refactorizar Dependencias de MindMeister
- Eliminar `MindmeisterClient`
- Implementar gestión propia de mind maps
- Crear modelos de base de datos para nodos y conexiones

### 4. Adaptar para Express/React
- Convertir managers en servicios Express
- Crear endpoints REST
- Crear componentes React para UI

## Tareas Pendientes

- [ ] Migrar lógica de MindmapManager
- [ ] Adaptar LLMManager para Express
- [ ] Crear componentes React para mind map
- [ ] Implementar autenticación JWT
- [ ] Configurar base de datos
- [ ] Migrar modelos de datos
- [ ] Crear API REST completa
- [ ] Implementar visualización de mind map
- [ ] Copiar PDF.js si es necesario
- [ ] Tests unitarios e integración
