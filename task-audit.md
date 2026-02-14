# Task Audit — ERP Pangan Masa Depan

> **Last Updated**: 2026-02-14
> **Audit Version**: v2.2.0
> **Detail Plan**: Lihat `AUDIT-FIX-PLAN.md` untuk code snippets dan instruksi lengkap

Legend: `[ ]` Belum | `[~]` Sedang Dikerjakan | `[x]` Selesai

---

## Batch 1 — CRITICAL + HIGH

> Harus dikerjakan paling awal. Task 3 harus selesai sebelum Task 4 & 5.

### 1. [CRITICAL] Hapus Hardcoded Seed Secret
- [ ] `implementation/T_seedSuperuser.ts` — Hapus fallback `'P4ng4nM4s4D3p4nJ4y4!'`, throw error jika env tidak di-set

### 2. [HIGH] Fix cancelInvoice Stock Reversal Bug
- [ ] `src/services/invoice.service.ts` — Di `updateInvoice`, panggil `cancelInvoice` SEBELUM update status ke CANCELLED
- [ ] `src/services/invoice.service.ts` — Di `cancelInvoice`, ubah guard agar throw error jika sudah CANCELLED (bukan return silently)

### 3. [HIGH] Refactor StockService — Accept Transaction Client ⚠️ BLOCKING
- [ ] `src/services/stock.service.ts` — Tambah type `PrismaTransactionClient`
- [ ] `src/services/stock.service.ts` — Tambah `tx?` ke `UpdateStockDTO` interface
- [ ] `src/services/stock.service.ts` — Refactor `updateStock()` — jika `tx` diberikan gunakan itu, jika tidak buat transaction baru
- [ ] `src/services/stock.service.ts` — Tambah `tx?` parameter ke `addStock()` dan `removeStock()`

### 4. [HIGH] Fix Invoice Service — Single Transaction (depends: Task 3)
- [ ] `src/services/invoice.service.ts` — `cancelInvoice`: pass `tx` ke `stockService.addStock`
- [ ] `src/services/invoice.service.ts` — `deleteInvoice`: bungkus seluruh operasi (stock reversal + delete) dalam 1 `$transaction`
- [ ] `src/services/invoice.service.ts` — `addItem`: bungkus stock deduction + recalculate dalam 1 transaction
- [ ] `src/services/invoice.service.ts` — `removeItem`: bungkus stock reversal + recalculate dalam 1 transaction

### 5. [HIGH] Fix PO Service — Single Transaction (depends: Task 3)
- [ ] `src/services/purchase-order.service.ts` — `receiveGoods`: pass `tx` ke `stockService.addStock`
- [ ] `src/services/purchase-order.service.ts` — `deletePO`: bungkus seluruh operasi dalam 1 transaction
- [ ] `src/services/purchase-order.service.ts` — `cancelPO`: bungkus seluruh operasi dalam 1 transaction
- [ ] `src/services/purchase-order.service.ts` — `deleteGoodsReceipt`: pass `tx` ke `stockService.removeStock`

### 6. [HIGH] Fix Invoice/PO Number Race Condition
- [ ] `src/services/invoice.service.ts` — Pindahkan `invoice.count()` + number generation ke DALAM `$transaction`
- [ ] `src/services/purchase-order.service.ts` — Pindahkan PO number generation ke DALAM `$transaction`
- [ ] `src/services/purchase-order.service.ts` — Pindahkan GR number generation ke DALAM `$transaction`

### 7. [HIGH] Install & Configure Helmet
- [ ] `npm install helmet`
- [ ] `index.ts` — Tambah `import helmet` dan `server.express.use(helmet({...}))`

---

## Batch 2 — MEDIUM (Security & Data Integrity)

> Bisa dikerjakan parallel setelah Batch 1 selesai.

### 8. Restrict Public Registration
- [ ] `implementation/T_register.ts` — Tambah check `DISABLE_PUBLIC_REGISTRATION` env var
- [ ] Set `DISABLE_PUBLIC_REGISTRATION=true` di production environment (Railway)

### 9. Pagination Hard Cap
- [ ] `src/repositories/invoice.repository.ts` — `Math.min(params.limit || 25, 200)`
- [ ] `src/repositories/worksheet.repository.ts` — sama
- [ ] `src/repositories/customer.repository.ts` — sama
- [ ] `src/repositories/supplier.repository.ts` — sama
- [ ] `src/repositories/stock.repository.ts` — sama
- [ ] `src/repositories/user.repository.ts` — sama

### 10. Fix CSRF Protection
- [ ] `implementation/T_login.ts` — Ubah `sameSite` cookie sesuai deployment (lax jika same-domain, origin check jika cross-domain)
- [ ] `index.ts` — Opsional: tambah origin validation middleware untuk state-changing requests

### 11. Perkuat Password Policy
- [ ] `src/services/auth.service.ts` — Buat `validatePassword()` helper (min 8 char, huruf kapital, angka)
- [ ] `src/services/auth.service.ts` — Gunakan di `register()` dan `changePassword()`

### 12. Add Database Indexes
- [ ] `prisma/schema.prisma` — `@@index([id_invoice])` di `InvoiceItem`
- [ ] `prisma/schema.prisma` — `@@index([id_purchase_order])` di `PurchaseOrderItem`
- [ ] `prisma/schema.prisma` — `@@index([id_goods_receipt])` di `GoodsReceiptItem`
- [ ] `prisma/schema.prisma` — `@@index([id_invoice])` di `Payment`
- [ ] `prisma/schema.prisma` — `@@index([id_stock])` dan `@@index([reference_type, reference_id])` di `StockMovement`
- [ ] `prisma/schema.prisma` — `@@index([id_user, is_read])` dan `@@index([type, reference_type, reference_id])` di `Notification`
- [ ] Jalankan `npx prisma migrate dev --name add_indexes`

### 13. Fix Error Handling di Manual Express Routes
- [ ] `index.ts` — Route `/invoices/:id/pdf`: hanya expose `error.message` untuk `AppError`, generic message untuk lainnya
- [ ] `index.ts` — Route Excel exports (3 routes): sama
- [ ] `index.ts` — Route `/auth/logout`: sama

### 14. Fix apiWrapper Logging
- [ ] `src/utils/apiWrapper.ts` — Pindahkan `require('fs')` ke top-level `import`
- [ ] `src/utils/apiWrapper.ts` — Ganti `appendFileSync` dengan `appendFile` (async)
- [ ] `src/utils/apiWrapper.ts` — Jangan expose error details untuk non-AppError ke client

---

## Batch 3 — MEDIUM (Performance & Frontend)

### 15. Fix Dashboard Maintenance Query
- [ ] `src/services/dashboard.service.ts` — `getMaintenanceData()`: tambah parameter `factoryId?`
- [ ] `src/services/dashboard.service.ts` — `getMaintenanceData()`: tambah WHERE clause + `take: 100`
- [ ] `src/services/dashboard.service.ts` — Pass `factoryId` di pemanggilan dalam `Promise.all`

### 16. Fix Dashboard Sequential Query
- [ ] `src/services/dashboard.service.ts` — Pindahkan `getScheduleToday` ke dalam `Promise.all` (parallel)

### 17. Fix Notification N+1 Query
- [ ] `src/services/notification.service.ts` — `checkLowStock`: batch fetch recent notifications + `createMany`
- [ ] `src/services/notification.service.ts` — `checkOverdueInvoices`: sama
- [ ] `src/services/notification.service.ts` — `checkOverdueMaintenance`: sama

### 18. Sembunyikan Dummy Data Buttons di Production
- [ ] `frontend/src/pages/Settings.tsx` — Wrap tab "Data" dengan `import.meta.env.DEV` atau role check `SUPERUSER`

### 19. Fix Dashboard dateRange
- [ ] `frontend/src/pages/dashboard/Dashboard.tsx` — Tambah `dateRange` ke useEffect dependency
- [ ] `frontend/src/pages/dashboard/Dashboard.tsx` — Pass `days` ke API call
- [ ] `frontend/src/services/api.ts` — Update `dashboardApi.getExecutive` terima params
- [ ] `src/services/dashboard.service.ts` — `getExecutiveDashboard`: tambah parameter `days`
- [ ] `implementation/T_getExecutiveDashboard.ts` — Parse `req.query.days` dan pass ke service

### 20. Add AdminRoute Role Guard
- [ ] `frontend/src/App.tsx` — Buat komponen `AdminRoute` (cek role ADMIN/SUPERUSER)
- [ ] `frontend/src/App.tsx` — Wrap route `/admin/users` dengan `AdminRoute`

---

## Frontend Quality (LOW — Nice to Have)

### 21. Accessibility
- [ ] Semua form: tambah `htmlFor` pada `<label>` dan `id` pada input
- [ ] Semua modal: tambah `role="dialog"` dan `aria-modal="true"`
- [ ] Sidebar: tambah `role="navigation"`

### 22. Code Cleanup
- [ ] Hapus `@hugeicons/core-free-icons` dan `@hugeicons/react` dari `package.json` (tidak dipakai)
- [ ] Fix typo ErrorBoundary: "Has Refresh Page" → "Muat Ulang Halaman"
- [ ] Ganti `console.error` langsung dengan `logger.error` di `SalesReport.tsx`, `StockReport.tsx`, `ErrorBoundary.tsx`
- [ ] Pindahkan duplicated `formatNumber`/`formatCurrency`/`formatDate` ke `formatUtils.ts`, import dari sana

### 23. Dead UI Elements
- [ ] `Login.tsx` — Hapus atau implementasi "Lupa password?" link
- [ ] `Login.tsx` — Hapus atau implementasi "Ingat saya" checkbox
- [ ] `Header.tsx` — Hapus atau implementasi search bar

### 24. CSS Cleanup
- [ ] `index.css` — Hapus duplicate rules (`.grid-2`, `.grid-3`, `.grid-4`, `@keyframes slideUp`, `@keyframes fadeIn`)
- [ ] `index.css` — Tambah `@keyframes spin` (dipakai di PageLoader tapi belum didefinisikan)
- [ ] Standarisasi z-index scale (buat comment/variable reference)

---

## Backend Quality (LOW — Nice to Have)

### 25. Type Safety
- [ ] Ganti `tx: any` dengan `Prisma.TransactionClient` di `worksheet.service.ts`, `invoice.service.ts`
- [ ] Ganti `where: any` dengan proper Prisma types di `dashboard.service.ts`
- [ ] Ganti `req: any, res: any` dengan proper Express types di `apiWrapper.ts`

### 26. Cleanup Out-of-Scope Models
- [ ] Evaluasi apakah model `Attendance`, `Employee`, `DailyExpense`, `ExpenseCategory` di schema perlu dihapus
- [ ] Jika dihapus: buat migration, hapus implementation files terkait

### 27. Miscellaneous
- [ ] `index.ts` — Ganti inline `require('./src/libs/prisma')` di Excel routes dengan existing import
- [ ] `index.ts` — BigInt serialization: ganti `Number(this)` dengan `this.toString()` untuk preserve precision
- [ ] Standarisasi default pagination (25) di `base.repository.ts`
- [ ] Hapus unused DTO classes di `src/dto/` atau wire up class-validator

---

## Progress Tracker

| Batch | Total Tasks | Selesai | Progress |
|-------|-------------|---------|----------|
| Batch 1 (Critical+High) | 7 | 0 | 0% |
| Batch 2 (Medium Security) | 7 | 0 | 0% |
| Batch 3 (Medium Perf) | 6 | 0 | 0% |
| Frontend Quality (Low) | 4 | 0 | 0% |
| Backend Quality (Low) | 3 | 0 | 0% |
| **TOTAL** | **27** | **0** | **0%** |

---

## Catatan

- **Dependency**: Task 3 (StockService refactor) harus selesai sebelum Task 4 dan 5
- **Migration**: Task 12 membutuhkan `prisma migrate dev` — koordinasi dengan deployment
- **Testing**: Setelah Batch 1, test menyeluruh invoice & PO flow (create, cancel, delete) dan cek stock consistency
- **Detail lengkap**: Lihat `AUDIT-FIX-PLAN.md` untuk code snippets per task
