# ==================================
# Backend Dockerfile
# ==================================
FROM node:20

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install

# Copy source
COPY . .

# Make entrypoint executable
RUN chmod +x docker-entrypoint.sh

# Build step
RUN npm run build

# Expose port
EXPOSE 3000

# Run with entrypoint script
CMD ["./docker-entrypoint.sh"]
