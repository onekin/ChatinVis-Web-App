FROM node:20-alpine

WORKDIR /app

# Copiar solo manifests primero
COPY package.json ./

# Instalar dependencias
RUN npm install

# El codigo fuente se monta como volumen
EXPOSE 3000

CMD ["npm", "run", "dev"]