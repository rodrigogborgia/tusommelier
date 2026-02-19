# ✅ Checklist de Implementación

## 🎯 Objetivo: Integrar Componentes Sommelier en tu frontend

---

## Fase 1: Verificación (5 min)

- [ ] Revisar archivos creados en `/src/components/sommelier-layout/`
- [ ] Confirmar que los imports se resuelven correctamente
- [ ] Verificar que TypeScript no marque errores

```bash
# En VS Code, revisa la pestaña "Problems"
# Debería estar vacía
```

---

## Fase 2: Integración Rápida (10-15 min) 

### Opción A: Usar Componente de Ejemplo

- [ ] Abrir `/src/components/sommelier-layout/EXAMPLES.tsx`
- [ ] Copiar el ejemplo que mejor se adapte a tu caso
- [ ] Importarlo en tu archivo principal
- [ ] Pasar los props necesarios

```tsx
// Ejemplo rápido:
import { ExampleAvatarInterface } from '@/components/sommelier-layout';

<ExampleAvatarInterface
  videoElement={<YourVideoComponent />}
  onMicClick={handleMic}
  onCameraClick={handleCamera}
  onEndCall={handleEnd}
/>
```

### Opción B: Integración Personalizada

- [ ] Abrir tu componente `Conversation` actual
- [ ] Importar `AvatarLayout` y `ControlButton`
- [ ] Reemplazar estructura actual manteniendo lógica
- [ ] Probar que funciona

```tsx
import { AvatarLayout, ControlButton } from '@/components/sommelier-layout';

// Tu código existente aquí
// Solo cambiar el JSX del return
```

---

## Fase 3: Testing Básico (10 min)

### En Desktop
- [ ] Abrir app en navegador
- [ ] Verificar que avatar se ve centrado
- [ ] Verificar que controles están abajo
- [ ] Hacer clic en botones
- [ ] Verificar que colores son correctos

### En Mobile (375px)
- [ ] Abrir DevTools (F12)
- [ ] Viewport 390x844 (iPhone)
- [ ] Verificar que avatar se ve bien
- [ ] Verificar que botones tienen solo iconos
- [ ] Probar que es clickeable

### En Tablet (768px)
- [ ] Viewport 768x1024 (iPad)
- [ ] Verificar proporciones de video
- [ ] Verificar controles centrados

### En Landscape (<600px alto)
- [ ] Rotate device simulator
- [ ] Verificar que no se corta contenido
- [ ] Verificar que controles accesibles

---

## Fase 4: Personalización (15-30 min)

### Cambiar Colores
- [ ] Abrir `avatar-layout.module.css`
- [ ] Ir a `:root {}`
- [ ] Cambiar valores hex según necesites
- [ ] Probar cambios en navegador

```css
:root {
  --color-primary-dark: #6b0f1a;    /* ← Cambiar aquí */
  --color-accent-gold: #c69c6d;     /* ← O aquí */
}
```

### Cambiar Header
- [ ] Modificar `headerContent` en AvatarLayout
- [ ] Usar `SommelierColors` para consistencia

```tsx
<AvatarLayout
  headerContent={
    <div style={{ color: SommelierColors.primaryDark }}>
      Mi Titulo
    </div>
  }
/>
```

### Agregar Más Botones
- [ ] Copiar un `<ControlButton />` existente
- [ ] Cambiar `icon`, `label`, `onClick`
- [ ] Probar que funcione

```tsx
<ControlButton
  icon="⚙️"
  label="Settings"
  onClick={handleSettings}
  title="Open settings"
/>
```

### Cambiar Aspecto de Video
- [ ] En `avatar-layout.module.css`
- [ ] Buscar `.mainContent > *`
- [ ] Cambiar `aspect-ratio: 9/16;` a lo que necesites

```css
.mainContent > * {
  aspect-ratio: 1/1;   /* Cambiar a cuadrado */
  /* O: 16/9 para panorámico */
}
```

---

## Fase 5: Validación (10 min)

### Funcionalidad
- [ ] Todos los botones funcionan
- [ ] El avatar se ve centrado
- [ ] Los controles responden a clicks
- [ ] Transiciones son suaves

### Responsividad
- [ ] Desktop (1920px): video horizont grande
- [ ] Tablet (768px): video horizontal mediano
- [ ] Mobile (390px): video cuadrado
- [ ] Landscape: contenido no cortado

### Estética
- [ ] Colores coinciden con Espacio Sommelier
- [ ] Tipografía es consistente
- [ ] Sombras y bordes se ven bien
- [ ] Animaciones no son jarring

### Performance
- [ ] No hay re-renders excesivos (revisar React DevTools)
- [ ] Animaciones fluidas (60fps)
- [ ] Carga rápida (< 1s)
- [ ] Sin warnings en consola

```bash
# En DevTools Console, verifícalo:
# No debe haber errores rojos
# Solo warnings si existen
```

---

## Fase 6: Documentación (5 min)

- [ ] Leer [README.md](./src/components/sommelier-layout/README.md)
- [ ] Guardar [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) como referencia
- [ ] Revisar [EXAMPLES.tsx](./src/components/sommelier-layout/EXAMPLES.tsx) si necesitas ayuda
- [ ] Bookmark [SOMMELIER_COMPONENTS_SUMMARY.md](./SOMMELIER_COMPONENTS_SUMMARY.md)

---

## Fase 7: Optimización (Opcional - 15-30 min)

### Si necesitas más personalización:

- [ ] Cambiar animaciones de entrada
- [ ] Ajustar velocidades de transición
- [ ] Modificar sombras y bordes
- [ ] Cambiar tipografía (si no quieres Antonio)
- [ ] Agregar más interactividad

### Si necesitas Styled Components:

- [ ] Instalar: `npm install styled-components`
- [ ] Copiar contenido de `sommelier-styled-components.example.ts`
- [ ] Renombrar a `sommelier-styled.ts`
- [ ] Usar en lugar de CSS Modules

---

## Fase 8: Deploy (5 min)

### Antes de hacer push:

- [ ] Probar localmente: `npm run dev`
- [ ] Probar build: `npm run build`
- [ ] Revisar que no hay errores de TypeScript: `npx tsc --noEmit`
- [ ] Probar en staging si existe

```bash
# Comandos útiles:
npm run dev          # Desarrollo local
npm run build        # Build producción
npm run preview      # Preview del build
npm run lint         # Revisar código
```

### Checklist final:

- [ ] No hay archivos sin guardar
- [ ] Imports están correctos
- [ ] No hay `console.log` de debug
- [ ] Estilos se ven bien en todos los dispositivos
- [ ] No hay warnings en consola

---

## 🎁 Bonificación: Post-Implementación

### Después de integrar, considera:

- [ ] **Agregar iconos profesionales** en lugar de emojis
  - Usar librería: `react-icons`, `lucide-react`, o `heroicons`

- [ ] **Mejorar animaciones**
  - Usar `framer-motion` para animaciones más complejas

- [ ] **Testing**
  - Crear tests con `React Testing Library`
  - Usar `Playwright` para e2e

- [ ] **Analytics**
  - Tracking de clicks de botones
  - Tiempo de sesión
  - Dispositivo/navegador

- [ ] **Dark Mode** (si lo necesitas)
  - Crear tema alternativo
  - Agregar toggle en header

- [ ] **i18n** (si es multi-idioma)
  - Extraer strings a `i18n.json`
  - Usar `react-i18next` o similar

---

## 🆘 Troubleshooting Rápido

**P: El avatar no se centra**
```
R: Verifica que MainVideo devuelve un elemento directo
   No debe haber divs extra alrededor del video
```

**P: Los botones se ven muy pequeños/grandes en móvil**
```
R: Edita control-button.module.css @media (max-width: 480px)
   Cambia padding y font-size según necesites
```

**P: Los colores no son exactos**
```
R: Verifica los valores hex en avatar-layout.module.css :root
   Usa el eyedropper en DevTools para confirmar colores exactos
```

**P: Las animaciones se ven laggy**
```
R: Verifica que GPU acceleration esté habilitado
   Usa: transform: translateY() en lugar de top/bottom
```

**P: El layout se rompe en landscape**
```
R: Revisa el @media (max-height: 600px) en CSS
   Reduce padding y márgenes allí
```

---

## 📞 Recursos de Ayuda

| Recurso | Ubicación |
|---------|-----------|
| Documentación API | [README.md](./src/components/sommelier-layout/README.md) |
| Guía de integración | [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) |
| Ejemplos de código | [EXAMPLES.tsx](./src/components/sommelier-layout/EXAMPLES.tsx) |
| Resumen del proyecto | [SOMMELIER_COMPONENTS_SUMMARY.md](./SOMMELIER_COMPONENTS_SUMMARY.md) |
| Este checklist | [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md) |

---

## ✨ Próximos Pasos Recomendados

1. **Hoy**: Completar Fases 1-3 (~30 min)
2. **Mañana**: Completar Fases 4-5 (personalización)
3. **Esta semana**: Fase 6+ (optimización y refinamiento)
4. **Próxima semana**: Deploy a producción

---

## 🎯 Resumen Rápido

```
✅ Archivos creados: 9
✅ Componentes listos: 2 + 1 ejemplo
✅ Ejemplos de uso: 7
✅ Documentación: Completa
✅ Tiempo total estimado: 60 min

👉 ¡Comienza con Fase 1!
```

---

## 📝 Notas Personales

Espacio para tus notas mientras implementas:

```
Cambios realizados:
- [ ] ___________________
- [ ] ___________________
- [ ] ___________________

Issues encontrados:
- [ ] ___________________
- [ ] ___________________

Personalización hecha:
- [ ] ___________________
- [ ] ___________________
```

---

**¡Mucho éxito con la integración!** 🍷✨

Para preguntas, revisa la documentación o los ejemplos.
