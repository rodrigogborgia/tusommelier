# Frontend API Configuration

## Comportamiento esperado

La app frontend usa esta lógica para backend:

- Producción (`https://tusommeliervirtual.com`): `"/api"`
- Desarrollo local: `"http://localhost:8000"`

Si existe `VITE_BACKEND_URL` y es `http://...` mientras la página está en HTTPS, el frontend fuerza `"/api"` para evitar mixed content.

## Verificación rápida

En browser (Network), el request debe verse como:

- `https://tusommeliervirtual.com/api/conversation`

No debe aparecer:

- `http://backend:8000/conversation`

## Archivo fuente

- `my-tavus-app/src/App.tsx`
