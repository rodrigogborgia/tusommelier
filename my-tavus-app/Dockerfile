# Etapa de build
FROM node:20-alpine AS build

WORKDIR /app

# Copiamos package.json y package-lock.json primero para aprovechar cache
COPY package*.json ./

# Instalamos dependencias
RUN npm install --legacy-peer-deps

# Copiamos el resto del código
COPY . .

# Establecer variables de entorno para el build de producción
ENV VITE_BACKEND_URL=/api

# Generamos el build optimizado
RUN npm run build

# -------------------------------
# Etapa final: servidor Nginx
# -------------------------------
FROM nginx:alpine

# Eliminamos la configuración default de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el build generado
COPY --from=build /app/dist /usr/share/nginx/html

# Exponemos el puerto 80
EXPOSE 80

# Nginx arranca automáticamente con la imagen base
