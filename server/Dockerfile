# imagen de Node.js como base
FROM node:latest

# Establece el directorio de trabajo en /app
WORKDIR /app

# Copia el archivo package.json y package-lock.json (o solo package.json si no hay lockfile)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto del código fuente al directorio de trabajo
COPY . .

# Expone el puerto 3005
EXPOSE 3005

# Comando para ejecutar la aplicación
CMD ["npm", "start"]
