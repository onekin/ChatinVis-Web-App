FROM node:20-alpine

WORKDIR /app

# Copiar solo manifests primero (cache de layers)
COPY package.json package-lock.json ./

# Instalar dependencias (incluyendo nodemon en devDeps)
RUN npm ci

# El codigo fuente se monta como volumen en dev,
# no se copia aqui — permite hot reload
EXPOSE 3001

CMD ["npm", "run", "dev"]
