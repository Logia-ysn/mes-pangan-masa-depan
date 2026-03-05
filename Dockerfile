FROM node:18-alpine

WORKDIR /app

# Install openssl (required for Prisma on Alpine)
RUN apk add --no-cache openssl docker-cli

# Copy package files
COPY package*.json ./

# Copy Prisma schema
COPY prisma ./prisma

# Install dependencies (this will also run prisma generate via postinstall)
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript code
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
