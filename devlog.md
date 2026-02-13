# 🪵 Development Log - ERP Pangan Masa Depan

## 🟢 Status: Phase 8 Complete — Cloud Deployment
**Date**: Feb 13, 2026
**Current Version**: 2.1.1

### ✅ Phase 8: Cloud Deployment — Railway & Vercel (Feb 13, 2026)
Successfully deployed the full stack online with high-availability configuration and cross-platform communication.

1. **Railway: Backend API** — Configured Nixpacks deployment. Resolved **Port Mismatch** (App on 8080, Railway Settings updated to match). Verified connectivity to Postgres and ML-Service.
2. **Railway: ML Service** — Configured `/ml-service` subdirectory to use **Docker Builder** (Python environment). Service is now healthy and processing grain images.
3. **Vercel: Frontend** — Deployed React/Vite app with dynamic `VITE_API_URL`.
4. **Environment Security** — `trust proxy` enabled in `index.ts`. Cookie security updated: `secure: true`, `sameSite: 'none'` in production to support Vercel → Railway cross-site authentication.
5. **Database Initialization** — Success with `prisma migrate deploy` and `npm run seed-admin` on the production database.

### ✅ Phase 7: Purchasing Module — Purchase Orders & Goods Receipts (Feb 13, 2026)
Full implementation of the procurement cycle for raw material (Gabah) and packaging (Product Types) inflow.

1. **Backend Repositories** — `purchase-order.repository.ts`, `goods-receipt.repository.ts` with full relations and stats.
2. **Purchase Order Logic** — Service-layer logic for PO lifecycle management: `DRAFT` → `APPROVED` → `RECEIVED` / `CANCELLED`.
3. **Goods Receipt Integration** — Creating a Goods Receipt automatically triggers `stockService.addStock()` (Stock Movement IN), ensuring inventory accuracy on receipt.
4. **11 NAIV API Endpoints** — PO CRUD (5), Approve/Cancel actions (2), Goods Receipt CRUD (4).
5. **Frontend UI** — New "Pembelian" sidebar section. Purchase Orders list with aggregate stats (Pending POs, Monthly Spend). PO Detail page with itemized receipts.

### ✅ Phase 6: Sales Module — Invoices, Customers & Payments (Feb 13, 2026)
Full implementation of the sales module that was removed in v1.2.0. Enables finished goods stock outflow via invoicing.

1. **Backend Repositories** — `customer.repository.ts`, `invoice.repository.ts` (with full relation includes + stats), `payment.repository.ts`
2. **Invoice Service** — Business logic for create/update/delete invoices with automatic stock deduction via `stockService.removeStock()`. Stock reversal on delete. Auto-status updates (DRAFT → PARTIAL → PAID) based on payment totals.
3. **15 NAIV API Endpoints** — Customer CRUD (5), Invoice CRUD + items (7), Payment CRD (3). All with proper auth levels (OPERATOR read, SUPERVISOR write, ADMIN delete).
4. **Frontend: Customers Page** — List with search/filter, stats grid, CRUD modal
5. **Frontend: Invoices Page** — List with stats (revenue/outstanding), create modal with dynamic item rows, currency formatting
6. **Frontend: Invoice Detail Page** — Full detail view with items table, payment progress bar, add/delete payments, edit invoice modal
7. **Sidebar & Routes** — "Penjualan" section with Pelanggan and Invoice links

Stock integration flow: Create Invoice → stock OUT per item. Delete Invoice → stock IN reversal. Payment auto-updates invoice status.

### ✅ Phase 5: ML Service Rewrite — Multi-Color Grain Quality Analysis (Feb 13, 2026)
Full rewrite of `ml-service/` from a minimal 3-file green-only detector to a production-grade multi-color analysis engine:

1. **Multi-Color Detection** — Now detects green, yellow, red, chalky, and normal grain pixels using priority-based HSV segmentation (no double-counting)
2. **Configurable Calibration** — HSV ranges for all 5 color categories stored in-memory, adjustable via `PUT /calibration` at runtime
3. **Configurable Grading** — 6-tier grading rules (KW1 L1-L3, KW2 L1-L2, KW3 L1) adjustable via `PUT /calibration/grading`
4. **Proper FastAPI Structure** — Reorganized into `routers/`, `models/`, `services/` with Pydantic models and pydantic-settings
5. **New Endpoint: `POST /analyze-detailed`** — Returns full `ColorBreakdown` (all 5 colors), calibration profile used, grading rules used, and processing time. Supports per-request calibration/grading overrides.
6. **Backward Compatibility** — `POST /analyze-base64` keeps identical response shape (`green_percentage`, `grade`, `status`, `level`, `supplier`, `lot`). New color fields added as optional — `T_analyzeGrain.ts` and `QCGabah.tsx` unaffected.

Old files deleted: `features.py`, `predict.py`. Dependency added: `pydantic-settings`. See `docs/ml-service.md` for full technical documentation.

### ✅ Phase 4: Operational Maturity (Feb 13, 2026)
Completed 6 tasks adding production-readiness features, including a critical fix for NAIV framework compatibility:

1. **Health Check** — `GET /health` endpoint (bypasses NAIV, direct Express route)
2. **Rate Limiting** — Global 100 req/15min, auth endpoints 10 req/15min (brute-force protection)
3. **Request Logging** — Structured JSON logs per request (method, path, status, duration, IP, timestamp)
4. **httpOnly Cookie Auth (Backend)** — Dual-mode: accepts both Bearer header AND httpOnly cookie
   - **CRITICAL FIX**: NAIV filters the `req` object by default, stripping `headers` and `cookies` before they reach handlers.
   - **Solution**: Patched `apiWrapper.ts` to enrich the filtered `req` object from the raw Express request (`res.req`).
   - **Solution**: Added middleware in `index.ts` to map `token` cookie back to `Authorization` header for internal component compatibility.
   - `extractToken(req)` and `requireAuth(req, role)` now correctly see all auth sources.
   - Login/Register set httpOnly cookie (`secure` in prod, `sameSite: lax`, 24h expiry)
   - `POST /auth/logout` clears cookie
   - Bulk updated 72 handler files: `requireAuth(req.headers.authorization, ...)` → `requireAuth(req, ...)`
5. **httpOnly Cookie Auth (Frontend)** — Migrated from localStorage to cookie-based auth
   - `withCredentials: true` on axios, removed localStorage token management
   - Session check via `/auth/me` on mount, logout via `/auth/logout`
6. **CORS with Credentials** — `noCors: true` on NAIV Server + manual `cors({ origin, credentials: true })`

Dependencies added: `express-rate-limit`, `cookie-parser`, `@types/cookie-parser`, `@types/cors`

### ✅ Phase 3: Frontend Improvements (Feb 12, 2026)
Toast notifications, global error handling with `apiWrapper`, UI polish.

### ✅ Phase 2: Data Integrity (Feb 12, 2026)
Input validation, standardized error handling, `apiWrapper` pattern.

### ✅ Phase 1: Security Hardening (Feb 12, 2026)
JWT_SECRET enforcement (no fallback), bcrypt password hashing, role-based auth with hierarchy.

---

### ✅ Major Refactor Complete: TypeORM to Prisma
We have successfully migrated the entire data layer from TypeORM to Prisma. This was a massive effort involving:
1.  **Repository Rewrite**: All repositories migrated to a new `BaseRepository` using Prisma Client.
    - *Migration Update (12 Feb 2026)*: `npx prisma migrate dev --name init_schema` executed successfully. Database is synced.
2.  **Handler Refactor**: Over 50 handlers in `/implementation` updated to use Prisma repositories instead of Direct TypeORM Entity Managers.
3.  **Transaction Handling**: Complex business operations (like `T_deleteStockMovement` and `WorksheetService`) now use Prisma's `$transaction` API.
4.  **Type Safety Fixes**: Resolved significant issues with enum imports and model usage where TypeORM classes were previously used as values.

### 🚩 Known Issues & Technical Debt
- **IDE Linting**: Some fake "Object literal may only specify known properties" errors might appear in `dummy.service.ts` due to background linter lag. `npm run build` is the source of truth and it currently passes.
- **ML Service**: Rewritten to v2.0.0 with multi-color support. In-memory calibration resets on restart (no persistence yet).

### 🚀 Recent Changes
- Completed **Cloud Deployment** to Railway (Backend/ML) and Vercel (Frontend).
- Refined `package.json` scripts (`build`, `prebuild`, `postinstall`) for cloud compatibility.
- Fixed **ML Service** build by isolating it into a Docker-based subfolder deployment on Railway.
- Implemented **Purchasing Module** (PO & Goods Receipt) with full stock integration.

### 🛠 Active Workstream
- **Production Testing**: Verifying cross-domain cookie authentication and session persistence on Vercel/Railway.
- **Reporting Extension**: Planning for COGM (Cost of Goods Manufactured) report implementation.
- **Optimization**: Monitoring Railway resource usage (Memory/CPU) for the ML Service.

---
*Note for future AI Agents: Always check `src/repositories/base.repository.ts` before modifying any data access logic.*
