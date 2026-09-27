# CertifyFlow Backend Dockerfile for Render / Docker deployment
FROM node:20-slim

# Install system dependencies required for Puppeteer (Chromium) & Prisma (OpenSSL)
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

# Point Puppeteer to system Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV NODE_ENV=production
ENV PORT=4000

WORKDIR /app

# Copy package dependencies
COPY package*.json ./

# Install packages
RUN npm install

# Copy configuration and source files
COPY tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma Client & compile TypeScript
RUN npx prisma generate
RUN npm run build

# Create storage directory for uploads/certificates
RUN mkdir -p storage/logos storage/signatures storage/certificates

EXPOSE 4000

# Run pending database migrations and start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
