# Specialized Scraper Dockerfile (High Performance)
FROM node:20-slim

# Install Chrome dependencies for Puppeteer
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-ipafont-gothic \
    fonts-wqy-zenhei \
    fonts-thai-tlwg \
    fonts-kacst \
    fonts-freefont-ttf \
    libxss1 \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer environment variables
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Set ownership to node user
COPY --chown=node:node package*.json ./
RUN npm install --production

COPY --chown=node:node . .

# Create storage directory with correct permissions
RUN mkdir -p storage/downloads && chown -R node:node storage

# Run as non-root user
USER node

EXPOSE 3939
CMD ["node", "server/index.js"]
