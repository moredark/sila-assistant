FROM node:22-alpine

WORKDIR /app

# Install all system dependencies needed for build and runtime
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite \
    ffmpeg

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]