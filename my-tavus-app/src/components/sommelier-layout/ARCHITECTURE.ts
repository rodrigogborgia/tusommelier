/**
 * ARCHITECTURE & COMPONENT RELATIONSHIPS
 * 
 * Diagrama visual de cómo se estructuran los componentes
 * y cómo interactúan entre sí.
 */

// ============================================================================
// ESTRUCTURA DE COMPONENTES
// ============================================================================

/*
┌─────────────────────────────────────────────────────────────┐
│                    Tu Aplicación                             │
│  (App.tsx, Conversation.tsx, etc.)                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ imports
                     ▼
         ┌───────────────────────────────┐
         │    AvatarLayout (Contenedor)  │
         │  ┌─────────────────────────┐  │
         │  │   headerContent?        │  │◄── Opcional
         │  │  (SommelierColors)      │  │
         │  └─────────────────────────┘  │
         │            │                   │
         │  ┌─────────────────────────┐  │
         │  │  avatarContent          │  │◄── Requerido
         │  │  (tu video, imagen)     │  │    (con border dorado)
         │  └─────────────────────────┘  │
         │            │                   │
         │  ┌─────────────────────────┐  │
         │  │  controls               │  │◄── Requerido
         │  │  (ControlButton[])      │  │    (barra inferior)
         │  └─────────────────────────┘  │
         └───────────────────────────────┘
                     ▲
                     │
         ┌───────────┴────────────┐
         │                        │
    ControlButton[]    ControlButton[]
    (icon, label,     (icon, label,
     onClick,          onClick,
     isActive)         isActive)


┌─────────────────────────────────────────────────────────────┐
│           ControlButton (Componente)                          │
│  ┌─────────────┐              ┌──────────────────────────┐  │
│  │ icon emoji  │              │ label (opcional)         │  │
│  │  o icono    │              │ solo en desktop          │  │
│  └─────────────┘              └──────────────────────────┘  │
│                                                              │
│  onClick → actualiza estado de emisor padre                │
│  isActive → cambia color (SommelierColors.primaryDark)     │
│  disabled → opacidad 60%                                    │
└─────────────────────────────────────────────────────────────┘
*/

// ============================================================================
// FLUJO DE DATOS
// ============================================================================

/*
1. PROPS FLOW (Top-Down)
═════════════════════════════════════════════════════════════

  Conversation.tsx
        │
        │ estado: micOn, cameraOn, etc
        │
        ▼
  <AvatarLayout>
        │
        ├─┬─→ headerContent
        │ │
        │ ├─→ avatarContent
        │ │
        │ └─→ controls
        │        │
        │        ├─→ <ControlButton onClick={toggleMic} />
        │        │
        │        ├─→ <ControlButton onClick={toggleCamera} />
        │        │
        │        └─→ <ControlButton onClick={handleEnd} />
        │
        ▼
  Renderiza el layout


2. EVENT FLOW (Bottom-Up)
═════════════════════════════════════════════════════════════

  User clicks ControlButton
        │
        ▼
  onClick handler se ejecuta
        │
        ▼
  Llama función del padre (toggleMic, etc)
        │
        ▼
  Padre actualiza estado
        │
        ▼
  Re-render con nuevo isActive
        │
        ▼
  ControlButton cambia color/apariencia
*/

// ============================================================================
// INTEGRACIÓN CON TU CÓDIGO EXISTENTE
// ============================================================================

/*
ANTES (Sin Sommelier Components)
═════════════════════════════════════════════════════════════

  <div className={styles.container}>
    <header>...</header>
    <div className={styles.mainContent}>
      <MainVideo />
      <PreviewVideos />
    </div>
    <footer>
      <div className={styles.footerControls}>
        <MicButton />
        <CameraButton />
        <EndButton />
      </div>
    </footer>
  </div>


DESPUÉS (Con Sommelier Components)
═════════════════════════════════════════════════════════════

  <AvatarLayout
    headerContent={<h1>Sommelier</h1>}
    avatarContent={
      <>
        <MainVideo />
        <PreviewVideos />
      </>
    }
    controls={
      <>
        <ControlButton icon="🎤" onClick={toggleMic} />
        <ControlButton icon="📹" onClick={toggleCamera} />
        <ControlButton icon="📞" onClick={handleEnd} />
      </>
    }
  />

VENTAJAS:
✓ Código más limpio
✓ Responsividad automática
✓ Estilos consistentes
✓ Animaciones incluidas
*/

// ============================================================================
// ESTRUCTURA DE CARPETAS
// ============================================================================

/*
src/components/
├── sommelier-layout/                 ← 🆕 NUEVA CARPETA
│   ├── AvatarLayout.tsx
│   ├── ControlButton.tsx
│   ├── ExampleAvatarInterface.tsx
│   ├── EXAMPLES.tsx
│   ├── index.ts
│   │
│   ├── avatar-layout.module.css
│   ├── control-button.module.css
│   ├── example.module.css
│   │
│   ├── README.md
│   ├── sommelier-styled-components.example.ts
│   │
│   └── [Este archivo: architecture.ts]
│
├── cvi/
│   ├── components/
│   │   ├── conversation/
│   │   ├── device-select/
│   │   ├── audio-wave/
│   │   └── cvi-provider/
│   │
│   └── hooks/
│
└── [otros componentes existentes]
*/

// ============================================================================
// PALETA DE COLORES - JERARQUÍA
// ============================================================================

/*
PRIMARIOS (Más usados)
═════════════════════════════════════════════════════════════

1. Beige Cálido        #FAF3E0
   Uso principal: Fondo general
   Importancia: ⭐⭐⭐⭐⭐

2. Dorado Cálido       #C69C6D
   Uso principal: Botones, marcos, acentos
   Importancia: ⭐⭐⭐⭐⭐

3. Burgundy Oscuro     #6B0F1A
   Uso principal: Títulos, bordes, textos
   Importancia: ⭐⭐⭐⭐⭐


SECUNDARIOS (Menos usados)
═════════════════════════════════════════════════════════════

4. Dorado Claro        #E0C097
   Uso: Bordes finos, detalles
   Importancia: ⭐⭐⭐

5. Beige Oscuro        #F5EAD6
   Uso: Fondos secundarios
   Importancia: ⭐⭐

6. Blanco              #FFFFFF
   Uso: Fondos de componentes
   Importancia: ⭐⭐⭐

7. Marrón Oscuro       #3D2817
   Uso: Textos oscuros
   Importancia: ⭐⭐


ESPECIALES
═════════════════════════════════════════════════════════════

8. Sombra (RGBA)       rgba(107, 15, 26, 0.12)
   Uso: Sombras sutiles
   Importancia: ⭐


VARIANTES POR ESTADO
═════════════════════════════════════════════════════════════

Normal Button
  Background: linear-gradient(#C69C6D → #B8926B)
  Color:      #3D2817
  Border:     #6B0F1A

Hover Button
  Background: linear-gradient(#D4A96E → #C69C6D)
  Color:      #3D2817
  Border:     #8B3A3A
  Shadow:     más pronunciada

Active Button
  Background: linear-gradient(#6B0F1A → #8B3A3A)
  Color:      #E0C097
  Border:     #E0C097
  Shadow:     más pronunciada

Disabled Button
  Background: linear-gradient(#D9CFC1 → #CFC4B8)
  Color:      #A0968C
  Border:     #BFB5AB
  Opacity:    0.6
*/

// ============================================================================
// RESPONSIVE DESIGN - DECISIONES
// ============================================================================

/*
Desktop (1920px+)
┌────────────────────────────────────────┐
│        Header (Logo/Título)            │  ← Visible
├────────────────────────────────────────┤
│                                        │
│         Avatar 16:9                    │  ← Grande
│         (800px max-width)              │
│                                        │
├────────────────────────────────────────┤
│  🎤 Mic | 📹 Camera | 📞 End           │  ← Con etiquetas
└────────────────────────────────────────┘


Tablet (768px)
┌────────────────────────────────┐
│    Header (reducido)           │  ← Más pequeño
├────────────────────────────────┤
│                                │
│     Avatar 16:9                │  ← Mediano
│     (max-width: 95%)           │
│                                │
├────────────────────────────────┤
│   [🎤] [📹] [📞]              │  ← Sin etiquetas
└────────────────────────────────┘


Mobile (390px)
┌────────────────────────────────┐
│   Header (muy reducido)        │  ← Mínimo
├────────────────────────────────┤
│                                │
│     Avatar 1:1                 │  ← Cuadrado
│     (max-height: 55vh)         │
│                                │
├────────────────────────────────┤
│        [🎤] [📹] [📞]         │  ← Solo iconos
└────────────────────────────────┘


Landscape (<600px alto)
┌────────────────────────────────┐
│ H| Avatar 1:1   |[🎤][📹][📞]│
│ e|  reducido    |             │
│ a|              |             │
│ d|              |             │
└────────────────────────────────┘
  ↑ Comprimido verticalmente
*/

// ============================================================================
// PERFORMANCE CONSIDERATIONS
// ============================================================================

/*
OPTIMIZACIONES INCLUIDAS
═════════════════════════════════════════════════════════════

1. React.memo() en componentes sin cambios
   └─ Evita re-renders innecesarios

2. CSS Modules
   └─ Estilos scoped, sin conflictos

3. Media queries con mobile-first
   └─ Menos CSS para móvil

4. GPU-accelerated animations
   └─ transform: translateY() en lugar de top/bottom

5. Backdrop-filter blur
   └─ Solo en navegadores modernos


RECOMENDACIONES PARA MÁXIMA PERFORMANCE
═════════════════════════════════════════════════════════════

1. Usar React DevTools Profiler
   └─ Identificar re-renders lentos

2. Usar Chrome Dev Tools Lighthouse
   └─ Revisar Core Web Vitals

3. Lazy load componentes si es necesario
   └─ import { lazy } from 'react'

4. Considerar virtualization si hay muchos botones
   └─ react-window para largas listas

5. Monitores performance en producción
   └─ Web Analytics, Sentry, etc
*/

// ============================================================================
// STYLING APPROACH: CSS MODULES vs STYLED-COMPONENTS
// ============================================================================

/*
CSS MODULES (ACTUAL)
═════════════════════════════════════════════════════════════

✓ Incluido por defecto en Vite
✓ Mejor para grandes aplicaciones
✓ Separación clara: estilos en .css
✓ Mejor performance (CSS separado)
✓ Fácil de debuggear
✓ Compatible con todos los navegadores

Uso:
  import styles from './component.module.css'
  <div className={styles.className}>


STYLED-COMPONENTS (ALTERNATIVA)
═════════════════════════════════════════════════════════════

✓ Todo el código en una línea: component + styles
✓ Variables de props dinámicas fácilmente
✓ No hay conflictos de nombres
✓ Bundling automático

⚠ Más lento (JS-in-CSS)
⚠ Tamaño de bundle más grande
⚠ Requiere instalación adicional
⚠ Debugging más complejo

Cuando usar:
  └─ Si necesitas estilos muy dinámicos
  └─ Si prefieres todo en JS

Disponible en: sommelier-styled-components.example.ts
*/

// ============================================================================
// INTEGRACIÓN CON LIBRERÍAS EXTERNAS
// ============================================================================

/*
COMPATIBLE CON
═════════════════════════════════════════════════════════════

✓ @daily-co/daily-react          (tu videollamada actual)
✓ Tavus CVI API                  (tu backend)
✓ React Router                   (navegación)
✓ TanStack Query                 (fetching de datos)
✓ Zustand / Redux                (state management)
✓ Zod / TypeScript               (validación)

PUEDE AMPLIARSE CON
═════════════════════════════════════════════════════════════

+ react-icons                  (iconos profesionales)
+ framer-motion                (animaciones avanzadas)
+ zustand                      (state management)
+ react-i18next                (multiidioma)
+ sentry                       (error tracking)

NO REQUIERE
═════════════════════════════════════════════════════════════

× Material-UI (demasiado pesado para avatar)
× Bootstrap (conflictos con CSS custom)
× Tailwind (ya tenemos custom CSS)
*/

// ============================================================================
// CASOS DE USO Y EJEMPLOS
// ============================================================================

/*
CASO 1: Videollamada Interactiva (Tu uso actual)
═════════════════════════════════════════════════════════════

  <AvatarLayout
    avatarContent={<DailyVideo sessionId={replicaId} />}
    controls={
      <>
        <ControlButton isActive={micOn} onClick={toggleMic} />
        <ControlButton isActive={cameraOn} onClick={toggleCamera} />
        <ControlButton onClick={endCall} />
      </>
    }
  />

Estado: estado local en componente padre
Actualizaciones: en tiempo real durante video


CASO 2: Presentación de Avatar (Lectura)
═════════════════════════════════════════════════════════════

  <AvatarLayout
    headerContent={<h1>Sommelier Intro</h1>}
    avatarContent={<video src="intro.mp4" autoPlay />}
    controls={
      <div>
        Click para pausar
      </div>
    }
  />

Estado: video automático, UI mínimo
Actualizaciones: usuario pausa


CASO 3: Multi-Avatar (Comparación)
═════════════════════════════════════════════════════════════

  <div style={{ display: 'flex' }}>
    <AvatarLayout avatar1 controls1 />
    <AvatarLayout avatar2 controls2 />
  </div>

Estado: side-by-side
Actualizaciones: independientes


CASO 4: Modo Fullscreen (Inmersivo)
═════════════════════════════════════════════════════════════

  <AvatarLayout
    avatarContent={<canvas fullscreen />}
    controls={<div>minimal buttons</div>}
  />

Estado: pantalla completa
Actualizaciones: gestos touch
*/

// ============================================================================
// INFORMACIÓN FINAL
// ============================================================================

export const ARCHITECTURE_INFO = {
  version: "1.0.0",
  createdFor: "Espacio Sommelier Avatar UI",
  components: ["AvatarLayout", "ControlButton"],
  examples: 7,
  colors: 8,
  mediaQueries: 6,
  estimatedTime: "15-30 minutes to integrate",
  maintenance: "Low - pure components",
  scalability: "Horizontal - add more buttons easily",
  performance: "High - optimized for video streaming"
};

console.log(`
╔══════════════════════════════════════════════════════════╗
║           Sommelier Avatar Components                    ║
║                                                          ║
║  Architecture ready for production                      ║
║  Fully typed with TypeScript                            ║
║  Responsive design included                             ║
║  Espacio Sommelier branded                              ║
╚══════════════════════════════════════════════════════════╝
`);
