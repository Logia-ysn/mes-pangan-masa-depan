# 🛡️ Root Level Audit Report

## 1. Dependency Analysis (`package.json`)
- **Unused Dependency**: `mysql2` is listed but project uses PostgreSQL (`pg`).
- **Scripts**: 
  - `dev` script (`npm run build && npm start`) is slow for development.
  - `seed-admin` uses `ts-node` which is good.
- **Engines**: Node >= 18.0.0 is appropriate.

## 2. Compiler Options (`tsconfig.json`)
- **Strictness**: `strict: false` is **NOT Recommended**. It hides potential null/undefined errors.
- **Target**: `esnext` is fine for Node 18+, but `es2020` or `es2022` is safer for compatibility.

## 3. Database Config (`data-source.ts`)
- **CRITICAL**: `synchronize: true` will **DROP DATA** in production if schema changes. Must be disabled in production.
- **Paths**: Entity paths use `types/model`, ensuring they work in both TS (dev) and JS (prod) structure is key.

## 4. Server Entry (`index.ts`)
- **Security**: No `helmet`, `cors`, or `rate-limit` visible.
- **Hardcoding**: Port fallback to `9415` vs `3000` in env.

## 5. Containerization (`docker-compose.yml`)
- **Secrets**: Database passwords and JWT secrets are hardcoded in the compose file.
- **Healthchecks**: PostgreSQL healthcheck is good.

---

## 🛠️ Proposed Fixes

### A. Cleanup `package.json`
- Remove `mysql2`.
- Update `dev` script to use `ts-node-dev` or `nodemon` if available, or keep as is but aware of slowness.

### B. Secure `data-source.ts`
- Change `synchronize` to: `process.env.NODE_ENV !== 'production'`.
- Ensure SSL is enabled for production DBs (Railway requires it).

### C. Harden `index.ts`
- (Optional) Install `cors` and `helmet` if the Naiv framework supports middleware injection.

### D. Docker Security
- Recommend using `.env` file usage in `docker-compose.yml` instead of hardcoded values.

## 6. Source Code Analysis (`src/`)

### A. Services (`src/services`)
- **Critical Issue**: `worksheet.service.ts` -> `createWorksheet` performs multiple database writes (Worksheet, InputBatch, SideProduct, StockMovement) **without a transaction**. If one fails, data becomes corrupt.
- **Code Quality**: `createWorksheet` is too large (monolithic function). Should be split into helper methods.
- **Safety**: `any` casting is used to bypass type checks on `Worksheet` creation.

### B. Repositories (`src/repositories`)
- **Performance**: `worksheet.repository.ts` -> `getProductionStats` fetches **ALL** worksheets vs memory to calculate sums. This will crash the server as data grows.
    - *Fix*: Use `createQueryBuilder` with `SUM()` and `AVG()` at the database level.
- **Safety**: Repository methods properly abstract DB calls.

### C. DTOs (`src/dto`)
- **Validation**: DTOs are plain interfaces. Validation logic (e.g. `password.length < 6`) is hardcoded in services.
    - *Rec*: Use `class-validator` decorators (`@IsString`, `@MinLength`) and a global validation pipe/middleware.

### D. Machine Learning (`src/ml`)
- **Stability**: `analyze.py` prints JSON to stdout. Any other print (e.g. OpenCV warnings) will break the JSON parsing in Node.js.
- **Hardcoding**: Calibration defaults are hardcoded in Python.

---

## 🛠️ Step 2 Proposed Fixes

### A. Refactor `worksheet.service.ts`
- Wrap `createWorksheet` and `updateWorksheet` in `AppDataSource.transaction`.
- Break down logic into `handleInputBatches`, `handleSideProducts`, `revertStocks`.

### B. Optimize `worksheet.repository.ts`
- Rewrite `getProductionStats` to use SQL aggregation.

### C. Standardize Validation
- Add `class-validator` to DTOs (Phase 10).

## 7. Frontend Audit (`frontend/`)

### A. Structure & Routing
- **Good**: `App.tsx` uses `ProtectedRoute` and a catch-all 404 handler. Routing structure is solid.
- **Risk**: Routes are hardcoded strings in `App.tsx` and `Sidebar.tsx`. Recommend `routes.ts` constants to avoid typos.

### B. Error Handling & Feedback
- **Critical Gap**: API errors (e.g., in `fetchData`) are mostly logged to console (`console.error`). The user sees no visual feedback if a load fails.
- **UI/UX**: Extensive use of `window.alert()` and `window.confirm()` for user interaction. This blocks the thread and feels dated.
    - *Rec*: Implement a Toast notification system (e.g., `react-hot-toast`) and custom Modals.

### C. Data Integrity & Logic
- **RawMaterialReceipt.tsx**:
    - Relies on `JSON.parse(m.notes || '{}')` to extract critical batch data. This is "magic" string parsing and very fragile. If the notes schema changes, this breaks.
    - **Risky Logic**: `handleSave` has logic to "create product type/factory/stock on the fly" if missing. This business logic should ideally live in the backend or be explicit user actions.
- **Stocks.tsx**:
    - Parsing depends on `parseFloat` directly from inputs.
- **OEE.tsx**:
    - Good safeguards against division-by-zero (`plannedTime > 0`). Logic appears sound but depends on accurate `Worksheet` data.

### D. Performance
- **Good**: Uses `Promise.all` for parallel fetching in `Stocks.tsx`, `OEE.tsx`.
- **Visualization**: `Recharts` is used effectively.

---

## 🛠️ Frontend Proposed Fixes
1. **Toast System**: Replace `alert()` with a Toast context.
2. **Error Boundaries**: Wrap `fetchData` calls in try/catch that sets a visible error state variable to show a "Retry" UI to the user.
3. **Refactor RawMaterial**: Create specific backend endpoints for `BatchReceipts` instead of overloading `StockMovement.notes` with JSON blobs.

---

## 8. Database & Migration Audit (Step 4)

### A. Entity vs Migration Mapping
- **Status**: ✅ **Consistent**.
- **Details**: 
  - `src/migration` contains 11 files. The `initial` migration covers the majority of the 26 entities found in `types/model`.
  - Subsequent migrations (e.g., `WorksheetEnhancement`, `AddRawMaterialCategory`) correctly add the remaining entities and columns.
  - **Verified**: `WorksheetInputBatch` and `WorksheetSideProduct` are correctly defined in migrations and entities.

### B. Foreign Key Safety & Cascade Rules
- **General Rule**: Most relationships use `ON DELETE NO ACTION`. This is **Safe** as it prevents accidental deletion of parent records (e.g., deleting a `Factory` won't wipe out `Stocks`).
- **Exceptions (Good)**: 
  - `WorksheetInputBatch` -> `Worksheet`: `ON DELETE CASCADE`.
  - `WorksheetSideProduct` -> `Worksheet`: `ON DELETE CASCADE`.
  - **Verified**: The `WorksheetInputBatch` entity explicitly includes `{ onDelete: 'CASCADE' }` in the `@ManyToOne` decorator, matching the migration.

### C. Data Type Consistency
- **Numeric Types**:
  - Money/Weight columns (e.g., `gabah_input`, `unit_price`) use `numeric(15,2)` in Postgres and `@Column({ type: 'decimal', precision: 15, scale: 2 })` in TypeORM. **Match**.
  - `Rendemen` uses `numeric(5,2)`. **Match**.
  - `Machine.capacity_per_hour` uses `numeric(10,2)`. **Match**.

### D. Constraints
- **Primary Keys**: All tables have `id` (Serial/BigSerial) as PK.
- **Unique Constraints**: `RawMaterialVariety.code` and `RawMaterialCategory.code` have `UNIQUE` constraints defined in migration `AddRawMaterialCategoryVariety`.

### E. Conclusion
The database schema is robust. Cascades are applied where logical (transaction details), and strict checks are applied where necessary (master data).
