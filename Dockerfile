# ==================================
# Backend Dockerfile (multi-stage)
# ==================================

# ---------- Stage 1: builder ----------
FROM node:20-slim AS builder

WORKDIR /app

# Install all dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# ---------- Stage 2: runner ----------
FROM node:20-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

# Install only production dependencies
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

# Copy built output from builder
COPY --from=builder /app/dist ./dist

# Copy Prisma schema and generated client
COPY --from=builder /app/prisma ./prisma

# Copy entrypoint script and make it executable
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

# Run as non-root user
USER node

CMD ["./docker-entrypoint.sh"]
