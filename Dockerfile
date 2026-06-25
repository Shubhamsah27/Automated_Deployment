# Stage 1: Install dependencies
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Runtime image (minimal)
FROM node:20-alpine AS runtime
WORKDIR /app

# Switch to the non-root 'node' user provided by the node:20-alpine image
USER node

# Copy dependencies and application files with correct ownership
COPY --chown=node:node --from=builder /app/node_modules ./node_modules
COPY --chown=node:node . .

ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", "src/index.js"]
