# Task List — ERP Pangan Masa Depan

> **Last Updated**: 2026-02-13
> **Current Version**: 2.1.0

Legend: `[ ]` Belum | `[~]` Sedang Dikerjakan | `[x]` Selesai | `[-]` Dibatalkan

---

## Modul yang Sudah Selesai

- [x] **Core Production** — Worksheet, Stok, Mesin, Maintenance, OEE
- [x] **Quality Control** — ML Grain Analysis, Kalibrasi HSV, Grading
- [x] **Dashboard** — KPI, Grafik Produksi, Machine Summary, Inventory Snapshot
- [x] **Penerimaan Bahan Baku** — Raw Material Receipt + QC Integration
- [x] **Modul Penjualan (v2.1.0)** — Customer, Invoice, Payment, Stock Deduction
- [x] **Authentication** — Login, Register, Role-based Access (5 level)
- [x] **Multi-Factory** — Support PMD-1 & PMD-2
- [x] **Settings** — Supplier, Product Type, Quality Config
- [x] **Modul Pembelian (v2.2.0)** — Purchase Order, Goods Receipt, Stock Integration

---

## Prioritas 1 — Core Business Gaps

### ~~1.1 Pengeluaran Harian (Daily Expense UI)~~ — DIBATALKAN
> **Alasan**: Keuangan sudah menggunakan aplikasi pihak ketiga. Di luar scope aplikasi ini.

- [-] Dibatalkan — semua task

### 1.2 Export PDF Invoice
> Cetak invoice untuk dikirim ke customer.

- [x] Backend: Install `pdfkit` + `@types/pdfkit`
- [x] Backend: Service `pdf.service.ts` — generate invoice PDF (header, customer info, items table, summary, payments, notes, footer)
- [x] Backend: API endpoint `GET /invoices/:id/pdf` (direct Express route di `index.ts`, auth required)
- [x] Frontend: Tombol "Cetak PDF" di `InvoiceDetail.tsx` + download sebagai file

### ~~1.3 Modul Absensi Karyawan (Attendance UI)~~ — DIBATALKAN
> **Alasan**: HRD sudah menggunakan aplikasi pihak ketiga. Di luar scope aplikasi ini.

- [-] Dibatalkan — semua task

### 1.4 Modul Pembelian (Purchase Order)
> Schema DB baru: `PurchaseOrder`, `PurchaseOrderItem`, `GoodsReceipt`, `GoodsReceiptItem`

- [x] Database: Design schema — 4 model + enum `PurchaseOrder_status_enum`
- [x] Database: Prisma migration `add_purchase_order`
- [x] Backend: Repository `purchase-order.repository.ts`, `goods-receipt.repository.ts`
- [x] Backend: Service `purchase-order.service.ts` — create PO, approve, cancel, receive goods → auto stock IN, delete receipt → stock reversal
- [x] Backend: API types (12 files) — PO CRUD, approve, cancel, GoodsReceipt CRUD, stats
- [x] Backend: API implementations (12 files)
- [x] Frontend: `api.ts` — tambah `purchaseOrderApi`, `goodsReceiptApi`
- [x] Frontend: `App.tsx` — route `/purchasing/purchase-orders`, `/purchasing/purchase-orders/:id`
- [x] Frontend: `Sidebar.tsx` — tambah section "Pembelian"
- [x] Frontend: `pages/purchasing/PurchaseOrders.tsx` — list + create modal + stats
- [x] Frontend: `pages/purchasing/PurchaseOrderDetail.tsx` — detail + goods receipt + receive modal

---

## Prioritas 2 — Operational Excellence

### 2.1 Halaman Laporan Terpadu
> Endpoint report sudah ada: `production-summary`, `sales-summary`, `cogm`. Belum ada halaman.

- [ ] Frontend: `pages/reports/ProductionReport.tsx` — laporan produksi harian/mingguan/bulanan
- [ ] Frontend: `pages/reports/SalesReport.tsx` — penjualan per customer/produk/periode
- [ ] Frontend: `pages/reports/COGMReport.tsx` — HPP per batch/produk
- [ ] Frontend: `pages/reports/StockReport.tsx` — rekap stok masuk/keluar per periode
- [-] ~~Frontend: `pages/reports/ExpenseReport.tsx`~~ — dibatalkan (keuangan di luar scope)
- [ ] Frontend: `App.tsx` — route `/reports/*`
- [ ] Frontend: `Sidebar.tsx` — tambah section "Laporan"
- [ ] Export Excel (semua laporan) — install `xlsx` atau `exceljs`

### 2.2 Notifikasi & Alert System
> Trigger: stok rendah, invoice jatuh tempo, maintenance terlewat.

- [ ] Backend: Service `notification.service.ts` — check thresholds
- [ ] Backend: API `GET /notifications` — list notifikasi aktif
- [ ] Frontend: Badge counter di sidebar/header
- [ ] Frontend: Dropdown/panel notifikasi
- [ ] Rules: Stok < threshold → warning, Invoice overdue → alert, Maintenance overdue → alert

### 2.3 Export Excel untuk Laporan
> Bisa digabung dengan 2.1 atau standalone.

- [ ] Backend: Install `exceljs`
- [ ] Backend: Endpoint `GET /reports/production-summary/excel`
- [ ] Backend: Endpoint `GET /reports/sales-summary/excel`
- [ ] Backend: Endpoint `GET /reports/stock-movements/excel`
- [ ] Frontend: Tombol "Export Excel" di setiap halaman laporan

---

## Prioritas 3 — Nice to Have

### 3.1 User Management Page
> Endpoint CRUD user sudah ada. Belum ada halaman admin.

- [ ] Frontend: `pages/admin/Users.tsx` — list user, assign role, toggle active
- [ ] Frontend: `pages/admin/Users.tsx` — reset password user lain (admin only)
- [ ] Frontend: `App.tsx` — route `/admin/users`
- [ ] Frontend: `Sidebar.tsx` — tambah menu "Admin" (visible hanya untuk ADMIN+)

### 3.2 Quality Trending / SPC Charts
> Data QC sudah tersimpan. Perlu visualisasi trend.

- [ ] Backend: API `GET /quality-analysis/trends` — aggregate per periode/supplier
- [ ] Frontend: `pages/production/QualityTrends.tsx` — line chart kualitas per waktu
- [ ] Frontend: Filter per supplier, varietas, periode
- [ ] Frontend: Alert jika kualitas menurun dari supplier tertentu

### 3.3 Audit Log Viewer
> Tracking siapa melakukan apa.

- [ ] Database: Tabel `AuditLog` (user, action, entity, entity_id, timestamp, details)
- [ ] Backend: Middleware audit logging
- [ ] Backend: API `GET /audit-logs`
- [ ] Frontend: `pages/admin/AuditLog.tsx` — tabel log + filter

### 3.4 Mobile-Responsive / PWA
> Operator di lantai produksi butuh akses mobile.

- [ ] Frontend: Responsive CSS untuk semua halaman
- [ ] Frontend: PWA manifest + service worker
- [ ] Frontend: Offline-capable input worksheet
- [ ] Testing: Test di berbagai ukuran layar

---

## Progress Tracker

| Modul | Status | DB Ready | Backend | Frontend | Target |
|-------|--------|----------|---------|----------|--------|
| ~~Pengeluaran Harian~~ | `[-]` Dibatalkan | - | - | - | Out of scope (Keuangan) |
| Export PDF Invoice | `[x]` Selesai | - | 100% | 100% | - |
| ~~Absensi Karyawan~~ | `[-]` Dibatalkan | - | - | - | Out of scope (HRD) |
| Purchase Order | `[x]` Selesai | Ya | 100% | 100% | - |
| Halaman Laporan | `[ ]` Belum | Sebagian | 0% | 0% | - |
| Notifikasi | `[ ]` Belum | Belum | 0% | 0% | - |
| Export Excel | `[ ]` Belum | - | 0% | 0% | - |
| User Management | `[ ]` Belum | Ya | 0% | 0% | - |
| Quality Trends | `[ ]` Belum | Ya | 0% | 0% | - |
| Audit Log | `[ ]` Belum | Belum | 0% | 0% | - |
| Mobile/PWA | `[ ]` Belum | - | - | 0% | - |

---

## Catatan

- **Scope Aplikasi**: Penerimaan Bahan Baku, Produksi, Inventory, Maintenance, Sales saja. HRD dan Keuangan menggunakan aplikasi pihak ketiga.
- **DB Ready = Ya** berarti schema Prisma sudah ada, tinggal buat API + frontend
- Modul dengan DB Ready biasanya effort lebih kecil (tidak perlu migration)
- Urutan implementasi bisa disesuaikan dengan kebutuhan bisnis
- Setiap modul yang selesai, update status di tabel dan checklist di atas
