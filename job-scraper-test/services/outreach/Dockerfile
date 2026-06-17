# Lightweight Microservice Dockerfile
FROM node:20-slim

WORKDIR /app

COPY --chown=node:node package*.json ./
RUN npm install --production

COPY --chown=node:node . .

# Run as non-root user
USER node

EXPOSE 8881
CMD ["node", "index.js"]
