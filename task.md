# Task List — ERP Pangan Masa Depan

> **Last Updated**: 2026-02-13
> **Current Version**: 2.2.0

Legend: `[ ]` Belum | `[~]` Sedang Dikerjakan | `[x]` Selesai | `[-]` Dibatalkan

---

## Modul yang Sudah Selesai

- [x] **Core Production** — Worksheet, Stok, Mesin, Maintenance, OEE
- [x] **Quality Control** — ML Grain Analysis, Kalibrasi HSV, Grading
- [x] **Dashboard** — KPI, Grafik Produksi, Machine Summary, Inventory Snapshot
- [x] **Penerimaan Bahan Baku** — Raw Material Receipt + QC Integration
- [x] **Modul Penjualan (v2.1.0)** — Customer, Invoice, Payment, Stock Deduction
- [x] **Modul Pembelian (v2.2.0)** — Purchase Order, Goods Receipt, Stock Integration
- [x] **Cloud Deployment (v2.1.1)** — Railway (Backend/ML), Vercel (Frontend), SSL, Custom Port
- [x] **Authentication** — Login, Register, Role-based Access (5 level)
- [x] **Multi-Factory** — Support PMD-1 & PMD-2
- [x] **Settings** — Supplier, Product Type, Quality Config
- [x] **Halaman Laporan (v2.2.0)** — Production, Sales, COGM, Stock Report + Charts + Export
- [x] **Notifikasi & Alert (v2.2.0)** — Low Stock, Overdue Invoice, Overdue Maintenance + UI Dropdown
- [x] **Export Excel (v2.2.0)** — Excel download untuk Production, Sales, Stock Report

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

### 2.1 Halaman Laporan Terpadu (v2.2.0)
> 4 halaman report lengkap dengan chart, KPI, dan export.

- [x] Backend: Implementasi `T_getSalesSummary` — query invoices, aggregate by customer
- [x] Backend: Implementasi `T_getCOGMReport` — query worksheets, aggregate production costs
- [x] Backend: Tipe + implementasi `T_getStockReport` — stock movements by type & product
- [x] Frontend: `pages/reports/ProductionReport.tsx` — KPI, BarChart output breakdown, CSV + Excel
- [x] Frontend: `pages/reports/SalesReport.tsx` — KPI, PieChart revenue by customer, CSV + Excel
- [x] Frontend: `pages/reports/COGMReport.tsx` — KPI (biaya, output, HPP/kg), PieChart breakdown, CSV
- [x] Frontend: `pages/reports/StockReport.tsx` — KPI (IN/OUT/net), BarChart by product, CSV + Excel
- [-] ~~Frontend: `pages/reports/ExpenseReport.tsx`~~ — dibatalkan (keuangan di luar scope)
- [x] Frontend: `App.tsx` — route `/reports/*` (4 lazy imports)
- [x] Frontend: `Sidebar.tsx` — tambah section "Laporan" dengan 4 menu
- [x] Frontend: `api.ts` — tambah `reportApi` (7 methods: 4 JSON + 3 Excel download)

### 2.2 Notifikasi & Alert System (v2.2.0)
> Persistent notifications dengan UI dropdown di header.

- [x] Database: Model `Notification` + enum `Notification_type_enum` + `Notification_severity_enum`
- [x] Database: Prisma migration `add_notification`
- [x] Backend: Repository `notification.repository.ts` — CRUD, unread count, duplicate check
- [x] Backend: Service `notification.service.ts` — `checkAndCreateAlerts()` (low stock, overdue invoice, overdue maintenance)
- [x] Backend: 5 API endpoints — `T_getNotifications`, `T_getNotificationCount`, `T_markNotificationRead`, `T_markAllNotificationsRead`, `T_checkNotifications`
- [x] Frontend: `Header.tsx` — notification bell dengan badge counter, dropdown panel, polling 60s
- [x] Frontend: `api.ts` — tambah `notificationApi` (5 methods)
- [x] Rules: Stok < 30% avg → warning/critical, Invoice overdue → warning/critical, Maintenance overdue → warning/critical

### 2.3 Export Excel untuk Laporan (v2.2.0)
> Digabung dengan 2.1 — Excel export di halaman laporan.

- [x] Backend: Install `exceljs`
- [x] Backend: Service `excel.service.ts` — generic `createWorkbook()` helper
- [x] Backend: Endpoint `GET /reports/production-summary/excel`
- [x] Backend: Endpoint `GET /reports/sales-summary/excel`
- [x] Backend: Endpoint `GET /reports/stock-report/excel`
- [x] Frontend: Tombol "Export Excel" di setiap halaman laporan (Production, Sales, Stock)

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
| Cloud Deployment | `[x]` Selesai | - | 100% | 100% | v2.1.1 |
| Purchase Order | `[x]` Selesai | Ya | 100% | 100% | v2.2.0 |
| Export PDF Invoice | `[x]` Selesai | - | 100% | 100% | v2.1.0 |
| Halaman Laporan | `[x]` Selesai | Ya | 100% | 100% | v2.2.0 |
| Notifikasi | `[x]` Selesai | Ya | 100% | 100% | v2.2.0 |
| Export Excel | `[x]` Selesai | - | 100% | 100% | v2.2.0 |
| User Management | `[ ]` Belum | Ya | 0% | 0% | - |
| Quality Trends | `[ ]` Belum | Ya | 0% | 0% | - |
| Audit Log | `[ ]` Belum | Belum | 0% | 0% | - |
| Mobile/PWA | `[ ]` Belum | - | - | 0% | - |
| ~~Pengeluaran Harian~~ | `[-]` Dibatalkan | - | - | - | Out of scope |
| ~~Absensi Karyawan~~ | `[-]` Dibatalkan | - | - | - | Out of scope |

---

## Catatan

- **Scope Aplikasi**: Penerimaan Bahan Baku, Produksi, Inventory, Maintenance, Sales saja. HRD dan Keuangan menggunakan aplikasi pihak ketiga.
- **DB Ready = Ya** berarti schema Prisma sudah ada, tinggal buat API + frontend
- Modul dengan DB Ready biasanya effort lebih kecil (tidak perlu migration)
- Urutan implementasi bisa disesuaikan dengan kebutuhan bisnis
- Setiap modul yang selesai, update status di tabel dan checklist di atas
