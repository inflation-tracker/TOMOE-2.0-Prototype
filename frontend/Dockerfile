FROM node:20-alpine AS base

WORKDIR /app
COPY package*.json ./
# npm install (bukan ci) agar dep optional platform-Linux (mis. @emnapi/*) di-resolve
# di sini — lock file dibuat di macOS sehingga npm ci strict gagal lintas-platform.
RUN npm install

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
