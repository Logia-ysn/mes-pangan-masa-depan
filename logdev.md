# ERP Pangan Masa Depan - Development Log

## Audit & Remediation (2026-02-12)

Comprehensive audit dilakukan terhadap seluruh codebase (frontend, backend, database, ML service). Skor awal: **2.8/10**. Remediation dilakukan dalam 3 phase.

---

## Phase 1: Security Hotfix

### 1.1 Auth & RBAC (`utility/auth.ts`)
- **Hardcoded JWT secret dihapus** — server menolak start tanpa `JWT_SECRET` env var
- Fungsi `requireAuth(authorization, minimumRole)` ditambahkan dengan role hierarchy:
  - OPERATOR(1) < SUPERVISOR(2) < MANAGER(3) < ADMIN(4) < SUPERUSER(5)
- Fungsi `sanitizeUser()` ditambahkan untuk strip `password_hash` dari response
- Error types: `UnauthorizedError` (401) untuk invalid token, `ForbiddenError` (403) untuk insufficient role

### 1.2 Semua 74 Handler Files Diamankan (`implementation/`)
| Role | Endpoint Type | Jumlah |
|---|---|---|
| Public | `T_login`, `T_register` | 2 (+ sanitizeUser) |
| OPERATOR | Semua GET/read, `T_getMe`, `T_changePassword` | ~28 |
| SUPERVISOR | Semua create/update | ~23 |
| ADMIN | Semua delete, factory CRUD, user management | ~16 |
| SUPERUSER | `T_seedSuperuser`, `T_generateDummy`, `T_resetDummy` | 3 |

### 1.3 Password Hash Leak Fix
- `T_login`, `T_register`, `T_getMe`, `T_updateUser` return `sanitizeUser()` — `password_hash` tidak pernah sampai ke client

### 1.4 Seed Endpoint
- `T_seedSuperuser` butuh auth `SUPERUSER` — tidak lagi publik
- Hardcoded `ROOT_PASSWORD` dihapus, diganti `req.body.password` atau `crypto.randomBytes`

### 1.5 Registration Security
- `auth.service.ts`: Register selalu set role `OPERATOR` — role escalation via registration dicegah

### 1.6 Infrastructure
- **Dockerfile**: Multi-stage build (`node:20-slim`), `USER node` (non-root), `npm ci --omit=dev`
- **.dockerignore**: Exclude `.env`, `.git`, `node_modules`, `ml-service`, `frontend`
- **docker-entrypoint.sh**: Active DB polling (bukan blind `sleep 10`), fail-loud migration
- **python-multipart**: 0.0.6 → 0.0.14 (fix CVE-2024-24762)
- **scikit-learn**: Dihapus (unused dependency)

### 1.7 Application Hardening
- `index.ts`: Graceful shutdown (SIGTERM/SIGINT), `unhandledRejection`/`uncaughtException` handlers
- `prisma.ts`: Query logging hanya di development mode

### Files yang diubah Phase 1:
- `utility/auth.ts` — rewrite (RBAC, sanitizeUser, no hardcoded secret)
- `src/services/auth.service.ts` — hardcode OPERATOR role
- `src/libs/prisma.ts` — conditional logging
- `index.ts` — graceful shutdown
- `docker-entrypoint.sh` — rewrite
- `Dockerfile` — multi-stage build
- `.dockerignore` — created
- `.env.example` — updated
- `ml-service/requirements.txt` — upgraded
- `implementation/*.ts` — semua 74 handler files

---

## Phase 2: Data Integrity

### 2.1 Prisma Schema (`prisma/schema.prisma`)

**Unique constraints ditambahkan:**
- `User.email` — `@unique`
- `Customer.code` — `@unique`
- `Factory.code` — `@unique`
- `Machine.code` — `@unique`
- `Supplier.code` — `@unique`
- `Employee.employee_code` — `@unique`
- `Invoice.invoice_number` — `@unique`
- `ProductType.code` — `@unique`
- `ProcessCategory.code` — `@unique`
- `ExpenseCategory.code` — `@unique`
- `Stock[id_factory, id_product_type]` — `@@unique` (composite)

**Indexes ditambahkan (15+):**
- `@@index` pada semua FK columns (id_factory, id_user, id_stock, dll.)
- `@@index` pada date columns (attendance_date, expense_date, invoice_date, worksheet_date, dll.)

**`@updatedAt` fix:**
- 8 models diubah dari `@default(now())` ke `@updatedAt`: User, Stock, Employee, DailyExpense, Invoice, QualityParameter, RawMaterialQualityAnalysis, Worksheet
- Semua manual `updated_at: new Date()` di repositories & services dihapus (Prisma otomatis handle)

**PENTING:** Schema sudah diubah tapi migration belum dijalankan. Perlu `npx prisma migrate dev` untuk apply ke database.

### 2.2 Stock Transaction Safety

**`T_createStockMovement.ts`:**
- Dibungkus `prisma.$transaction` — read + create movement + update stock dalam satu atomic operation
- Race condition (read-then-write tanpa lock) sudah diperbaiki

**`src/services/stock.service.ts`:**
- `updateStock()` sekarang transactional
- `transferStock()` sekarang dalam single transaction (sebelumnya 2 operasi terpisah yang bisa partial fail)

**Negative stock guard:**
- Semua OUT movement dicek `newQuantity < 0` → throw `BusinessRuleError`
- `T_deleteStockMovement.ts`: Cek reversal tidak menghasilkan stok negatif

### 2.3 Auth Error Types (`utility/auth.ts`)
- `requireAuth` throw `UnauthorizedError` (401) untuk missing/invalid token
- `requireAuth` throw `ForbiddenError` (403) untuk insufficient role
- Sebelumnya throw plain `Error` yang selalu jadi 500

### 2.4 apiWrapper Adoption
- **74/74 handler files** dibungkus `apiWrapper` (higher-order function)
- Semua manual `res.status(500).json(...)` error handling dihapus
- Error handling konsisten: `AppError` → proper HTTP status code, unknown errors → 500 JSON response
- `apiWrapper` ada di `src/utils/apiWrapper.ts`

### Files yang diubah Phase 2:
- `prisma/schema.prisma` — unique constraints, indexes, @updatedAt
- `utility/auth.ts` — UnauthorizedError/ForbiddenError
- `implementation/T_createStockMovement.ts` — prisma.$transaction + negative guard
- `implementation/T_deleteStockMovement.ts` — negative stock reversal guard
- `implementation/T_updateStock.ts` — removed manual updated_at
- `src/services/stock.service.ts` — transactional updateStock/transferStock
- `src/services/worksheet.service.ts` — removed manual updated_at
- `src/repositories/stock.repository.ts` — removed manual updated_at
- `src/repositories/user.repository.ts` — removed manual updated_at
- `implementation/*.ts` — semua 74 files dibungkus apiWrapper

---

## Phase 3: Frontend & Performance

### 3.1 Logger Utility (`frontend/src/utils/logger.ts`)
- Created dev-only logger: hanya log saat `import.meta.env.DEV === true`
- **67 console statements** di 14 files diganti dengan `logger.log/warn/error`
- Production build = zero console output
- `ErrorBoundary.tsx` sengaja dipertahankan (selalu log errors)

### 3.2 Lazy Loading (`frontend/src/App.tsx`)
- **11 page components** lazy-loaded dengan `React.lazy()` + `<Suspense>`
- Code splitting otomatis — setiap page jadi chunk terpisah
- Initial bundle size berkurang signifikan
- `PageLoader` spinner component untuk loading state

Pages yang di-lazy-load:
- Login, Dashboard, Settings
- Worksheets, WorksheetDetail, Stocks, Machines, Maintenance, OEE, RawMaterialReceipt, QCGabah

### 3.3 API Layer (`frontend/src/services/api.ts`)
- **Request timeout**: 30 detik (sebelumnya tidak ada)
- **401 auto-logout**: Clear token + redirect ke `/login`
- **403 handling**: Toast "Akses ditolak"
- **500+ handling**: Toast "Kesalahan server"
- **Network error**: Toast "Tidak dapat terhubung ke server"
- **Timeout error**: Toast "Request timeout"
- Response interceptor parse nested error format (`error.message` dan `error.error.message`)
- Semua `data: any` parameter types → `Record<string, unknown>`

### 3.4 React.memo
- 6 presentational components dibungkus `React.memo`:
  - `KPICard`, `MachinePanel`, `MaintenancePanel`, `InventoryPanel`, `ProductionProgress`

### 3.5 TypeScript Cleanup
- `exportUtils.ts`: `any[]` → `Record<string, unknown>[]`
- `api.ts`: Semua `data: any` parameter → `Record<string, unknown>`

### Files yang diubah Phase 3:
- `frontend/src/utils/logger.ts` — created
- `frontend/src/App.tsx` — lazy loading + Suspense
- `frontend/src/services/api.ts` — timeout, 401 handling, type cleanup
- `frontend/src/utils/exportUtils.ts` — type fix
- `frontend/src/components/Dashboard/KPICard.tsx` — React.memo
- `frontend/src/components/Dashboard/MachinePanel.tsx` — React.memo
- `frontend/src/components/Dashboard/MaintenancePanel.tsx` — React.memo
- `frontend/src/components/Dashboard/InventoryPanel.tsx` — React.memo
- `frontend/src/components/Production/ProductionProgress.tsx` — React.memo
- 14 files — console.log → logger replacement

---

## Phase 4: Operational Integrity & Automation (Current Status)

Fokus pada integritas data operasional dan otomatisasi alur kerja produksi untuk meminimalkan human error.

### 4.1 Automated Batch Numbering (v2.19.0)
- **Traceability**: Implementasi sistem penomoran batch terpusat `{Factory}{Type}{Variety}{Level}-{YYMMDD}-{Seq}`.
- **Integrasi**: Otomatis generate kode saat Goods Receipt (bahan baku) dan Worksheet (produk jadi/sampingan).
- **Service**: `BatchNumberingService` atomic sequence generation untuk mencegah duplikasi.
- **Audit Trail**: Kolom `batch_code` ditambahkan ke setiap pergerakan stok.

### 4.2 Advanced SKU Classification (v2.18.0)
- **Master Data**: Migrasi dari input teks manual ke `RiceVariety`, `RiceLevel`, `RiceBrand`.
- **SKU Generator**: Otomatisasi pembuatan nama produk dan kode unik.
- **Factory Link**: Produk baru otomatis terhubung ke `FactoryMaterialConfig`.

### 4.3 Multi-Factory & Stock Transfer (v2.9 - v2.17)
- **Transfer Antar Pabrik**: Fitur pemindahan stok validasi transaksional (PMD 1 ↔ PMD 2).
- **Mobile UI**: Redesain total untuk responsivitas (horizontal scroll selector, typography scaling).
- **UI Premium**: Standarisasi desain komponen (borders, spacing, animations).

### 4.4 Data Integrity Fixes
- **Transactional Operations**: Semua mutasi stok (PO, Invoice, Transfer) dibungkus `prisma.$transaction`.
- **Hard Reset**: Logika reset total yang aman terhadap foreign key constraints baru.
- **Validation**: Perbaikan validasi input angka dan ID di seluruh endpoint.

---

## Belum Dikerjakan (Next Steps)

- [ ] Quality Trending Dashboard (SPC Charts)
- [ ] Audit Log Viewer UI
- [ ] Migrasi auth token ke httpOnly cookie
- [ ] Rate limiting & Request logging
- [ ] CI/CD pipeline automation

---

## Tech Stack

- **Backend**: TypeScript, Express.js (via NAIV framework `@naiv/codegen-nodejs-typeorm`), Prisma ORM
- **Database**: PostgreSQL (port 5434, user: postgres, db: erp_pangan_masa_depan)
- **Frontend**: React 19, TypeScript, Vite, axios, recharts, react-router-dom v7
- **ML Service**: Python FastAPI, uvicorn
- **Infra**: Docker, multi-stage build

## Cara Menjalankan

```bash
# 1. Start PostgreSQL (Docker)
docker start erp-postgres  # atau buat baru jika belum ada

# 2. Backend
cd /Users/yay/project/erp-pangan-masa-depan
cp .env.example .env  # lalu edit sesuai kebutuhan
npm install
npx prisma generate
npx prisma migrate dev  # PENTING: apply schema changes dari Phase 2
npm run dev              # build + start di port 3005

# 3. Frontend
cd frontend
npm install
npm run dev              # Vite dev server

# 4. ML Service (opsional)
cd ml-service
pip install -r requirements.txt
uvicorn main:app --port 8000
```

## Catatan Penting

- **Schema migration belum dijalankan** — `npx prisma migrate dev` diperlukan untuk apply unique constraints, indexes, dan @updatedAt changes
- **JWT_SECRET wajib di-set** di `.env` — server tidak akan start tanpa ini
- **NAIV Framework** auto-generate types dari `.naiv` design files — handler signatures di `implementation/` tidak boleh diubah
- **apiWrapper** membungkus semua handler — error handling otomatis, tidak perlu try/catch manual
- **requireAuth** tersedia di semua handler — tinggal panggil `await requireAuth(req.headers.authorization, 'ROLE_NAME')`
