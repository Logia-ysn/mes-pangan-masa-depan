# ============================================================
# MES Pangan Masa Depan — Backend Dockerfile (Multi-stage)
# ============================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl python3 make g++

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY tsconfig.json ./
COPY index.ts ./
COPY src/ ./src/
COPY implementation/ ./implementation/
COPY types/ ./types/
COPY json/ ./json/
COPY utility/ ./utility/

RUN npx prisma generate
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl curl \
    && addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy built artifacts from builder
COPY --from=builder /app/dist/ ./dist/
COPY --from=builder /app/node_modules/ ./node_modules/
COPY --from=builder /app/prisma/ ./prisma/
COPY --from=builder /app/package.json ./
COPY --from=builder /app/json/ ./json/

# Re-generate Prisma client for runtime (same Alpine, but ensures consistency)
RUN npx prisma generate

# Create directories for uploads and backups
RUN mkdir -p /app/uploads /app/backups \
    && chown -R appuser:appgroup /app

USER appuser

EXPOSE 3000

CMD ["npm", "start"]
