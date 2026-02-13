# 🏠 Local Setup Guide - ERP Pangan Masa Depan

## Tech Stack
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Tools**: `ts-node`, `prisma-client`

---

## 1. Prerequisites
- Docker (Recommended for Database)
- Node.js >= 18.0.0
- npm

## 2. Database Setup
The easiest way is using Docker:
```bash
docker run --name erp-db -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres
```

## 3. Environment Configuration
Copy `.env.example` to `.env` and adjust the `DATABASE_URL`:
```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/postgres?schema=public"
JWT_SECRET="your-local-secret"
```

## 4. Initialization
```bash
# Install dependencies
npm install

# Push schema to database
npx prisma db push

# Generate Prisma Client
npx prisma generate
```

## 5. Running the Application
```bash
# Development mode (Auto-build & Start)
npm run dev

# Production build & Start
npm run build
npm start
```

## 6. Development Tools
- **Prisma Studio**: `npm run prisma:studio` (GUI for database)
- **Dummy Data**: POST `/seed-data` to generate initial records
- **Superuser**: POST `/seed-superuser` with `secretKey` to create first admin
