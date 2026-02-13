# 📄 Project Context: ERP Pangan Masa Depan

## 🎯 Overview
**ERP Pangan Masa Depan** is an Enterprise Resource Planning system designed for grain/rice production management. It handles everything from raw material intake (Gabah), quality analysis using ML, production processing (Worksheets), to inventory management and financial tracking (Invoices/Payments).

## 🛠 Tech Stack
- **Languages**: TypeScript, SQL
- **Framework**: Express.js
- **ORM**: Prisma (Migrated from TypeORM)
- **Database**: PostgreSQL
- **Schema Design**: Custom DSL (`.naiv` files in `/design`) used for codegen of API types and DTOs.
- **Frontend**: React + Vite (located in `/frontend` - if present)

## 🏗 Architecture
The project follows a **Modified Layered Architecture**:
1.  **Transport Layer**: `index.ts` handles the server instance and routing via `@naiv/codegen-nodejs-typeorm`.
2.  **Presentation Layer (Handlers)**: Located in `/implementation`. Each file (e.g., `T_createEmployee.ts`) maps to an API endpoint defined in `/types/api`.
3.  **Service Layer**: Located in `src/services`. Contains complex business logic and coordination between repositories (e.g., `WorksheetService`).
4.  **Data Access Layer (Repositories)**: Located in `src/repositories`. Generic CRUD handled by `BaseRepository`, specific queries in entity-specific repositories (e.g., `StockRepository`).
5.  **ORM Layer**: Prisma (`/prisma/schema.prisma`).

## 🗝 Key Components
- **Auth**: JWT-based with dual-mode token extraction (Bearer header + httpOnly cookie). Handled in `utility/auth.ts`. All handlers call `requireAuth(req, role)` which checks both sources.
- **Auth (Frontend)**: Cookie-based via `withCredentials: true`. No localStorage token. Session checked via `/auth/me` on mount.
- **ML Integration**: `T_analyzeGrain.ts` communicates with an external ML service for `ML_SERVICE_URL`.
- **Inventory Logic**: Stocks and Movements are tracked closely. Every production worksheet triggers stock reductions of raw materials and increases in finished goods.

## 🛡 Operational Features
- **Health Check**: `GET /health` — direct Express route, bypasses NAIV pipeline
- **Rate Limiting**: Global 100 req/15min, auth endpoints 10 req/15min per IP
- **Request Logging**: Structured JSON to stdout (method, path, status, duration_ms, ip, timestamp)
- **CORS**: Configured with `credentials: true` for cookie auth. `FRONTEND_URL` env var controls origin.
- **Logout**: `POST /auth/logout` — direct Express route, clears httpOnly cookie

## 📁 Important Directories
- `/implementation`: The "Entry Points" for all API logic (72+ handlers).
- `/src/repositories`: Database interaction logic.
- `/src/services`: Core business logic.
- `/prisma`: Database schema and migrations.
- `/types`: Auto-generated types from design files.
- `/design`: DSL files defining the system structure.
- `/frontend`: React + Vite SPA.

## 🔧 Environment Variables
- `JWT_SECRET` — Required. Server refuses to start without it.
- `DATABASE_URL` — PostgreSQL connection string.
- `PORT` — Server port (default: 9415).
- `FRONTEND_URL` — CORS origin (default: `http://localhost:5173`).
- `NODE_ENV` — Set to `production` to enable secure cookies.
- `ML_SERVICE_URL` — External ML service for grain analysis.
