# ---- Builder Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# Install build-time dependencies
RUN apk add --no-cache python3 make g++

# Copy package files and install ALL dependencies
COPY package*.json ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the TypeScript project
RUN npm run build


# ---- Production Stage ----
FROM node:22-alpine

WORKDIR /app

# Install production-only system dependencies
RUN apk add --no-cache sqlite ffmpeg

# Create and switch to a non-root user
RUN addgroup -S --gid 1001 nodejs && adduser -S --uid 1001 bot -G nodejs
USER bot

# Copy package files and install ONLY production dependencies
COPY --chown=bot:nodejs package*.json ./
RUN npm ci --only=production

# Copy the built application from the builder stage
COPY --from=builder --chown=bot:nodejs /app/dist ./dist

# Create necessary directories (data and logs will be mounted as volumes)
RUN mkdir -p data logs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) }).on('error', () => process.exit(1))"

# Start the application
CMD ["node", "dist/index.js"]