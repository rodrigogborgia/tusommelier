# 🎨 Guía de Integración - Sommelier Avatar UI

Esta guía te mostrará cómo integrar los nuevos componentes con estética Espacio Sommelier en tu aplicación existente.

## 📍 Estructura de Archivos Creados

```
src/components/sommelier-layout/
├── AvatarLayout.tsx                          # Componente contenedor
├── avatar-layout.module.css                  # Estilos del layout
├── ControlButton.tsx                         # Botón de control
├── control-button.module.css                 # Estilos del botón
├── ExampleAvatarInterface.tsx                # Ejemplo completo
├── example.module.css                        # Estilos del ejemplo
├── index.ts                                  # Exportes públicos
├── sommelier-styled-components.example.ts   # Alternativa con Styled Components
└── README.md                                 # Documentación
```

## 🚀 Opción 1: Integración Rápida (Recomendado)

### Paso 1: Actualizar el componente `Conversation`

Abre [src/components/cvi/components/conversation/index.tsx](../cvi/components/conversation/index.tsx):

```tsx
// Agregar imports al inicio del archivo
import { AvatarLayout, ControlButton } from '../../../sommelier-layout';

// En el componente Conversation, reemplazar el return:
return (
  <AvatarLayout
    headerContent={
      <div style={{ color: '#6B0F1A', fontSize: '1.5rem', fontWeight: 700 }}>
        ✨ Espacio Sommelier - Avatar Digital
      </div>
    }
    avatarContent={
      <div className={styles.videoContainerWrapper}>
        <MainVideo />
        <PreviewVideos />
      </div>
    }
    controls={
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <ControlButton
          icon="🎤"
          label="Micrófono"
          isActive={micState.isOff === false}
          onClick={handleMicClick}
          title="Activar/Desactivar micrófono"
        />
        
        <ControlButton
          icon="📹"
          label="Cámara"
          isActive={cameraState.isOff === false}
          onClick={handleCameraClick}
          title="Activar/Desactivar cámara"
        />
        
        <ControlButton
          icon="📺"
          label="Pantalla"
          isActive={isScreenSharing}
          onClick={toggleScreenShare}
          title="Compartir pantalla"
        />
        
        <ControlButton
          icon="💾"
          label="Guardar"
          onClick={handleSaveContext}
          title="Guardar contexto de conversación"
        />
        
        <ControlButton
          icon="📞"
          label="Salir"
          onClick={handleLeave}
          title="Terminar llamada"
        />
      </div>
    }
  />
);
```

### Paso 2: (Opcional) Actualizar estilos globales

Reemplaza el contenido de [src/App.css](../App.css):

```css
/* Estilos globales aplicando paleta Sommelier */
:root {
  --color-primary-dark: #6B0F1A;
  --color-accent-gold: #C69C6D;
  --color-bg-main: #FAF3E0;
  --color-text-dark: #3D2817;
  --color-white: #FFFFFF;
}

body {
  font-family: 'Antonio', 'Segoe UI', sans-serif;
  background-color: var(--color-bg-main);
  color: var(--color-text-dark);
  margin: 0;
  padding: 0;
  -webkit-font-smoothing: antialiased;
}

/* Importar fuente Antonio */
@import url('https://fonts.googleapis.com/css2?family=Antonio:wght@400;700&display=swap');

#root {
  width: 100%;
  height: 100vh;
  margin: 0;
  padding: 0;
}
```

## 🎯 Opción 2: Integración Avanzada (Styled Components)

Si prefieres **Styled Components** sobre CSS Modules:

### Paso 1: Instalar dependencias
```bash
npm install styled-components
npm install -D @types/styled-components
```

### Paso 2: Crear archivo de componentes estilizados

Copia el contenido de [sommelier-styled-components.example.ts](./sommelier-styled-components.example.ts) 
y renómbralo a `sommelier-styled.ts`.

Luego úsalo en tu componente:

```tsx
import {
  StyledContainer,
  AvatarContainer,
  ControlBar,
  ButtonsContainer,
  StyledButton,
} from './sommelier-styled';

export const Conversation = () => {
  return (
    <StyledContainer>
      <AvatarContainer>
        <MainVideo />
      </AvatarContainer>
      
      <ControlBar>
        <ButtonsContainer>
          {/* Tus botones aquí */}
        </ButtonsContainer>
      </ControlBar>
    </StyledContainer>
  );
};
```

## 🔧 Personalización Común

### 1. Cambiar Colores

En cualquier archivo, importa la paleta:

```tsx
import { SommelierColors } from '@/components/sommelier-layout';

const myStyle = {
  backgroundColor: SommelierColors.accentGold,
  color: SommelierColors.textDark,
};
```

### 2. Agregar Más Botones

```tsx
<ControlButton
  icon="⚙️"
  label="Configuración"
  onClick={() => openSettings()}
  title="Abrir configuración"
/>
```

### 3. Cambiar Header

```tsx
<AvatarLayout
  headerContent={
    <div style={{
      fontSize: '2rem',
      color: '#6B0F1A',
      fontWeight: 'bold',
      textTransform: 'uppercase',
      letterSpacing: '2px'
    }}>
      🍷 Mi Sommelier Personalizado
    </div>
  }
  // ...resto de props
/>
```

### 4. Modificar Proporción de Video

En `avatar-layout.module.css`, busca `.mainContent > *`:

```css
/* Cambiar de 9/16 a 1/1 (cuadrado) */
.mainContent > * {
  aspect-ratio: 1/1;  /* Era: 9/16 */
}

/* O a 16/9 (panorámico) */
.mainContent > * {
  aspect-ratio: 16/9;  /* Era: 9/16 */
}
```

## 📱 Pruebas Responsive

Prueba tu interfaz en diferentes tamaños:

```bash
# En Chrome DevTools:
# 1. Desktop: 1920x1080 → Aspectratio 16:9
# 2. iPad: 768x1024 → Aspectratio 16:9  
# 3. iPhone 12: 390x844 → Aspectratio 1:1
# 4. Landscape pequeño: 800x500 → Ajustes especiales
```

## 🎬 Animaciones Personalizadas

Si quieres personalizar las animaciones, edita `avatar-layout.module.css`:

```css
/* Cambiar velocidad de entrada */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);  /* Cambiar distancia */
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Aplicar a mainContent */
.mainContent {
  animation: fadeInUp 0.6s ease-out 0.2s both;  /* 0.6s = duración */
}
```

## 🐛 Solución de Problemas

### El avatar no se centra correctamente

**Solución**: Asegúrate de que `MainVideo` devuelva solo el elemento de video sin divs extra.

```tsx
// ❌ INCORRECTO
const MainVideo = () => (
  <div>
    <div><DailyVideo /></div>
  </div>
);

// ✅ CORRECTO
const MainVideo = () => (
  <DailyVideo sessionId={replicaId} type="video" />
);
```

### Los controles se ven muy pequeños en móvil

**Solución**: Reduce el padding en `control-button.module.css` para pantallas pequeñas:

```css
@media (max-width: 480px) {
  .button {
    padding: 0.5rem 0.8rem;  /* Aumentar de 0.6rem 0.6rem */
    font-size: 0.8rem;        /* Reducir de 0.85rem */
  }
}
```

### El fondo no tiene el gradiente correcto

**Solución**: Verifica que la paleta de colores esté correcta en `avatar-layout.module.css`:

```css
:root {
  --color-bg-main: #faf3e0;      /* Beige principal */
  --color-bg-secondary: #f5ead6; /* Beige secundario */
}
```

## 📊 Comparación: Antes vs Después

| Aspecto | Antes | Después |
|---------|-------|---------|
| Layout | Flexible | Avatar centrado |
| Controles | Dispersos | Barra horizontal |
| Colores | Genéricos | Espacio Sommelier |
| Tipografía | Standar | Antonio elegante |
| Animaciones | Ninguna | Entrada suave |
| Responsive | Básico | Optimizado |

## 📖 Próximos Pasos

1. **Integra** uno de los componentes usando la opción que prefieras
2. **Personaliza** colores y textos según necesites
3. **Prueba** en todos los dispositivos
4. **Optimiza** performance si es necesario

## 🆘 ¿Necesitas Ayuda?

- Revisa [README.md](./README.md) para documentación completa
- Consulta [ExampleAvatarInterface.tsx](./ExampleAvatarInterface.tsx) para ejemplo funcional
- Verifica [avatar-layout.module.css](./avatar-layout.module.css) para estilos disponibles

---

**¡Tu avatar digital ahora tiene la elegancia de Espacio Sommelier!** 🍷✨
