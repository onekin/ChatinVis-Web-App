# Milestone 1: UI Funcional del Cliente

## Objetivo
Crear la interfaz de usuario completa y funcional del cliente con datos mock (simulados), sin necesitar el backend todavía.

## Resultado Final
Al completar este milestone tendrás:
- Layout completo (Header, Sidebar, Canvas)
- Componentes básicos funcionando
- Visualización de un mind map simple con D3.js
- Input para hacer "preguntas" (que se añaden como nodos mock)
- Sistema de estado con Zustand

---

## Conceptos a Aprender

### React Básico
- **Componentes**: Funciones que devuelven JSX (HTML en JavaScript)
- **Props**: Pasar datos entre componentes (como argumentos de función)
- **Estado (State)**: Datos que cambian y causan re-renderizado
- **Eventos**: Manejar clicks, inputs, etc.

### CSS Flexbox
- `display: flex` - Activa flexbox
- `flex-direction: column` - Organiza verticalmente
- `flex-direction: row` - Organiza horizontalmente
- `flex: 1` - Ocupa todo el espacio disponible

### Zustand (State Management)
- Store global que comparten todos los componentes
- Evita pasar props de componente en componente

---

## Paso 1: Layout Básico (Header + Sidebar + Canvas)

### 1.1 Estructura HTML/JSX en `App.jsx`

**Objetivo:** Crear la estructura de 3 áreas

```
┌─────────────────────────────┐
│   Header                    │
├─────────┬───────────────────┤
│ Sidebar │  Canvas           │
└─────────┴───────────────────┘
```

**Conceptos clave:**
- Un componente React es una función que devuelve JSX
- JSX debe tener **un solo elemento raíz** (envolver todo en un `<div>`)
- Usa `className` (no `class`) para CSS

**Qué hacer:**
1. En `App.jsx`, crea la estructura con estos elementos:
   - Un `<div>` principal con className="app"
   - Dentro: un `<header>` con className="header"
   - Un `<div>` con className="main-container" que contenga:
     - Un `<aside>` con className="sidebar"
     - Un `<main>` con className="canvas-container"

**Contenido temporal:**
- Header: Título "ChatInVis" y subtítulo
- Sidebar: Un `<h2>` que diga "Controles"
- Canvas: Un texto que diga "Aquí irá el mind map"

### 1.2 Estilos en `App.css`

**Objetivo:** Usar Flexbox para organizar el layout

**Conceptos clave:**
- `.app` debe organizarse en columna (header arriba, resto abajo)
- `.main-container` debe organizarse en fila (sidebar izquierda, canvas derecha)
- Usa `flex: 1` para que elementos ocupen todo el espacio

**Qué hacer:**
1. Crea `client/src/styles/App.css`
2. Haz que `.app`:
   - Ocupe toda la altura de la ventana (`height: 100vh`)
   - Use flexbox en columna
3. Haz que `.header` tenga:
   - Fondo oscuro
   - Texto blanco
   - Padding
4. Haz que `.main-container`:
   - Use flexbox en fila
   - Ocupe el espacio restante (`flex: 1`)
5. Haz que `.sidebar` tenga:
   - Ancho fijo (300px)
   - Fondo blanco
   - Borde a la derecha
6. Haz que `.canvas-container`:
   - Ocupe todo el espacio restante (`flex: 1`)
   - Fondo gris claro

**Comprueba:** Deberías ver el layout dividido correctamente

---

## Paso 2: Crear Componentes Separados

### 2.1 ¿Por qué componentes separados?

**Concepto:** En vez de tener todo en `App.jsx`, dividimos en piezas pequeñas y reutilizables.

**Ventajas:**
- Código más organizado
- Más fácil de mantener
- Componentes reutilizables

### 2.2 Componente Header

**Qué hacer:**
1. Crea `client/src/components/common/Header.jsx`
2. Mueve el código del header desde `App.jsx` aquí
3. Crea `client/src/components/common/Header.css` para sus estilos
4. Importa y usa `<Header />` en `App.jsx`

**Estructura de un componente:**
```jsx
// Header.jsx
import './Header.css'

function Header() {
  return (
    <header className="header">
      {/* tu código aquí */}
    </header>
  )
}

export default Header
```

**Usar el componente:**
```jsx
// App.jsx
import Header from './components/common/Header'

function App() {
  return (
    <div className="app">
      <Header />
      {/* resto del código */}
    </div>
  )
}
```

### 2.3 Componente Sidebar

**Qué hacer:**
1. Crea `client/src/components/sidebar/Sidebar.jsx`
2. Crea `client/src/components/sidebar/Sidebar.css`
3. Mueve el código del sidebar aquí
4. Importa y usa en `App.jsx`

### 2.4 Componente MindmapCanvas

**Qué hacer:**
1. Crea `client/src/components/mindmap/MindmapCanvas.jsx`
2. Crea `client/src/components/mindmap/MindmapCanvas.css`
3. Por ahora solo un placeholder que diga "Canvas del Mind Map"

**Resultado:** Tu `App.jsx` debería quedar así:
```jsx
import Header from './components/common/Header'
import Sidebar from './components/sidebar/Sidebar'
import MindmapCanvas from './components/mindmap/MindmapCanvas'
import './styles/App.css'

function App() {
  return (
    <div className="app">
      <Header />
      <div className="main-container">
        <Sidebar />
        <MindmapCanvas />
      </div>
    </div>
  )
}

export default App
```

---

## Paso 3: Estado Local con useState

### 3.1 Concepto: ¿Qué es el Estado?

**Estado = Datos que cambian y causan que React vuelva a renderizar**

Ejemplo: Un contador, un input, datos que el usuario modifica.

**Sintaxis:**
```jsx
import { useState } from 'react'

function MiComponente() {
  // [variable, función para cambiarla] = useState(valor inicial)
  const [contador, setContador] = useState(0)

  return (
    <div>
      <p>Contador: {contador}</p>
      <button onClick={() => setContador(contador + 1)}>
        Incrementar
      </button>
    </div>
  )
}
```

### 3.2 Ejercicio: Input para Preguntas

**Objetivo:** Crear un input en el Sidebar donde el usuario pueda escribir preguntas

**Qué hacer:**
1. En `Sidebar.jsx`, importa `useState`
2. Crea un estado para el texto del input:
   ```jsx
   const [pregunta, setPregunta] = useState('')
   ```
3. Crea un `<input>` que:
   - Muestre el valor de `pregunta`
   - Cuando cambie, actualice el estado con `setPregunta`
4. Crea un `<button>` que cuando se haga click:
   - Muestre un `alert` con la pregunta
   - Limpie el input

**Pistas:**
```jsx
<input
  type="text"
  value={pregunta}
  onChange={(e) => setPregunta(e.target.value)}
  placeholder="Escribe tu pregunta..."
/>

<button onClick={manejarEnvio}>
  Enviar
</button>
```

**Comprueba:** Deberías poder escribir y ver tu pregunta en un alert

---

## Paso 4: Estado Global con Zustand

### 4.1 Concepto: ¿Por qué Zustand?

**Problema:** Si tienes datos que múltiples componentes necesitan, pasar props es tedioso:
```
App → Sidebar → Input → enviar pregunta
App → Canvas → mostrar pregunta
```

**Solución:** Un "store" global al que todos pueden acceder

### 4.2 Crear el Store de Mindmap

**Qué hacer:**
1. Crea `client/src/store/useMindmapStore.js`
2. Define el store con Zustand:

```javascript
import { create } from 'zustand'

const useMindmapStore = create((set) => ({
  // Estado
  nodes: [],
  connections: [],

  // Acciones
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),

  clearNodes: () => set({ nodes: [], connections: [] })
}))

export default useMindmapStore
```

**Conceptos:**
- `nodes`: Array de nodos del mind map
- `addNode`: Función para añadir un nodo
- `set`: Función de Zustand para actualizar el estado

### 4.3 Usar el Store en Sidebar

**Qué hacer:**
1. En `Sidebar.jsx`, importa el store:
   ```jsx
   import useMindmapStore from '../../store/useMindmapStore'
   ```
2. Dentro del componente, obtén la función `addNode`:
   ```jsx
   const addNode = useMindmapStore((state) => state.addNode)
   ```
3. Cuando el usuario envíe una pregunta, añade un nodo:
   ```jsx
   const manejarEnvio = () => {
     if (pregunta.trim()) {
       addNode({
         id: Date.now(), // ID temporal
         type: 'question',
         content: pregunta,
         x: Math.random() * 400,
         y: Math.random() * 300
       })
       setPregunta('')
     }
   }
   ```

### 4.4 Usar el Store en Canvas

**Qué hacer:**
1. En `MindmapCanvas.jsx`, importa el store
2. Obtén los nodos:
   ```jsx
   const nodes = useMindmapStore((state) => state.nodes)
   ```
3. Muéstralos temporalmente como lista:
   ```jsx
   return (
     <div className="mindmap-canvas">
       <h3>Nodos:</h3>
       <ul>
         {nodes.map(node => (
           <li key={node.id}>{node.content}</li>
         ))}
       </ul>
     </div>
   )
   ```

**Comprueba:** Escribe una pregunta en el Sidebar, envíala, y debería aparecer en el Canvas

---

## Paso 5: Visualización con D3.js (Básico)

### 5.1 Concepto: ¿Qué es D3.js?

**D3 = Data-Driven Documents**

Librería para crear visualizaciones interactivas. En nuestro caso: círculos (nodos) y líneas (conexiones).

### 5.2 Crear un SVG para dibujar

**Conceptos:**
- SVG = elemento HTML para gráficos vectoriales
- `<circle>` = círculo
- `<line>` = línea
- `<text>` = texto

**Qué hacer:**
1. En `MindmapCanvas.jsx`, cambia el contenido por un `<svg>`:
   ```jsx
   return (
     <div className="canvas-container">
       <svg className="mindmap-svg" width="100%" height="100%">
         {/* Aquí irán los nodos */}
       </svg>
     </div>
   )
   ```

### 5.3 Dibujar Nodos como Círculos

**Qué hacer:**
1. Obtén los nodos del store
2. Por cada nodo, dibuja un círculo y texto:
   ```jsx
   const nodes = useMindmapStore((state) => state.nodes)

   return (
     <svg className="mindmap-svg" width="100%" height="100%">
       {nodes.map(node => (
         <g key={node.id}>
           <circle
             cx={node.x}
             cy={node.y}
             r={50}
             fill="#3498db"
             stroke="#2980b9"
             strokeWidth={2}
           />
           <text
             x={node.x}
             y={node.y}
             textAnchor="middle"
             fill="white"
             fontSize="12"
           >
             {node.content}
           </text>
         </g>
       ))}
     </svg>
   )
   ```

**Conceptos:**
- `<g>` agrupa círculo y texto
- `cx, cy` = posición del centro
- `r` = radio
- `textAnchor="middle"` = centra el texto

**Comprueba:** Deberías ver círculos azules con el texto de tus preguntas

### 5.4 Hacer Nodos Arrastrables (Drag)

**Qué hacer:**
1. Instala d3-drag: `npm install d3-drag d3-selection`
2. Usa `useRef` y `useEffect` para añadir comportamiento de arrastre
3. Actualiza la posición en el store cuando se arrastra

**Pistas:** Este es más avanzado, búscalo cuando llegues aquí o pide ayuda específica

---

## Paso 6: Mejorar el Sidebar

### 6.1 Añadir Botones de Acción

**Qué hacer:**
1. Botón "Limpiar Todo" que llame a `clearNodes()`
2. Botón "Centrar Vista"
3. Mostrar contador de nodos

### 6.2 Añadir Selector de Tipo de Nodo

**Qué hacer:**
1. Añade un `<select>` para elegir tipo: question, problem, intervention, consequence
2. Guarda el tipo seleccionado en un estado
3. Usa ese tipo al crear el nodo

---

## Paso 7: Añadir Conexiones entre Nodos

### 7.1 Concepto

Los nodos deben conectarse. Por ejemplo: una pregunta genera una respuesta (nodo hijo).

**Estructura de conexión:**
```javascript
{
  id: 1,
  sourceId: nodeId1,
  targetId: nodeId2
}
```

### 7.2 Qué hacer

1. Añade `connections` al store
2. Añade función `addConnection` al store
3. En el SVG, antes de dibujar nodos, dibuja líneas:
   ```jsx
   {connections.map(conn => {
     const source = nodes.find(n => n.id === conn.sourceId)
     const target = nodes.find(n => n.id === conn.targetId)

     return (
       <line
         key={conn.id}
         x1={source.x}
         y1={source.y}
         x2={target.x}
         y2={target.y}
         stroke="#95a5a6"
         strokeWidth={2}
       />
     )
   })}
   ```

---

## Paso 8: Click en Nodo para Ver Detalles

### 8.1 Concepto

Cuando haces click en un nodo, debe:
1. Seleccionarse (cambiar color)
2. Mostrar detalles en el Sidebar

### 8.2 Qué hacer

1. Añade `selectedNodeId` al store
2. Añade función `selectNode(id)`
3. En el círculo, añade `onClick`:
   ```jsx
   <circle
     onClick={() => selectNode(node.id)}
     // ...
   />
   ```
4. En el Sidebar, muestra detalles del nodo seleccionado

---

## Paso 9: Styling y Pulido

### 9.1 Mejorar Estilos

- Añadir hover effects a botones
- Mejorar colores y espaciado
- Añadir sombras
- Hacer sidebar responsive

### 9.2 Añadir Iconos

Ya tienes `lucide-react` instalado:
```jsx
import { Plus, Trash2, Circle } from 'lucide-react'

<button>
  <Plus size={16} />
  Añadir Nodo
</button>
```

---

## Checklist Final

Al terminar esta milestone deberías tener:

- [ ] Layout completo con Header, Sidebar y Canvas
- [ ] Componentes separados y organizados
- [ ] Input funcional para crear preguntas
- [ ] Store de Zustand funcionando
- [ ] Nodos visualizándose como círculos en SVG
- [ ] Poder añadir múltiples nodos
- [ ] Poder limpiar todos los nodos
- [ ] Click en nodo para seleccionar
- [ ] (Opcional) Nodos arrastrables
- [ ] (Opcional) Conexiones entre nodos visibles
- [ ] Estilos básicos aplicados

---

## Recursos de Aprendizaje

### React
- [React Docs (español)](https://es.react.dev/)
- Conceptos clave: componentes, props, useState, useEffect

### CSS Flexbox
- [Flexbox Froggy](https://flexboxfroggy.com/#es) - Juego para aprender flexbox
- [CSS Tricks - Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

### Zustand
- [Zustand Docs](https://docs.pmnd.rs/zustand/getting-started/introduction)

### D3.js / SVG
- [MDN - SVG](https://developer.mozilla.org/es/docs/Web/SVG)
- Tutorial básico de círculos y líneas en SVG

---

## Siguientes Milestones

**Milestone 2:** Backend API
- Crear servidor Express
- Endpoints para crear/obtener nodos
- Base de datos

**Milestone 3:** Integración LLM
- Conectar con OpenAI/Anthropic
- Generar respuestas reales
- Procesar feedback

**Milestone 4:** Funcionalidades Avanzadas
- Autenticación
- Guardar/cargar mind maps
- Exportar
- Historial
