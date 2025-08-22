FROM node:22-alpine AS base

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json frontend/pnpm-lock.yaml ./

RUN npm install --legacy-peer-deps

COPY ./frontend .

# --- Dev stage ---
FROM base AS dev
EXPOSE 3000
CMD ["npm", "run", "dev"]