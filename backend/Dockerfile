FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built files (we'll build before deploying)
COPY dist ./dist

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "dist/server.js"]