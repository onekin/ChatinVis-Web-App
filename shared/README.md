# ChatInVis - Shared

Código compartido entre el cliente y el servidor.

## Estructura

```
shared/
├── constants/         # Constantes compartidas
│   ├── IconsMap.js   # Mapeo de iconos (migrado de ChatInVis)
│   ├── PromptStyles.js # Estilos de prompts
│   └── ModelDefaultValues.js # Valores por defecto de modelos
├── types/            # Definiciones de tipos/interfaces
│   ├── mindmap.types.js
│   ├── llm.types.js
│   └── user.types.js
└── utils/            # Utilidades compartidas
    ├── validation.js
    └── formatting.js
```

## Contenido

### Constants

#### IconsMap.js
Mapeo de iconos utilizados en los nodos del mind map. Migrado desde ChatInVis, define qué icono usar para cada tipo de nodo (problema, intervención, consecuencia, etc.).

#### PromptStyles.js
Estilos y formatos de prompts para el LLM. Define cómo estructurar las preguntas y respuestas.

#### ModelDefaultValues.js
Valores por defecto para los modelos Problem, Intervention y Consequence. Incluye propiedades predeterminadas y validaciones.

### Types

Definiciones de tipos/interfaces para:
- Mindmap (estructura de mind map, nodos, conexiones)
- LLM (requests, responses, configuración)
- User (perfil, settings, preferencias)

### Utils

Utilidades compartidas entre frontend y backend:
- Validación de datos
- Formateo de texto
- Parseo de respuestas LLM

## Uso

```javascript
// En el cliente
import { IconsMap } from '@shared/constants/IconsMap'
import { validateMindmap } from '@shared/utils/validation'

// En el servidor
import { ModelDefaultValues } from '../shared/constants/ModelDefaultValues.js'
import { formatLLMResponse } from '../shared/utils/formatting.js'
```

## Package.json

```json
{
  "name": "chatinvis-shared",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./constants/*": "./constants/*",
    "./types/*": "./types/*",
    "./utils/*": "./utils/*"
  }
}
```
