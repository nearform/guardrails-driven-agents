FROM node:22-slim

WORKDIR /app

# Cached dependency layer: only manifests, so `npm ci` only reruns on lockfile changes.
COPY package.json package-lock.json ./
RUN npm ci

# Application source (dev: overridden by the bind-mount in docker-compose.yml).
COPY . .

EXPOSE 3000

# Dev server (the compose bind-mount provides the live source).
CMD ["npm", "run", "dev"]
