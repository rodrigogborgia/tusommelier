#!/bin/bash

echo "🔧 Construyendo frontend..."
cd my-tavus-app
npm install
npm run build
cd ..

echo "🐳 Levantando servicios con Docker..."
docker-compose up --build -d
