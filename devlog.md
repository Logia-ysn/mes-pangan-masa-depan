# 🪵 Development Log - ERP Pangan Masa Depan

## 🟢 Status: Phase 12 Complete — User Management System
**Date**: Feb 13, 2026
**Current Version**: 2.3.1

### ✅ Phase 12: User Management System (Feb 13, 2026)
Implemented complete administrative control over user accounts and access levels.

1.  **Admin User Management UI** — Created a dedicated `/admin/users` page for user CRUD with statistics and search/filter.
2.  **Password Management** — Added Admin override for user passwords (reset password functionality).
3.  **Role-Based UI Integration** — Secured the Sidebar and App routes specifically for ADMIN and SUPERUSER roles.
4.  **Service Expansion** — Enhanced `UserService` to handle factory assignment and specialized creation by administrators.
5.  **Data Integrity** — Implemented soft-delete (is_active toggle) for users to prevent orphan data in historical records.

### ✅ Phase 11: Mobile Responsiveness & Modern UI (Feb 13, 2026)
Full overhaul of the user interface to ensure the ERP is fully accessible and pleasant to use on mobile devices.

1.  **Responsive Grid System** — Added helper classes in `index.css` (`.grid-4`, `.grid-3`, etc.) that automatically collapse to a single column on mobile, replacing fixed-width grid definitions.
2.  **Smart Table Management** — Implemented `.hide-mobile` utility to declutter tables in Invoices, Customers, Worksheets, POs, and Stocks by hiding less critical columns on small screens.
3.  **Mobile Navigation (Drawer)** — Refined the sidebar to act as a smooth-sliding drawer on mobile with a proper backdrop overlay.
4.  **Touch UX & Bottom Sheets** — Converted all standard modals to "Bottom Sheets" on mobile. Increased padding and touch target sizes for better ergonomics.
5.  **Module Refinement** — Manually optimized high-density forms (Raw Material Receipt, QC Gabah, Worksheet Detail) to maintain professional look and usability on smartphone viewports.
6.  **Progress Tracking** — Advanced the Mobile/PWA workstream to 80% completion (Core CSS & Layout done).

### ✅ Phase 10: Production Stability & Integrity (Feb 13, 2026)
Final pass for version 2.2.1, ensuring 100% stable production environment and bulletproof data integrity.

1.  **Vercel Configuration** — Automated "mode cepat" deployment:
    - Root Directory set to `frontend`.
    - Framework preset **Vite** enforced.
    - Build settings optimized for Git push deployment.
    - Synchronized `VITE_API_URL` environment variables with railway `-7abe` suffix.
2.  **Stock Integrity (Worksheet)** — Refactored `deleteWorksheet` in `worksheet.service.ts` to perform full **Stock Reversal**. Deleting a production log now correctly restores input raw materials and removes output finished goods from inventory.
3.  **Stock Integrity (Invoice)** — Added `cancelInvoice` logic to `invoice.service.ts`. Changing an invoice status to `CANCELLED` now automatically reverses stock deductions, returning goods to inventory.
4.  **Audit Trail (Manual Update)** — Patched `T_updateStock.ts` to always use `StockService`. Manual stock adjustments now create `StockMovement` entries with `ADJUSTMENT` type, ensuring a transparent audit log of quantities and users.
6.  **Production Performance** — Mengatasi error "Too many requests" dengan meningkatkan batas *Rate Limiting* (Global: 1000, Auth: 50).
7.  **Database Migration (Railway)** — Sinkronisasi skema database produksi melalui `npx prisma migrate deploy` untuk menghapus error table missing.
8.  **Backup & Versioning** — Eksekusi full folder backup dan pembaruan tag `v2.2.1`.

### ✅ Phase 9: Operational Excellence — Reports, Notifications & Excel Export (Feb 13, 2026)
Full implementation of Prioritas 2: integrated report pages, notification system, and Excel export capabilities.

1. **Report Backend** — Implemented 3 missing API endpoints:
   - `T_getSalesSummary` — query invoices by date range + factory, aggregate totals, group by customer
   - `T_getCOGMReport` — query worksheets, aggregate production costs with breakdown (bahan baku, biaya produksi, produk samping)
   - `T_getStockReport` (new type + implementation) — stock movements aggregated by type and product
2. **Excel Export** — Installed `exceljs`, created generic `excel.service.ts` with styled workbook generation. 3 direct Express routes:
   - `GET /reports/production-summary/excel` — detailed worksheet data with shift, factory, all outputs
   - `GET /reports/sales-summary/excel` — invoice list with customer, amounts, payment status
   - `GET /reports/stock-report/excel` — stock movements with product, type, user, notes
3. **4 Report Pages** — Each with filter bar (date range + factory), KPI cards, recharts visualization, data table, CSV + Excel export:
   - `ProductionReport.tsx` — BarChart output breakdown (beras, menir, dedak, sekam), 4 KPIs
   - `SalesReport.tsx` — PieChart revenue by customer, 4 KPIs (invoices, revenue, paid, outstanding)
   - `COGMReport.tsx` — PieChart cost breakdown, 3 KPIs (total cost, output, HPP/kg)
   - `StockReport.tsx` — BarChart IN vs OUT by product, 3 KPIs (in, out, net change)
4. **Sidebar & Routes** — "Laporan" section with `assessment` icon, 4 links. App.tsx with 4 lazy imports and `/reports/*` route block.
5. **Notification System** — Full persistent notification infrastructure:
   - Database: `Notification` model with `type` (LOW_STOCK, OVERDUE_INVOICE, OVERDUE_MAINTENANCE, SYSTEM) and `severity` (INFO, WARNING, CRITICAL)
   - Backend: `notification.repository.ts` (CRUD + duplicate check), `notification.service.ts` (alert generation with smart thresholds)
   - 5 API endpoints: list, count, mark read, mark all read, check & create alerts
   - Frontend: `Header.tsx` upgraded with notification bell + badge counter, dropdown panel with severity-colored items, 60s polling, mark read/all read
6. **Build Verification** — `tsc --noEmit` (0 errors backend + frontend), `vite build` (success in 1.89s)

Dependencies added: `exceljs` (backend)

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
- Completed **Production Stability & Integrity** (v2.2.1): Auto-reversal for deleted worksheets & cancelled invoices, audit logs for manual updates, and Vercel build fixes.
- Completed **Operational Excellence** (Prioritas 2): Report pages, Notifications, Excel export.
- 4 report pages with charts, KPI cards, and export functionality.
- Full notification system with persistent alerts and header dropdown.
- Excel export using ExcelJS with styled workbooks.

### 🛠 Active Workstream
- **Prioritas 3**: User Management Page, Quality Trending/SPC, Audit Log, Mobile/PWA.
- **Production Testing**: Verifying cross-domain cookie authentication and session persistence on Vercel/Railway.
- **Optimization**: Monitoring Railway resource usage (Memory/CPU) for the ML Service.

---
*Note for future AI Agents: Always check `src/repositories/base.repository.ts` before modifying any data access logic.*
