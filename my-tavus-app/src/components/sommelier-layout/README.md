# Sommelier Layout Components

Componentes React/TypeScript reutilizables que implementan la estética y diseño de **Espacio Sommelier** para tu interfaz de avatar digital.

## 📋 Descripción General

Este conjunto de componentes proporciona una estructura elegante con:

- ✅ Avatar centrado como foco principal de la pantalla
- ✅ Barra horizontal de controles en la parte inferior
- ✅ Paleta de colores cálidos y elegantes (beige, burgundy, dorado)
- ✅ Tipografía consistente con Espacio Sommelier
- ✅ Diseño responsive para desktop, tablet y móvil
- ✅ Animaciones suaves y transiciones elegantes

## 🎨 Paleta de Colores

| Color | Hex | Uso |
|-------|-----|-----|
| Burgundy Oscuro | `#6B0F1A` | Textos principales, bordes, acentos |
| Dorado Cálido | `#C69C6D` | Botones, accents, marcos |
| Dorado Claro | `#E0C097` | Bordes, detalles |
| Beige Cálido | `#FAF3E0` | Fondo principal |
| Beige Oscuro | `#F5EAD6` | Fondos secundarios |
| Marrón Oscuro | `#3D2817` | Textos oscuros |
| Blanco | `#FFFFFF` | Fondos de componentes |

## 📦 Componentes Disponibles

### 1. `AvatarLayout`

Contenedor principal que organiza toda la interfaz.

**Props:**
```typescript
interface AvatarLayoutProps {
  avatarContent: ReactNode;      // El video/contenido del avatar
  controls: ReactNode;           // Los botones de control
  headerContent?: ReactNode;     // Header opcional
}
```

**Ejemplo:**
```tsx
import { AvatarLayout } from './components/sommelier-layout';

<AvatarLayout
  headerContent={<h1>Sommelier Digital</h1>}
  avatarContent={<video src="..." />}
  controls={
    <div>
      <ControlButton icon="🎤" label="Micrófono" onClick={...} />
    </div>
  }
/>
```

### 2. `ControlButton`

Botón elegante para controles con soporte para estados activos/inactivos.

**Props:**
```typescript
interface ControlButtonProps {
  icon?: ReactNode;              // Emoji o icono
  label?: string;                // Texto del botón
  onClick: () => void;           // Función al hacer clic
  disabled?: boolean;            // Deshabilitado
  isActive?: boolean;            // Para toggles
  title?: string;                // Tooltip
}
```

**Ejemplo:**
```tsx
import { ControlButton } from './components/sommelier-layout';

<ControlButton
  icon="📞"
  label="Terminar llamada"
  onClick={handleEndCall}
  title="Finalizar la conversación"
/>
```

### 3. `ExampleAvatarInterface`

Componente de ejemplo que demuestra la integración completa.

## 🚀 Cómo Integrar

### Opción 1: Refactorizar el componente `Conversation`

Reemplaza la estructura actual en `src/components/cvi/components/conversation/index.tsx`:

```tsx
import { AvatarLayout, ControlButton } from '@/components/sommelier-layout';

export const Conversation: React.FC<ConversationProps> = (props) => {
  return (
    <AvatarLayout
      headerContent={
        <h1>Espacio Sommelier - Avatar Digital</h1>
      }
      avatarContent={
        <MainVideo />
      }
      controls={
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Tus botones existentes */}
          <ControlButton
            icon="🎤"
            onClick={toggleMic}
            isActive={micActive}
          />
          {/* Más controles... */}
        </div>
      }
    />
  );
};
```

### Opción 2: Archivo CSS Global Alternativo

Si prefieres usar variables CSS globales, crea `src/styles/sommelier-theme.css`:

```css
:root {
  --color-primary-dark: #6b0f1a;
  --color-accent-gold: #c69c6d;
  --color-bg-main: #faf3e0;
  --color-text-dark: #3d2817;
  --color-white: #ffffff;
}

body {
  background-color: var(--color-bg-main);
  color: var(--color-text-dark);
  font-family: 'Antonio', 'Segoe UI', sans-serif;
}
```

## 📱 Puntos de Quiebre Responsive

- **Desktop**: Aspectratio 16:9 para video
- **Tablet**: Aspectratio 16:9, máximo ancho 800px
- **Móvil** (< 480px): Aspectratio 1:1, solo iconos en botones
- **Landscape pequeño** (< 600px altura): Ajustes para paisaje

## 🎯 Características Principales

### Avatar Centrado
- El contenedor de video ocupa el espacio central de la pantalla
- Mantiene proporción de aspecto consistente
- Marco dorado elegante con sombra sofisticada

### Barra de Controles
- Posicionada en la parte inferior
- Diseño horizontal con botones redondeados
- Flexbox responsive para diferentes tamaños de pantalla
- Espacio suficiente para 3-5 botones

### Tipografía
- Fuente: **Antonio** (elegante y moderna)
- Fallback: Segoe UI, sans-serif
- Letras espaciadas y peso variado para jerarquía visual

### Animaciones
- Entrada suave (fade-in + slide-up)
- Hover con elevación (translate Y -2px)
- Transiciones suaves en todos los estados

## 🔧 Personalización

### Modificar Colores

En cualquier componente, importa la paleta:

```tsx
import { SommelierColors } from '@/components/sommelier-layout';

const customStyle = {
  backgroundColor: SommelierColors.accentGold,
  color: SommelierColors.textDark,
};
```

### Agregar Iconos Personalizados

```tsx
<ControlButton
  icon={<CustomSVGIcon />}
  label="Acción"
  onClick={handleClick}
/>
```

### Cambiar Animaciones

Edita `avatar-layout.module.css` → `@keyframes fadeInUp`

## 📸 Variables de Entorno

Asegúrate de que tu `vite.config.ts` incluya Anton font:

```tsx
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Font loading via CSS
})
```

En `index.html`:
```html
<link href="https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&display=swap" rel="stylesheet">
```

## 🧪 Testeo

Prueba los componentes en diferentes dispositivos:

```bash
# Desktop
npm run dev

# Tablet (768px width)
# Móvil (375px width)
# Landscape (600px height)
```

## 🌐 Integración con Tavus CVI

Los componentes son agnósticos y funcionan con cualquier API:

```tsx
import { DailyVideo } from '@daily-co/daily-react';
import { AvatarLayout, ControlButton } from '@/components/sommelier-layout';

<AvatarLayout
  avatarContent={
    <DailyVideo sessionId={replicaId} type="video" />
  }
  controls={...}
/>
```

## 📝 Notas Importantes

1. **CSS Modules**: Todos los estilos usa CSS Modules para evitar conflictos
2. **Mobile-First**: Responsive design pensado primero para móvil
3. **Accesibilidad**: Todos los botones tienen `aria-label` y `title`
4. **Performance**: Componentes memorizados para evitar re-renders innecesarios
5. **iOS**: Optimizaciones incluidas para Safari en iOS

## 🎓 Estructura de Archivos

```
src/components/sommelier-layout/
├── AvatarLayout.tsx              # Componente principal contenedor
├── avatar-layout.module.css      # Estilos del layout
├── ControlButton.tsx             # Componente de botón
├── control-button.module.css     # Estilos del botón
├── ExampleAvatarInterface.tsx    # Ejemplo de uso completo
├── example.module.css            # Estilos del ejemplo
└── index.ts                      # Exportes públicos
```

## 🤝 Soporte

Para personalización adicional o problemas, consulta:
- Diseño original: https://www.espaciosommelier.com/
- Framework: React + TypeScript + Vite
- Componentes Daily: @daily-co/daily-react

---

**Creado con elegancia para Espacio Sommelier** 🍷
