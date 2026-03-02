FROM node:20-alpine

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci

COPY frontend ./frontend
WORKDIR /app/frontend

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]

