FROM node:20-alpine

WORKDIR /app

# Copiar solo manifests primero
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm ci

# El codigo fuente se monta como volumen
EXPOSE 3000

CMD ["npm", "run", "dev"]