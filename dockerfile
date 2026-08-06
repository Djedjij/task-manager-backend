FROM node:22-alpine

# Устанавливаем tini для корректного завершения процессов nodemon
RUN apk add --no-cache tini python3 make g++ openssl libc6-compat

WORKDIR /app

# Используем Tini как точку входа
ENTRYPOINT ["/sbin/tini", "--"]

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 5000

CMD ["npm", "run", "dev"]