# Usamos Node 20 porque Vite lo requiere
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos package.json y package-lock.json primero para aprovechar cache
COPY package*.json ./

# Instalamos todas las dependencias, incluidas devDependencies (donde está Vite)
# Usamos --legacy-peer-deps porque @testing-library/react requiere React 18
# pero el proyecto usa React 19 (que es compatible)
RUN npm install --include=dev --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Generamos el build optimizado
RUN npm run build

# -------------------------------
# Etapa final: servidor liviano
# -------------------------------
FROM node:20-alpine

WORKDIR /app

# Copiamos solo lo necesario del build
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package*.json ./

# Exponemos el puerto
EXPOSE 3000

# Servimos el build con Vite preview
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]

