# Root Dockerfile for CertifyFlow Server Deployment on Render
FROM node:20-slim

# Install system dependencies for Puppeteer (Chromium) and Prisma (OpenSSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-freefont-ttf \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PORT=4000

WORKDIR /app

# Copy root & server package definitions
COPY package*.json ./
COPY server/package*.json ./server/
COPY server/prisma ./server/prisma/

# Install dependencies (including devDependencies required for compilation)
RUN cd server && npm install --include=dev

# Copy server code
COPY server ./server

WORKDIR /app/server

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Remove devDependencies after build
RUN npm prune --omit=dev

# Set NODE_ENV to production for container runtime
ENV NODE_ENV=production

# Create storage directory for uploads
RUN mkdir -p storage/logos storage/signatures storage/certificates

EXPOSE 4000

# Run pending database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
