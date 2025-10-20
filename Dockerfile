# syntax=docker/dockerfile:1
FROM node:20-bookworm-slim

WORKDIR /app

# Install build tools in case native modules need compilation
RUN apt-get update && apt-get install -y --no-install-recommends \
	python3 make g++ \
	&& rm -rf /var/lib/apt/lists/*

# Ensure native addons build from source (avoid incompatible prebuilt binaries)
ENV npm_config_build_from_source=true

# Install deps
COPY package.json package-lock.json* ./
RUN npm ci --only=production || npm install --omit=dev \
	&& npm rebuild better-sqlite3 --build-from-source

# Copy source
COPY . .

ENV NODE_ENV=production
CMD ["node", "src/index.js"]
