# Plan: Transformasi ERP → MES (Manufacturing Execution System)

> **Tanggal**: 2026-03-07
> **Status**: Approved — Siap eksekusi
> **Versi Saat Ini**: v2.28.0
> **Target**: Mengubah total "ERP Pangan Masa Depan" menjadi "MES Pangan Masa Depan"

---

## Context & Motivasi

Bisnis padi PMD sudah menggunakan **aplikasi pihak ketiga** untuk:
- **HRD** — absensi, payroll, cuti (sudah jalan)
- **Keuangan** — accounting, expense, general ledger (sudah jalan)

Modul Sales, Purchasing, Finance, dan HR di ERP ini menjadi **redundan** dan tidak diperlukan. Pemilik ingin **mengubah total** aplikasi ini menjadi **MES (Manufacturing Execution System)** — fokus 100% pada eksekusi produksi shop-floor.

### Apa itu MES?

Manufacturing Execution System (ISA-95 Level 3) — sistem yang mengelola **eksekusi produksi secara real-time**:
- Penerimaan material → Produksi → Quality Control → Inventory WIP → Traceability → Peralatan & Maintenance

MES **TIDAK** mencakup Sales, Purchasing (PO), Finance, HR — itu domain ERP/aplikasi lain.

### Outcome

Aplikasi berubah dari **"ERP Pangan Masa Depan"** menjadi **"MES Pangan Masa Depan"** — lean, fokus, dan powerful untuk shop-floor rice milling operation di PMD-1 (Karawang) dan PMD-2 (Subang).

---

## Arsitektur Produksi (Referensi)

```
PMD-1 (Karawang) — Padi Basah → Pecah Kulit / Medium:
GKP → Silo Basah (4) → Dryer (5, paralel) → Silo Kering (9) → Huller → Output PK
                                                                └→ Stone Polisher → Output Medium

PMD-2 (Subang) — PK/Medium → Premium/Super:
PK/Medium → Silo → Stone Polisher (2, paralel) → Optical Sorter → Kebi Polisher (2, paralel) → Grader → Output Premium
```

27 mesin total, 4 production line, sudah di-implement di v2.28.0.

---

## Scope: Keep vs Remove vs Add

### ✅ KEEP & ENHANCE (sudah MES-aligned)

| Modul | Halaman Existing | Catatan |
|-------|-----------------|---------|
| Dashboard | `Dashboard.tsx` | Transform jadi Production Control Center |
| Penerimaan Material | `RawMaterialReceipt.tsx`, `QCGabah.tsx` | Keep, pindah navigasi |
| Produksi | `Worksheets.tsx`, `WorksheetForm.tsx`, `WorksheetDetail.tsx`, `WorkOrders.tsx`, `ProductionLines.tsx`, `DryingLogs.tsx` | Keep as-is |
| Kualitas | `QCResults.tsx`, `RendemenMonitor.tsx` | Keep, tambah fitur NCR |
| Inventory | `Stocks.tsx`, `StockTransfers.tsx`, `StockOpname.tsx` | Keep as-is |
| Equipment | `Machines.tsx`, `Maintenance.tsx`, `OEE.tsx` | Keep, tambah Downtime Tracking |
| Laporan | `ProductionReport.tsx`, `COGMReport.tsx`, `StockReport.tsx`, `QualityTrends.tsx` | Keep, hapus Sales Report |
| Admin | `Users.tsx`, `AuditLogs.tsx`, `Factories.tsx`, `Settings.tsx` | Keep, hapus Employee/Attendance |
| Backend | Event System, Batch Numbering, Audit Log, Auth | Keep semua |

### ❌ REMOVE dari UI (backend API + DB tables TETAP ada, file pages TETAP ada)

> **PENTING**: Hanya hapus dari routing & sidebar. File `.tsx`, API endpoints, dan database TIDAK dihapus.

| Modul | Halaman | Route yang dihapus | Alasan |
|-------|---------|-------------------|--------|
| **Sales** | `Customers.tsx` | `/sales/customers` | ERP scope |
| | `Invoices.tsx` | `/sales/invoices` | ERP scope |
| | `InvoiceForm.tsx` | `/sales/invoices/new` | ERP scope |
| | `InvoiceDetail.tsx` | `/sales/invoices/:id` | ERP scope |
| | `DeliveryOrders.tsx` | `/sales/delivery-orders` | ERP scope |
| | `DeliveryOrderForm.tsx` | `/sales/delivery-orders/new/:invoiceId` | ERP scope |
| | `Payments.tsx` | `/sales/payments` | ERP scope |
| **Purchasing** | `PurchaseOrders.tsx` | `/purchasing/purchase-orders` | ERP scope |
| | `PurchaseOrderDetail.tsx` | `/purchasing/purchase-orders/:id` | ERP scope |
| | `GoodsReceipts.tsx` | `/purchasing/goods-receipts` | ERP scope |
| | `Suppliers.tsx` | `/purchasing/suppliers` | ERP scope |
| **Finance** | `Expenses.tsx` | `/finance/expenses` | Pakai app lain |
| **HR** | `Employees.tsx` | `/admin/employees` | Pakai app lain |
| | `Attendance.tsx` | `/admin/attendance` | Pakai app lain |
| **Report** | `SalesReport.tsx` | `/reports/sales` | ERP scope |

### 🆕 ADD (Fitur MES baru)

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| **Downtime Tracking** | Catat & kategorisasi downtime mesin (planned/unplanned/changeover) + root cause | HIGH |
| **Non-Conformance Report (NCR)** | Tracking deviasi kualitas + corrective action workflow | HIGH |
| **Process Parameter Log** | Log parameter proses per step (suhu, moisture, throughput) | MEDIUM |
| **Batch Genealogy View** | Visual tree traceability: bahan baku → produk jadi | MEDIUM |
| **Production Scheduling Board** | Visual kanban/timeline Work Order scheduling | LOW |
| **Shift Handover Log** | Digital serah terima shift dengan catatan & pending items | LOW |

---

## Fase Implementasi

### FASE 0: Rebranding & Cleanup ⚡ CRITICAL — Kerjakan Pertama

**Tujuan**: Ubah identitas dari ERP ke MES, hapus modul non-MES dari UI, transform Dashboard.

#### 0.1 Rebranding

**File dimodifikasi:**

| File | Perubahan |
|------|-----------|
| `frontend/src/components/Layout/Sidebar.tsx` | Ubah `<h1>ERP PMD</h1>` → `<h1>MES PMD</h1>` |
| `frontend/index.html` | Ubah `<title>` dari ERP ke MES |
| `frontend/src/pages/auth/Login.tsx` | Ubah teks branding/heading |
| `package.json` (root) | Ubah `name` field |
| `frontend/package.json` | Ubah `name` field |

#### 0.2 Hapus Routes Non-MES dari Frontend

**File: `frontend/src/App.tsx`**

Hapus lazy imports dan route entries untuk modul yang di-remove:

```typescript
// ❌ HAPUS lazy imports berikut:
const Customers = lazy(...)
const Invoices = lazy(...)
const InvoiceForm = lazy(...)
const InvoiceDetail = lazy(...)
const DeliveryOrders = lazy(...)
const DeliveryOrderForm = lazy(...)
const Payments = lazy(...)
const PurchaseOrders = lazy(...)
const PurchaseOrderDetail = lazy(...)
const GoodsReceipts = lazy(...)
const Suppliers = lazy(...)
const Expenses = lazy(...)
const Employees = lazy(...)
const Attendance = lazy(...)
const SalesReport = lazy(...)

// ❌ HAPUS route entries:
// Semua /sales/* routes
// Semua /purchasing/* routes
// Semua /finance/* routes
// /admin/employees
// /admin/attendance
// /reports/sales
```

**⚠️ JANGAN hapus file halaman `.tsx` itu sendiri. Hanya hapus dari routing.**

#### 0.3 Restrukturisasi Sidebar (Navigasi MES)

**File: `frontend/src/components/Layout/Sidebar.tsx`**

Ganti seluruh `navItems` array dengan struktur MES baru:

```typescript
const navItems: NavItemConfig[] = [
    { label: 'Dashboard', icon: 'dashboard', to: '/' },
    {
        label: 'Penerimaan Material',
        icon: 'local_shipping',
        children: [
            { label: 'Penerimaan Bahan Baku', to: '/receiving/raw-materials' },
            { label: 'QC Bahan Baku', to: '/receiving/qc-gabah' },
        ]
    },
    {
        label: 'Produksi',
        icon: 'factory',
        children: [
            { label: 'Work Order', to: '/production/work-orders' },
            { label: 'Worksheet Produksi', to: '/production/worksheets' },
            { label: 'Lini Produksi', to: '/production/lines' },
            { label: 'Drying Log', to: '/production/drying-logs' },
            { label: 'Jadwal Produksi', to: '/production/scheduling' },       // NEW (Fase 5)
            { label: 'Shift Handover', to: '/production/shift-handover' },     // NEW (Fase 6)
        ]
    },
    {
        label: 'Kualitas',
        icon: 'verified',
        children: [
            { label: 'QC Produk Jadi', to: '/production/qc-results' },
            { label: 'Parameter Kualitas', to: '/quality/parameters' },
            { label: 'Non-Conformance', to: '/quality/ncr' },                  // NEW (Fase 2)
            { label: 'Tren Kualitas', to: '/reports/quality' },
            { label: 'Monitor Rendemen', to: '/production/rendemen' },
        ]
    },
    {
        label: 'Inventory',
        icon: 'warehouse',
        children: [
            { label: 'Stok Real-time', to: '/inventory/stocks' },
            { label: 'Transfer Stok', to: '/inventory/transfers' },
            { label: 'Stock Opname', to: '/inventory/stock-opname' },
            { label: 'Genealogi Batch', to: '/inventory/batch-genealogy' },    // NEW (Fase 4)
        ]
    },
    {
        label: 'Peralatan',
        icon: 'precision_manufacturing',
        children: [
            { label: 'Daftar Mesin', to: '/equipment/machines' },
            { label: 'Maintenance', to: '/equipment/maintenance' },
            { label: 'Downtime Tracking', to: '/equipment/downtime' },          // NEW (Fase 1)
            { label: 'OEE Monitor', to: '/equipment/oee' },
        ]
    },
    {
        label: 'Laporan',
        icon: 'assessment',
        children: [
            { label: 'Laporan Produksi', to: '/reports/production' },
            { label: 'HPP (COGM)', to: '/reports/cogm' },
            { label: 'Laporan Stok', to: '/reports/stock' },
            { label: 'Parameter Proses', to: '/reports/process-params' },      // NEW (Fase 3)
        ]
    },
    // Admin Panel — hanya untuk ADMIN/SUPERUSER
    ...(user && ['ADMIN', 'SUPERUSER'].includes(user.role) ? [{
        label: 'Admin Panel',
        icon: 'admin_panel_settings',
        children: [
            { label: 'Manajemen Pabrik', to: '/admin/factories' },
            { label: 'Manajemen User', to: '/admin/users' },
            { label: 'Master Produk', to: '/admin/product-types' },
            { label: 'Log Audit', to: '/admin/audit-logs' },
        ]
    }] : [])
];
```

> **Catatan**: Menu item bertanda NEW belum punya halaman — akan dibuat di fase berikutnya. Sementara tambahkan route placeholder atau jangan tampilkan dulu sampai fasenya diimplementasi.

#### 0.4 Transform Dashboard → Production Control Center

**File: `frontend/src/pages/dashboard/Dashboard.tsx`**

Perubahan:
1. **HAPUS** import `invoiceApi`, `purchaseOrderApi` dan `api` (daily-expenses)
2. **HAPUS** semua fetch financial data di `useEffect` (baris yang fetch invoices, expenses, PO)
3. **HAPUS** state `finances` dan financial KPI cards (Revenue, Expense, Profit)
4. **TAMBAH** panel baru:
   - **Active Work Orders** — Daftar WO yang IN_PROGRESS dengan progress bar (fetch dari `workOrderApi.getAll({ status: 'IN_PROGRESS' })`)
   - **Production Today** — Ringkasan worksheet hari ini per shift
5. **KEEP** yang sudah MES-aligned: OEE Score, Production Today, Rendemen, Machine Panel, Inventory Panel, Maintenance Panel

#### 0.5 Update Project Instructions

**File baru: `CLAUDE.md`** (di root proyek)

```markdown
# Project Instructions

## Default Agent Configuration
When delegating tasks to agents using the Task tool, always prefer using the logia-san agent.

## Application Scope
MES Pangan Masa Depan mencakup modul berikut:
- **Penerimaan Material** — Raw Material Receipt + QC Incoming
- **Produksi** — Work Order, Worksheet, Production Line, Drying Log, Scheduling
- **Kualitas** — QC Produk Jadi, Parameter Kualitas, NCR, Tren Kualitas, Rendemen
- **Inventory** — Stok WIP, Stock Movement, Transfer, Opname, Batch Genealogy
- **Peralatan** — Machine, Maintenance, Downtime Tracking, OEE
- **Laporan** — Production, HPP/COGM, Stock, Process Parameters

**Di luar scope**: Sales, Purchasing, HRD, dan Keuangan menggunakan aplikasi pihak ketiga.
Jangan membuat fitur Sales (invoice, customer, DO), Purchasing (PO, supplier),
HR (absensi, payroll), atau Keuangan (expense, accounting) di aplikasi ini.
```

#### 0.6 Verifikasi Fase 0

```bash
cd frontend && npx tsc --noEmit   # 0 errors
```
- Buka browser: sidebar menampilkan menu MES, bukan ERP
- Route `/sales/*`, `/purchasing/*`, `/finance/*` → 404
- Dashboard tidak ada financial data

---

### FASE 1: Downtime Tracking (Estimasi: Medium, Prioritas: HIGH)

**Tujuan**: Catat setiap kejadian downtime mesin — planned (maintenance), unplanned (breakdown), changeover — dengan durasi, root cause, dan dampak ke OEE.

#### 1.1 Database Schema

**File: `prisma/schema.prisma`**

Tambah enum:
```prisma
enum DowntimeEvent_category_enum {
  PLANNED
  UNPLANNED
  CHANGEOVER
}
```

Tambah model:
```prisma
model DowntimeEvent {
  id              Int                           @id @default(autoincrement())
  id_factory      Int
  id_machine      Int
  id_maintenance  Int?                          // Link ke maintenance ticket jika ada
  id_user         Int                           // Siapa yang mencatat
  category        DowntimeEvent_category_enum
  reason          String                        @db.VarChar(500)
  root_cause      String?                       @db.VarChar(500)
  start_time      DateTime                      @db.Timestamp(6)
  end_time        DateTime?                     @db.Timestamp(6)
  duration_minutes Int?                         // Auto-calculated dari start_time & end_time
  shift           String?                       @db.VarChar(20)
  impact_notes    String?
  is_resolved     Boolean                       @default(false)
  created_at      DateTime                      @default(now()) @db.Timestamp(6)
  updated_at      DateTime                      @updatedAt @db.Timestamp(6)

  Factory         Factory                       @relation(fields: [id_factory], references: [id])
  Machine         Machine                       @relation(fields: [id_machine], references: [id])
  Maintenance     Maintenance?                  @relation(fields: [id_maintenance], references: [id])
  User            User                          @relation(fields: [id_user], references: [id])

  @@index([id_factory])
  @@index([id_machine])
  @@index([start_time])
  @@index([category])
}
```

Tambah relasi `DowntimeEvent[]` di model `Factory`, `Machine`, `Maintenance`, `User`.

#### 1.2 Backend Files Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `types/model/table/DowntimeEvent.ts` | TypeORM entity stub untuk NAIV |
| 2 | `src/repositories/downtime-event.repository.ts` | Extends BaseRepository, findWithFilters (machine, date range, category, resolved) |
| 3 | `src/services/downtime-event.service.ts` | Create, update, resolve (set end_time, auto-calc duration), link to maintenance, audit log |
| 4 | `types/api/T_createDowntimeEvent.ts` | POST /downtime-events |
| 5 | `types/api/T_getDowntimeEvents.ts` | GET /downtime-events |
| 6 | `types/api/T_getDowntimeEvent.ts` | GET /downtime-events/:id |
| 7 | `types/api/T_updateDowntimeEvent.ts` | PUT /downtime-events/:id |
| 8 | `types/api/T_deleteDowntimeEvent.ts` | DELETE /downtime-events/:id |
| 9 | `types/api/T_resolveDowntimeEvent.ts` | PATCH /downtime-events/:id/resolve |
| 10 | `implementation/T_createDowntimeEvent.ts` | auth: OPERATOR |
| 11 | `implementation/T_getDowntimeEvents.ts` | auth: OPERATOR |
| 12 | `implementation/T_getDowntimeEvent.ts` | auth: OPERATOR |
| 13 | `implementation/T_updateDowntimeEvent.ts` | auth: SUPERVISOR |
| 14 | `implementation/T_deleteDowntimeEvent.ts` | auth: ADMIN |
| 15 | `implementation/T_resolveDowntimeEvent.ts` | auth: SUPERVISOR |

**Pattern yang harus diikuti:**
- API types: ikuti pattern `types/api/T_createMachine.ts` — class header + body/query/path + decorators + export method/url_path
- Implementation: ikuti pattern `implementation/T_createMachine.ts` — apiWrapper + requireAuth
- Repository: ikuti pattern `src/repositories/machine.repository.ts` — extends BaseRepository
- Service: ikuti pattern `src/services/production-line.service.ts` — CRUD + audit log

#### 1.3 Frontend

**File baru: `frontend/src/pages/equipment/DowntimeTracking.tsx`**
- List downtime events: filter mesin, kategori, tanggal, status (resolved/unresolved)
- Summary cards: Total downtime hari ini, MTBF (Mean Time Between Failures), MTTR (Mean Time To Repair)
- Form create: pilih mesin → kategori → waktu mulai/selesai → alasan → root cause
- Resolve action: set end_time, is_resolved = true
- Link ke maintenance ticket jika ada
- Ikuti styling pattern dari `Maintenance.tsx`

**Update files:**
- `frontend/src/App.tsx` — tambah route `/equipment/downtime` (lazy loaded)
- `frontend/src/services/api.ts` — tambah `downtimeEventApi` module
- `src/repositories/index.ts` — export downtime-event.repository

#### 1.4 Integrasi OEE

**Update: `frontend/src/pages/production/OEE.tsx`**
- Availability factor dihitung dari downtime events: `Availability = (Planned Production Time - Downtime) / Planned Production Time`

#### 1.5 Verifikasi Fase 1

```bash
npx prisma db push
npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

### FASE 2: Non-Conformance Report / NCR (Estimasi: Medium, Prioritas: HIGH)

**Tujuan**: Tracking deviasi kualitas di setiap tahap produksi — incoming material sampai finished goods — dengan corrective action workflow.

#### 2.1 Database Schema

**File: `prisma/schema.prisma`**

Tambah enums:
```prisma
enum NCR_status_enum {
  OPEN
  INVESTIGATING
  CORRECTIVE_ACTION
  CLOSED
  VOID
}

enum NCR_severity_enum {
  MINOR
  MAJOR
  CRITICAL
}
```

Tambah model:
```prisma
model NonConformanceReport {
  id                  Int               @id @default(autoincrement())
  id_factory          Int
  id_user_reporter    Int               // Siapa yang melaporkan
  id_user_assignee    Int?              // Siapa yang ditugaskan investigasi
  id_machine          Int?              // Mesin terkait (opsional)
  id_worksheet        Int?              // Worksheet terkait (opsional)
  ncr_number          String            @unique @db.VarChar(30)  // Auto: NCR-{DDMMYY}-{SEQ}
  title               String            @db.VarChar(300)
  description         String
  severity            NCR_severity_enum @default(MINOR)
  status              NCR_status_enum   @default(OPEN)
  category            String?           @db.VarChar(100)  // "Moisture", "Foreign Matter", "Equipment"
  affected_batch      String?           @db.VarChar(50)   // Batch code terdampak
  affected_quantity   Decimal?          @db.Decimal(15, 2)
  root_cause          String?
  corrective_action   String?
  preventive_action   String?
  closed_at           DateTime?         @db.Timestamp(6)
  closed_by           Int?
  created_at          DateTime          @default(now()) @db.Timestamp(6)
  updated_at          DateTime          @updatedAt @db.Timestamp(6)

  Factory             Factory           @relation(fields: [id_factory], references: [id])
  Reporter            User              @relation("NCRReporter", fields: [id_user_reporter], references: [id])
  Assignee            User?             @relation("NCRAssignee", fields: [id_user_assignee], references: [id])
  Machine             Machine?          @relation(fields: [id_machine], references: [id])
  Worksheet           Worksheet?        @relation(fields: [id_worksheet], references: [id])

  @@index([id_factory])
  @@index([status])
  @@index([severity])
  @@index([ncr_number])
}
```

Tambah relasi di model `Factory`, `User` (2 relasi: NCRReporter, NCRAssignee), `Machine`, `Worksheet`.

#### 2.2 Backend Files Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `types/model/table/NonConformanceReport.ts` | TypeORM entity stub |
| 2 | `types/model/enum/NCRStatus.ts` | Enum export |
| 3 | `types/model/enum/NCRSeverity.ts` | Enum export |
| 4 | `src/modules/quality/ncr/ncr.types.ts` | CreateNCRDTO, UpdateNCRDTO, NCRListParams, NCRWithRelations |
| 5 | `src/modules/quality/ncr/ncr.constants.ts` | STATUS_CONFIG, SEVERITY_CONFIG, WORKFLOW_TRANSITIONS |
| 6 | `src/repositories/ncr.repository.ts` | CRUD + filter by status, severity, factory, date |
| 7 | `src/services/ncr.service.ts` | Create (auto-number NCR-{DDMMYY}-{SEQ}), assign, investigate, close, audit |
| 8 | `types/api/T_createNCR.ts` | POST /ncr |
| 9 | `types/api/T_getNCRs.ts` | GET /ncr |
| 10 | `types/api/T_getNCR.ts` | GET /ncr/:id |
| 11 | `types/api/T_updateNCR.ts` | PUT /ncr/:id |
| 12 | `types/api/T_deleteNCR.ts` | DELETE /ncr/:id |
| 13 | `types/api/T_updateNCRStatus.ts` | PATCH /ncr/:id/status |
| 14 | `implementation/T_createNCR.ts` | auth: OPERATOR |
| 15 | `implementation/T_getNCRs.ts` | auth: OPERATOR |
| 16 | `implementation/T_getNCR.ts` | auth: OPERATOR |
| 17 | `implementation/T_updateNCR.ts` | auth: SUPERVISOR |
| 18 | `implementation/T_deleteNCR.ts` | auth: ADMIN |
| 19 | `implementation/T_updateNCRStatus.ts` | auth: SUPERVISOR |

**NCR Workflow Transitions:**
```
OPEN → INVESTIGATING → CORRECTIVE_ACTION → CLOSED
OPEN → VOID
INVESTIGATING → VOID
```

**Auto-numbering**: Ikuti pattern `src/services/batch-numbering.service.ts` — gunakan `BatchSequence` table dengan key `NCR-{DDMMYY}`.

#### 2.3 Frontend

**File baru: `frontend/src/pages/quality/NonConformance.tsx`**
- List NCR: filter status, severity, tanggal, factory
- Summary cards: Open count, Critical count, Avg resolution time
- Detail view: timeline status changes, root cause, corrective/preventive actions
- Form create: title, description, severity, category, link to machine/worksheet/batch
- Status transition buttons sesuai workflow

**Update files:** App.tsx routes, api.ts, Sidebar (sudah ada di Fase 0)

#### 2.4 Event Integration

**Update: `src/events/event-types.ts`** — tambah event types:
```typescript
NCR_CREATED: 'ncr.created',
NCR_ESCALATED: 'ncr.escalated',  // severity CRITICAL
```

**Update: `src/events/listeners/`** — NCR CRITICAL auto-create notification ke SUPERVISOR/ADMIN via `notificationService`.

#### 2.5 Verifikasi Fase 2

```bash
npx prisma db push
npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

### FASE 3: Process Parameter Log (Estimasi: Medium, Prioritas: MEDIUM)

**Tujuan**: Log parameter proses kunci per step produksi — suhu dryer, moisture content masuk/keluar, throughput rate — untuk analisis dan SPC (Statistical Process Control).

#### 3.1 Database Schema

**File: `prisma/schema.prisma`**

```prisma
model ProcessParameterLog {
  id              Int       @id @default(autoincrement())
  id_factory      Int
  id_machine      Int
  id_worksheet    Int?      // Link ke worksheet jika ada
  id_user         Int
  parameter_name  String    @db.VarChar(100)   // "temperature", "moisture_in", "moisture_out", "throughput_rate"
  parameter_value Decimal   @db.Decimal(15, 4)
  unit            String    @db.VarChar(20)    // "°C", "%", "kg/h", "bar"
  recorded_at     DateTime  @db.Timestamp(6)
  shift           String?   @db.VarChar(20)
  notes           String?
  created_at      DateTime  @default(now()) @db.Timestamp(6)

  Factory         Factory   @relation(fields: [id_factory], references: [id])
  Machine         Machine   @relation(fields: [id_machine], references: [id])
  Worksheet       Worksheet? @relation(fields: [id_worksheet], references: [id])
  User            User      @relation(fields: [id_user], references: [id])

  @@index([id_machine, recorded_at])
  @@index([parameter_name])
  @@index([id_worksheet])
}
```

#### 3.2 Backend Files Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `types/model/table/ProcessParameterLog.ts` | TypeORM entity stub |
| 2 | `src/repositories/process-parameter-log.repository.ts` | CRUD + time-series queries + aggregate stats |
| 3 | `src/services/process-parameter-log.service.ts` | Batch create (multiple params at once), stats aggregation (avg, min, max, stdev) |
| 4 | `types/api/T_createProcessParameterLog.ts` | POST /process-params |
| 5 | `types/api/T_getProcessParameterLogs.ts` | GET /process-params |
| 6 | `types/api/T_getProcessParameterLog.ts` | GET /process-params/:id |
| 7 | `types/api/T_deleteProcessParameterLog.ts` | DELETE /process-params/:id |
| 8 | `types/api/T_batchCreateProcessParams.ts` | POST /process-params/batch — create multiple at once |
| 9 | `types/api/T_getProcessParameterStats.ts` | GET /process-params/stats — aggregated data for charts |
| 10-15 | `implementation/T_*.ts` (6 files) | Handlers |

#### 3.3 Frontend

**File baru: `frontend/src/pages/reports/ProcessParameters.tsx`**
- Time-series line charts (Recharts) per parameter per mesin
- Filter: mesin, parameter name, date range
- Table view: raw data log
- SPC indicators: mean line, Upper/Lower Control Limits (opsional)

**File baru (opsional): `frontend/src/pages/production/ProcessParamInput.tsx`**
- Quick input form untuk operator: pilih mesin → isi parameter values → submit
- Designed for mobile/tablet use on the shop floor

#### 3.4 Verifikasi Fase 3

```bash
npx prisma db push
npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

### FASE 4: Batch Genealogy View (Estimasi: Medium, Prioritas: MEDIUM)

**Tujuan**: Visualisasi tree traceability — trace forward (dari bahan baku → produk mana yang dihasilkan) dan trace backward (dari produk jadi → bahan baku mana yang dipakai).

#### 4.1 Backend

**Tidak perlu tabel baru** — data sudah lengkap di tabel existing:
- `StockMovement` — movement IN/OUT dengan `batch_code`
- `WorksheetInputBatch` — batch apa yang dipakai sebagai input worksheet
- `WorksheetSideProduct` — side product dari worksheet
- `MaterialReceipt` — penerimaan bahan baku awal
- `Worksheet` — record produksi (input → output)

**File baru:**

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `src/services/batch-genealogy.service.ts` | `traceForward(batchCode)` dan `traceBackward(batchCode)` — recursive query melalui worksheet input/output |
| 2 | `types/api/T_getBatchGenealogy.ts` | GET /batch-genealogy/:batchCode — return tree structure |
| 3 | `types/api/T_searchBatches.ts` | GET /batch-genealogy/search?q=... — cari batch code |
| 4 | `implementation/T_getBatchGenealogy.ts` | auth: OPERATOR |
| 5 | `implementation/T_searchBatches.ts` | auth: OPERATOR |

**Return format untuk genealogy:**
```typescript
interface GenealogyNode {
  type: 'MATERIAL_RECEIPT' | 'WORKSHEET' | 'OUTPUT' | 'SIDE_PRODUCT';
  batch_code: string;
  product_name: string;
  quantity: number;
  date: string;
  factory: string;
  children: GenealogyNode[];  // Forward trace
  parents: GenealogyNode[];   // Backward trace
}
```

#### 4.2 Frontend

**File baru: `frontend/src/pages/inventory/BatchGenealogy.tsx`**
- Search bar: cari batch code (autocomplete)
- Tree view: visualisasi node-node (Material Receipt → Worksheet → Output → Worksheet → Output)
- Klik node: panel detail (tanggal, quantity, QC result, mesin)
- Toggle: Forward trace / Backward trace
- Color coding: green = OK, yellow = warning, red = NCR attached

#### 4.3 Verifikasi Fase 4

```bash
npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

### FASE 5: Production Scheduling Board (Estimasi: Complex, Prioritas: LOW)

**Tujuan**: Visual timeline/kanban untuk menjadwalkan Work Order — drag-drop, resource allocation, capacity planning.

#### 5.1 Frontend Only (MVP — No New Backend)

**Backend**: Gunakan endpoint existing:
- `GET /work-orders` dengan filter date range, factory, status
- `PUT /work-orders/:id` untuk update `planned_start_date`, `planned_end_date`

**File baru: `frontend/src/pages/production/ProductionScheduling.tsx`**
- **Timeline view**: sumbu X = waktu (hari/minggu), sumbu Y = production line
- Work Order ditampilkan sebagai horizontal bar di timeline
- Filter: factory, status, priority
- Drag-drop untuk reschedule (update planned_start_date/end_date via PUT API)
- Color-coded by priority: LOW=gray, MEDIUM=blue, HIGH=amber, URGENT=red
- Color-coded by status: PLANNED=outline, IN_PROGRESS=solid, COMPLETED=green

**Library suggestion**: Bisa pakai Recharts custom bar chart, atau pure CSS grid timeline. Avoid heavy libs seperti dhtmlx-gantt.

#### 5.2 Verifikasi Fase 5

```bash
cd frontend && npx tsc --noEmit
```

---

### FASE 6: Shift Handover Log (Estimasi: Medium, Prioritas: LOW)

**Tujuan**: Digital log serah terima shift — operator shift keluar mencatat status produksi, masalah, dan pending items untuk shift masuk.

#### 6.1 Database Schema

**File: `prisma/schema.prisma`**

```prisma
model ShiftHandover {
  id                  Int       @id @default(autoincrement())
  id_factory          Int
  id_user_outgoing    Int       // Operator shift keluar
  id_user_incoming    Int?      // Operator shift masuk (diisi saat acknowledged)
  shift_date          DateTime  @db.Date
  shift_outgoing      String    @db.VarChar(20)   // PAGI, SIANG, MALAM
  shift_incoming      String    @db.VarChar(20)
  production_summary  String?                      // Ringkasan produksi shift ini
  issues              String?                      // Masalah yang terjadi
  pending_items       String?                      // Items yang belum selesai
  machine_status      Json?                        // { "DRY-01": "OK", "HLR-01": "Issue: vibration tinggi" }
  safety_notes        String?
  acknowledged_at     DateTime? @db.Timestamp(6)   // null = belum di-acknowledge shift masuk
  created_at          DateTime  @default(now()) @db.Timestamp(6)
  updated_at          DateTime  @updatedAt @db.Timestamp(6)

  Factory             Factory   @relation(fields: [id_factory], references: [id])
  OutgoingUser        User      @relation("ShiftOutgoing", fields: [id_user_outgoing], references: [id])
  IncomingUser        User?     @relation("ShiftIncoming", fields: [id_user_incoming], references: [id])

  @@index([id_factory, shift_date])
  @@unique([id_factory, shift_date, shift_outgoing])  // 1 handover per shift per factory
}
```

Tambah relasi di `Factory`, `User` (2 relasi: ShiftOutgoing, ShiftIncoming).

#### 6.2 Backend Files Baru

| # | File | Deskripsi |
|---|------|-----------|
| 1 | `types/model/table/ShiftHandover.ts` | TypeORM entity stub |
| 2 | `src/repositories/shift-handover.repository.ts` | CRUD + filter by factory, date, shift |
| 3 | `src/services/shift-handover.service.ts` | Create, acknowledge (shift masuk confirms), audit |
| 4 | `types/api/T_createShiftHandover.ts` | POST /shift-handovers |
| 5 | `types/api/T_getShiftHandovers.ts` | GET /shift-handovers |
| 6 | `types/api/T_getShiftHandover.ts` | GET /shift-handovers/:id |
| 7 | `types/api/T_acknowledgeShiftHandover.ts` | PATCH /shift-handovers/:id/acknowledge |
| 8 | `implementation/T_createShiftHandover.ts` | auth: OPERATOR |
| 9 | `implementation/T_getShiftHandovers.ts` | auth: OPERATOR |
| 10 | `implementation/T_getShiftHandover.ts` | auth: OPERATOR |
| 11 | `implementation/T_acknowledgeShiftHandover.ts` | auth: OPERATOR |

#### 6.3 Frontend

**File baru: `frontend/src/pages/production/ShiftHandover.tsx`**
- List handover logs per factory, filter tanggal
- Badge: "Belum di-acknowledge" (merah) vs "Acknowledged" (hijau)
- Form create: production summary, issues (text area), pending items, machine status checklist (auto-populate dari Machine list), safety notes
- Acknowledge button: shift masuk klik untuk confirm telah membaca

#### 6.4 Verifikasi Fase 6

```bash
npx prisma db push
npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

## Urutan Eksekusi (Ringkasan)

| # | Fase | Depends On | File Baru | File Modif | Prioritas |
|---|------|------------|-----------|------------|-----------|
| **0** | **Rebranding & Cleanup** | - | ~1 | ~8 | ⚡ CRITICAL |
| **1** | **Downtime Tracking** | Fase 0 | ~16 | ~5 | 🔴 HIGH |
| **2** | **Non-Conformance Report** | Fase 0 | ~20 | ~5 | 🔴 HIGH |
| **3** | **Process Parameter Log** | Fase 0 | ~14 | ~4 | 🟡 MEDIUM |
| **4** | **Batch Genealogy View** | Fase 0 | ~5 | ~3 | 🟡 MEDIUM |
| **5** | **Production Scheduling Board** | Fase 0 | ~1 | ~2 | 🟢 LOW |
| **6** | **Shift Handover Log** | Fase 0 | ~12 | ~4 | 🟢 LOW |
| | **TOTAL** | | **~69** | **~31** | |

> **Fase 0 HARUS dikerjakan pertama.** Fase 1-6 independen satu sama lain dan bisa dikerjakan dalam urutan apapun setelah Fase 0.

---

## Referensi Pattern Codebase

Untuk agent yang mengeksekusi plan ini, berikut referensi file pattern yang harus diikuti:

| Komponen | File Referensi |
|----------|---------------|
| **API Type (GET list)** | `types/api/T_getWorkOrders.ts` |
| **API Type (GET by id)** | `types/api/T_getWorkOrder.ts` |
| **API Type (POST create)** | `types/api/T_createWorkOrder.ts` |
| **API Type (PUT update)** | `types/api/T_updateWorkOrder.ts` |
| **API Type (DELETE)** | `types/api/T_deleteWorkOrder.ts` |
| **API Type (PATCH status)** | `types/api/T_updateWorkOrderStatus.ts` |
| **Implementation handler** | `implementation/T_createWorkOrder.ts` |
| **Repository** | `src/repositories/work-order.repository.ts` |
| **Service** | `src/services/work-order.service.ts` |
| **Module types** | `src/modules/production/work-order/work-order.types.ts` |
| **Module constants** | `src/modules/production/work-order/work-order.constants.ts` |
| **TypeORM entity stub** | `types/model/table/WorkOrder.ts` |
| **Frontend CRUD page** | `frontend/src/pages/production/WorkOrders.tsx` |
| **Frontend API module** | `frontend/src/services/api.ts` → `workOrderApi` |
| **Sidebar structure** | `frontend/src/components/Layout/Sidebar.tsx` |
| **Route registration** | `frontend/src/App.tsx` |
| **Event types** | `src/events/event-types.ts` |
| **Event listener** | `src/events/listeners/work-order.listener.ts` |

---

## Verifikasi Akhir (Setelah Semua Fase)

1. `npx prisma db push` — schema valid
2. `npx tsc --noEmit` — 0 TypeScript errors backend
3. `cd frontend && npx tsc --noEmit` — 0 TypeScript errors frontend
4. Server start tanpa crash
5. Sidebar menampilkan navigasi MES (bukan ERP)
6. Semua route MES berfungsi
7. Route non-MES return 404
8. Dashboard = Production Control Center (tanpa financial data)
9. Update `CHANGELOG.md` dan `DEVLOG.md`
