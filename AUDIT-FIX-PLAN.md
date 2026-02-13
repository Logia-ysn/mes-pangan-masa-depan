# Audit Fix Plan — ERP Pangan Masa Depan v2.2.1

## Context

Kamu akan memperbaiki bug dan security issues yang ditemukan dari audit keseluruhan aplikasi ERP. Aplikasi ini berbasis Node.js + Express + Prisma (backend) dan React 19 (frontend).

### Tech Stack
- **Backend**: Node.js + Express + NAIV framework + Prisma ORM + PostgreSQL
- **Frontend**: React 19 + Vite 7 + React Router 7 + Plain CSS
- **Auth**: JWT httpOnly cookie, role hierarchy: OPERATOR < SUPERVISOR < MANAGER < ADMIN < SUPERUSER

### Urutan Fix
Fix dibagi menjadi 3 batch berdasarkan severity dan dependency antar task:

- **Batch 1** (CRITICAL + HIGH — harus dikerjakan duluan): Task 1–7
- **Batch 2** (MEDIUM — security & data): Task 8–14
- **Batch 3** (MEDIUM — performance & code quality): Task 15–20

---

## BATCH 1 — CRITICAL + HIGH

### Task 1: [CRITICAL] Hapus Hardcoded Seed Secret

**File**: `implementation/T_seedSuperuser.ts`

**Current** (line 10):
```typescript
const SEED_SECRET = process.env.SEED_SECRET || 'P4ng4nM4s4D3p4nJ4y4!';
```

**Fix**: Hapus fallback. Jika env var tidak ada, tolak request.
```typescript
const SEED_SECRET = process.env.SEED_SECRET;
// Di dalam handler, sebelum logic lain:
if (!SEED_SECRET) {
    return res.status(503).json({
        success: false,
        error: { message: 'SEED_SECRET environment variable is not configured' }
    });
}
```

---

### Task 2: [HIGH] Fix cancelInvoice Stock Reversal Bug

**File**: `src/services/invoice.service.ts`

**Bug**: `updateInvoice` (line 169) update status ke CANCELLED dulu, baru panggil `cancelInvoice` (line 173). Tapi `cancelInvoice` (line 196-198) cek `if (invoice.status === CANCELLED) return` — jadi stock reversal TIDAK PERNAH jalan.

**Fix**: Panggil `cancelInvoice` SEBELUM update status, atau ubah flow:

```typescript
// Di method updateInvoice, sekitar line 165-174
// SEBELUM:
// await prisma.invoice.update({ where: { id }, data: updateData });
// if (data.status === Invoice_status_enum.CANCELLED) {
//     await this.cancelInvoice(id, userId);
// }

// SESUDAH:
if (data.status === Invoice_status_enum.CANCELLED) {
    // Panggil cancelInvoice DULU (yang akan handle stock reversal + update status)
    return await this.cancelInvoice(id, userId);
}
// Update biasa (bukan cancel)
const updated = await prisma.invoice.update({
    where: { id },
    data: updateData,
    include: { InvoiceItem: { include: { ProductType: true } }, Customer: true, Payment: true }
});
return updated;
```

Dan di `cancelInvoice` (line 196-198), ubah guard check:
```typescript
// SEBELUM:
// if (invoice.status === Invoice_status_enum.CANCELLED) return invoice;

// SESUDAH — cek bahwa invoice BELUM cancelled:
if (invoice.status === Invoice_status_enum.CANCELLED) {
    throw new ValidationError('Invoice sudah dibatalkan sebelumnya');
}
```

---

### Task 3: [HIGH] Refactor StockService — Accept Transaction Client

Ini task terbesar dan paling penting. Semua bug DI-01, DI-03 bergantung pada fix ini.

**File**: `src/services/stock.service.ts`

**Step 1**: Tambah type untuk transaction client di bagian atas file:
```typescript
import { PrismaClient, Prisma } from '@prisma/client';

type PrismaTransactionClient = Prisma.TransactionClient;
```

**Step 2**: Ubah `UpdateStockDTO` interface (sekitar line 12) — tambah optional `tx`:
```typescript
interface UpdateStockDTO {
    factoryId: number;
    productCode: string;
    quantity: number;
    userId: number;
    type: 'IN' | 'OUT' | 'ADJUSTMENT';
    referenceType?: string;
    referenceId?: number;
    tx?: PrismaTransactionClient;  // BARU
}
```

**Step 3**: Ubah method `updateStock` (line 52) — jika `tx` diberikan, gunakan itu; jika tidak, buat transaction baru:
```typescript
async updateStock(dto: UpdateStockDTO): Promise<Stock | null> {
    const execute = async (client: PrismaTransactionClient) => {
        // Pindahkan SEMUA logic yang ada di dalam prisma.$transaction ke sini
        // Gunakan `client` sebagai pengganti `tx`

        // ... existing logic dari line 65-120 ...
        // Ganti semua `tx.stock.findFirst`, `tx.stock.create`, dll
        // menjadi `client.stock.findFirst`, `client.stock.create`, dll
    };

    // Jika tx diberikan dari caller, gunakan langsung
    if (dto.tx) {
        return await execute(dto.tx);
    }
    // Jika tidak, buat transaction baru (backward compatible)
    return await prisma.$transaction(async (tx) => {
        return await execute(tx);
    });
}
```

**Step 4**: Ubah `addStock` dan `removeStock` — tambah optional `tx` parameter:
```typescript
// addStock (line 123)
async addStock(
    factoryId: number,
    productCode: string,
    quantity: number,
    userId: number,
    referenceType?: string,
    referenceId?: number,
    tx?: PrismaTransactionClient      // BARU
): Promise<Stock | null> {
    return this.updateStock({
        factoryId, productCode, quantity, userId,
        type: 'IN',
        referenceType, referenceId,
        tx,                            // BARU — pass through
    });
}

// removeStock (line 145) — sama, tambah tx parameter
async removeStock(
    factoryId: number,
    productCode: string,
    quantity: number,
    userId: number,
    referenceType?: string,
    referenceId?: number,
    tx?: PrismaTransactionClient      // BARU
): Promise<Stock | null> {
    return this.updateStock({
        factoryId, productCode, quantity, userId,
        type: 'OUT',
        referenceType, referenceId,
        tx,                            // BARU — pass through
    });
}
```

> **PENTING**: Semua caller yang TIDAK pass `tx` tetap bekerja seperti sebelumnya (backward compatible).

---

### Task 4: [HIGH] Fix Invoice Service — Gunakan Single Transaction

Setelah Task 3 selesai, update `src/services/invoice.service.ts`:

**4a: Fix `cancelInvoice`** (line 200-219) — pass `tx` ke stockService:
```typescript
return await prisma.$transaction(async (tx) => {
    for (const item of invoice.InvoiceItem) {
        await stockService.addStock(
            invoice.id_factory,
            item.ProductType.code,
            Number(item.quantity),
            userId,
            'INVOICE_CANCELLED',
            invoice.id,
            tx                    // BARU — pass transaction
        );
    }
    return await tx.invoice.update({
        where: { id },
        data: { status: Invoice_status_enum.CANCELLED }
    });
});
```

**4b: Fix `deleteInvoice`** (line 225-258) — bungkus semua dalam 1 transaction:
```typescript
async deleteInvoice(id: number, userId: number) {
    const invoice = await this.getInvoiceById(id);

    return await prisma.$transaction(async (tx) => {
        // Stock reversal dalam transaction yang sama
        if (invoice.status !== Invoice_status_enum.CANCELLED) {
            for (const item of invoice.InvoiceItem) {
                await stockService.addStock(
                    invoice.id_factory,
                    item.ProductType.code,
                    Number(item.quantity),
                    userId,
                    'INVOICE_DELETE_REVERSAL',
                    invoice.id,
                    tx                    // pass transaction
                );
            }
        }
        // Delete dalam transaction yang sama
        await tx.payment.deleteMany({ where: { id_invoice: id } });
        await tx.invoiceItem.deleteMany({ where: { id_invoice: id } });
        await tx.invoice.delete({ where: { id } });

        return { success: true, message: 'Invoice deleted successfully' };
    });
}
```

**4c: Fix `addItem`** (line 264) dan **`removeItem`** (line 320) — bungkus dalam transaction, pass `tx`:

```typescript
// addItem
async addItem(invoiceId: number, itemData: any, userId: number) {
    return await prisma.$transaction(async (tx) => {
        const item = await tx.invoiceItem.create({ data: { ... } });
        await stockService.removeStock(
            ..., tx    // pass transaction
        );
        // Recalculate totals dalam tx
        await this.recalculateInvoiceTotal(invoiceId, tx);
        return item;
    });
}

// removeItem — sama pattern
```

---

### Task 5: [HIGH] Fix Purchase Order Service — Gunakan Single Transaction

Setelah Task 3 selesai, update `src/services/purchase-order.service.ts`:

**5a: Fix `receiveGoods`** (line 343) — pass `tx` ke stockService:
```typescript
const receipt = await prisma.$transaction(async (tx) => {
    // ... existing create receipt logic using tx ...

    await stockService.addStock(
        po.id_factory,
        poItem.ProductType.code,
        item.quantity_received,
        userId,
        'GOODS_RECEIPT',
        createdReceipt.id,
        tx                    // BARU
    );
    // ... rest of logic ...
});
```

**5b: Fix `deletePO`** (line 171-196) — bungkus semua dalam 1 transaction:
```typescript
async deletePO(id: number, userId: number) {
    const po = await this.getPOById(id);

    return await prisma.$transaction(async (tx) => {
        // Stock reversal
        for (const receipt of po.GoodsReceipt) {
            for (const receiptItem of receipt.GoodsReceiptItem) {
                const poItem = po.PurchaseOrderItem.find(i => i.id === receiptItem.id_purchase_order_item);
                if (poItem) {
                    await stockService.removeStock(
                        po.id_factory,
                        poItem.ProductType.code,
                        Number(receiptItem.quantity_received),
                        userId,
                        'GOODS_RECEIPT_REVERSAL',
                        receipt.id,
                        tx            // BARU
                    );
                }
            }
        }
        // Deletes
        await tx.goodsReceiptItem.deleteMany({ where: { GoodsReceipt: { id_purchase_order: id } } });
        await tx.goodsReceipt.deleteMany({ where: { id_purchase_order: id } });
        await tx.purchaseOrderItem.deleteMany({ where: { id_purchase_order: id } });
        await tx.purchaseOrder.delete({ where: { id } });

        return { success: true };
    });
}
```

**5c: Fix `cancelPO`** (line 240-268) — sama pattern, bungkus dalam transaction + pass `tx`.

**5d: Fix `deleteGoodsReceipt`** (line 416-445) — pass `tx` ke stockService.

---

### Task 6: [HIGH] Fix Invoice/PO Number Race Condition

**File**: `src/services/invoice.service.ts` (lines 50-60)
**File**: `src/services/purchase-order.service.ts` (lines 53-60, 333-340)

**Problem**: Invoice number generation (`count` + format) terjadi di LUAR transaction. Dua concurrent request bisa dapat nomor yang sama.

**Fix**: Pindahkan count ke DALAM transaction. Contoh untuk invoice:

```typescript
// SEBELUM (di luar transaction):
// const invoiceCountToday = await prisma.invoice.count({...});
// const invoice_number = `INV-${dateStr}-${seq}`;

// SESUDAH (di dalam $transaction):
const result = await prisma.$transaction(async (tx) => {
    const invoiceCountToday = await tx.invoice.count({
        where: {
            invoice_date: { gte: startOfDay, lt: endOfDay }
        }
    });
    const seq = (invoiceCountToday + 1).toString().padStart(4, '0');
    const invoice_number = `INV-${dateStr}-${seq}`;

    // ... create invoice and items ...
    return invoice;
});
```

Lakukan hal yang sama untuk:
- PO number di `purchase-order.service.ts` line 53-60
- GR number di `purchase-order.service.ts` line 333-340

---

### Task 7: [HIGH] Install & Configure Helmet

**File**: `index.ts`

**Step 1**: Install helmet
```bash
npm install helmet
```

**Step 2**: Di `index.ts`, tambahkan setelah import section:
```typescript
import helmet from 'helmet';
```

**Step 3**: Tambahkan sebelum CORS middleware (sebelum line 27):
```typescript
server.express.use(helmet({
    contentSecurityPolicy: false, // Disable CSP karena frontend di domain berbeda
    crossOriginEmbedderPolicy: false,
}));
```

---

## BATCH 2 — MEDIUM (Security & Data)

### Task 8: Restrict Public Registration

**File**: `implementation/T_register.ts`

Dua opsi (pilih salah satu):

**Opsi A (Recommended)**: Tambah flag environment untuk disable registration
```typescript
export const t_register: T_register = apiWrapper(async (req, res) => {
    if (process.env.DISABLE_PUBLIC_REGISTRATION === 'true') {
        return res.status(403).json({
            success: false,
            error: { message: 'Registrasi publik dinonaktifkan. Hubungi admin.' }
        });
    }
    // ... existing logic ...
});
```

Set `DISABLE_PUBLIC_REGISTRATION=true` di production environment.

**Opsi B**: Hapus endpoint register sepenuhnya, ganti dengan admin-created accounts (dari User Management Page).

---

### Task 9: Tambah Pagination Hard Cap

**File-file yang perlu diubah**:
- `src/repositories/invoice.repository.ts` (line 54)
- `src/repositories/worksheet.repository.ts` (line 124)
- `src/repositories/customer.repository.ts`
- `src/repositories/supplier.repository.ts`
- `src/repositories/stock.repository.ts`
- `src/repositories/user.repository.ts`

**Pattern fix** — di setiap repository yang punya pagination:
```typescript
// SEBELUM:
take: params.limit || 100,

// SESUDAH:
take: Math.min(params.limit || 25, 200),
```

Standarisasi default = 25, max = 200 di semua repository.

Opsional: Tambah constant di `src/repositories/base.repository.ts`:
```typescript
export const DEFAULT_PAGE_SIZE = 25;
export const MAX_PAGE_SIZE = 200;
```

---

### Task 10: Fix CSRF — Ubah SameSite Cookie

**File**: `implementation/T_login.ts` (cari bagian `res.cookie`)

**Current**: `sameSite: 'none'` di production (memungkinkan cross-site request)

**Fix**: Jika frontend dan backend di domain yang sama, ubah ke:
```typescript
sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
```

Jika frontend dan backend di domain berbeda (Vercel + Railway), maka `sameSite: 'none'` diperlukan. Dalam kasus ini, pertimbangkan menambah CSRF token atau menggunakan custom header check:

```typescript
// Di index.ts, tambah middleware CSRF sederhana (Double Submit Cookie pattern):
server.express.use((req, res, next) => {
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
    const origin = req.headers.origin;
    if (origin && !origin.includes(FRONTEND_URL.replace('https://', '').replace('http://', ''))) {
        return res.status(403).json({ error: 'CSRF check failed' });
    }
    next();
});
```

---

### Task 11: Perkuat Password Policy

**File**: `src/services/auth.service.ts`

**Buat helper function** di atas class:
```typescript
function validatePassword(password: string): void {
    if (password.length < 8) {
        throw new ValidationError('Password minimal 8 karakter');
    }
    if (!/[A-Z]/.test(password)) {
        throw new ValidationError('Password harus mengandung huruf kapital');
    }
    if (!/[0-9]/.test(password)) {
        throw new ValidationError('Password harus mengandung angka');
    }
}
```

**Gunakan di 2 tempat**:
- `register()` (line 70-73) — ganti check lama dengan `validatePassword(dto.password)`
- `changePassword()` (line 128-130) — ganti dengan `validatePassword(dto.newPassword)`

---

### Task 12: Add Database Indexes

**File**: `prisma/schema.prisma`

Tambahkan index pada foreign key yang sering di-query:

```prisma
model InvoiceItem {
    // ... existing fields ...
    @@index([id_invoice])
}

model PurchaseOrderItem {
    // ... existing fields ...
    @@index([id_purchase_order])
}

model GoodsReceiptItem {
    // ... existing fields ...
    @@index([id_goods_receipt])
}

model Payment {
    // ... existing fields ...
    @@index([id_invoice])
}

model StockMovement {
    // ... existing fields ...
    @@index([id_stock])
    @@index([reference_type, reference_id])
}

model Notification {
    // ... existing fields ...
    @@index([id_user, is_read])
    @@index([type, reference_type, reference_id])
}
```

Setelah edit, jalankan:
```bash
npx prisma migrate dev --name add_indexes
```

---

### Task 13: Fix Error Handling di Manual Express Routes

**File**: `index.ts` (lines 89-106, 109-158, 215-262)

Di setiap catch block pada route manual (PDF, Excel), ubah:

```typescript
// SEBELUM:
} catch (error: any) {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        error: { message: error.message || 'Internal server error' }
    });
}

// SESUDAH:
} catch (error: any) {
    if (error.statusCode) {
        // AppError — aman untuk ditampilkan ke client
        res.status(error.statusCode).json({
            success: false,
            error: { message: error.message }
        });
    } else {
        // Unexpected error — jangan expose detail
        console.error('Unexpected error:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Terjadi kesalahan internal' }
        });
    }
}
```

---

### Task 14: Fix apiWrapper Logging

**File**: `src/utils/apiWrapper.ts`

**14a**: Pindahkan `fs` import ke top-level:
```typescript
import fs from 'fs';
```

**14b**: Ganti `appendFileSync` dengan `appendFile` (async):
```typescript
// SEBELUM:
fs.appendFileSync(logFile, `\n[${...}] ...\n`);

// SESUDAH:
fs.appendFile(logFile, `\n[${new Date().toISOString()}] ${req.method || 'GET'} ${req.url || '/'}\n${error.stack || error}\n`, (err) => {
    if (err) console.error('Failed to write error log:', err);
});
```

**14c**: Jangan expose `details` untuk non-AppError:
```typescript
// Di catch block, untuk error yang BUKAN AppError:
res.status(500).json({
    success: false,
    error: {
        code: 'INTERNAL_ERROR',
        message: 'Terjadi kesalahan internal',
    }
});
```

---

## BATCH 3 — MEDIUM (Performance & Code Quality)

### Task 15: Fix Dashboard Maintenance Query

**File**: `src/services/dashboard.service.ts`

**15a**: Ubah signature `getMaintenanceData` (line 428):
```typescript
// SEBELUM:
private async getMaintenanceData(): Promise<MaintenancePanel> {

// SESUDAH:
private async getMaintenanceData(factoryId?: number): Promise<MaintenancePanel> {
```

**15b**: Tambah WHERE clause dan limit (line 432-435):
```typescript
// SEBELUM:
const maintenances = await prisma.maintenance.findMany({
    include: { Machine: true },
    orderBy: { maintenance_date: 'desc' }
});

// SESUDAH:
const where: any = {};
if (factoryId) {
    where.Machine = { id_factory: factoryId };
}
const maintenances = await prisma.maintenance.findMany({
    where,
    include: { Machine: true },
    orderBy: { maintenance_date: 'desc' },
    take: 100,  // Limit records
});
```

**15c**: Pass `factoryId` di pemanggilan (line 149):
```typescript
// SEBELUM:
this.getMaintenanceData(),

// SESUDAH:
this.getMaintenanceData(factoryId),
```

---

### Task 16: Fix Dashboard Sequential Query

**File**: `src/services/dashboard.service.ts`

Cari baris setelah `Promise.all` selesai (sekitar line 205) di mana `getScheduleToday` dipanggil sequential:

```typescript
// SEBELUM (sequential setelah Promise.all):
// schedule_today: await this.getScheduleToday(factoryId)

// SESUDAH — pindahkan ke DALAM Promise.all:
const [
    productionStats,
    yesterdayStats,
    trendData,
    machineData,
    stockData,
    maintenanceData,
    dailyTarget,
    downtimeData,
    scheduleToday        // BARU
] = await Promise.all([
    this.getProductionStats(factoryId, startOfToday),
    this.getProductionStats(factoryId, startOfYesterday, startOfToday),
    this.getProductionTrend(factoryId, 7),
    this.getMachineSummary(factoryId),
    this.getInventorySnapshot(factoryId),
    this.getMaintenanceData(factoryId),
    this.calculateDailyTarget(factoryId),
    this.getDowntimeFromWorksheets(factoryId, startOfToday),
    this.getScheduleToday(factoryId),    // BARU — parallel
]);
```

---

### Task 17: Fix Notification Service N+1 Query

**File**: `src/services/notification.service.ts`

**Ubah pattern di `checkLowStock`** (lines 37-72):

```typescript
async checkLowStock(userId: number, threshold: number = 30): Promise<number> {
    const stocks = await prisma.stock.findMany({
        include: { ProductType: true, Factory: true },
    });

    // BARU — batch fetch semua recent LOW_STOCK notifications sekaligus
    const recentNotifications = await prisma.notification.findMany({
        where: {
            id_user: userId,
            type: Notification_type_enum.LOW_STOCK,
            created_at: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // 24 jam terakhir
        },
        select: { reference_id: true }
    });
    const recentIds = new Set(recentNotifications.map(n => n.reference_id));

    let created = 0;
    const toCreate: any[] = [];

    for (const stock of stocks) {
        const qty = Number(stock.quantity);
        if (qty < threshold && !recentIds.has(stock.id)) {
            toCreate.push({
                id_user: userId,
                type: Notification_type_enum.LOW_STOCK,
                severity: qty === 0 ? 'CRITICAL' : 'WARNING',
                title: `Stok ${stock.ProductType.name} rendah`,
                message: `Stok di ${stock.Factory.name}: ${qty} kg`,
                reference_type: 'Stock',
                reference_id: stock.id,
            });
        }
    }

    // BARU — batch create
    if (toCreate.length > 0) {
        await prisma.notification.createMany({ data: toCreate });
        created = toCreate.length;
    }

    return created;
}
```

**Lakukan hal yang sama untuk**:
- `checkOverdueInvoices` (lines 75-108) — batch fetch recent OVERDUE_INVOICE notifications
- `checkOverdueMaintenance` (lines 111-146) — batch fetch recent OVERDUE_MAINTENANCE notifications

---

### Task 18: Frontend — Sembunyikan Dummy Data Buttons

**File**: `frontend/src/pages/Settings.tsx`

**Opsi A (Recommended)**: Sembunyikan tab "Data" berdasarkan environment:

Di bagian tab rendering (cari tab "Data" yang merender buttons), tambahkan conditional:
```tsx
{import.meta.env.DEV && (
    // ... existing "Data" tab content (Generate Dummy + Reset buttons) ...
)}
```

**Opsi B**: Sembunyikan berdasarkan role — hanya tampil untuk SUPERUSER:
```tsx
import { useAuth } from '../contexts/AuthContext';
// Di dalam component:
const { user } = useAuth();

// Di JSX tab list, conditional render tab "Data":
{user?.role === 'SUPERUSER' && (
    <button onClick={() => setActiveTab('data')}>Data</button>
)}
```

---

### Task 19: Frontend — Fix Dashboard dateRange

**File**: `frontend/src/pages/dashboard/Dashboard.tsx`

**19a**: Tambah `dateRange` ke useEffect dependency (line 92):
```typescript
// SEBELUM:
}, []);

// SESUDAH:
}, [dateRange]);
```

**19b**: Pass `dateRange` ke API call (line 83):
```typescript
// SEBELUM:
const response = await dashboardApi.getExecutive();

// SESUDAH:
const response = await dashboardApi.getExecutive({ days: Number(dateRange) });
```

**19c**: Update `dashboardApi` di `frontend/src/services/api.ts`:
```typescript
// SEBELUM:
getExecutive: () => api.get('/dashboard/executive'),

// SESUDAH:
getExecutive: (params?: { days?: number; id_factory?: number }) =>
    api.get('/dashboard/executive', { params }),
```

**19d**: Update backend `getExecutiveDashboard` di `src/services/dashboard.service.ts` (line 128):
```typescript
// SEBELUM:
async getExecutiveDashboard(factoryId?: number) {

// SESUDAH:
async getExecutiveDashboard(factoryId?: number, days: number = 7) {
```

Lalu gunakan `days` untuk menentukan range trend data:
```typescript
// Di dalam method, ganti hardcoded 7:
this.getProductionTrend(factoryId, days),  // bukan hardcode 7
```

**19e**: Update implementation handler untuk pass `days` dari query:
```typescript
// Di implementation/T_getExecutiveDashboard.ts:
const days = Number(req.query.days) || 7;
const result = await dashboardService.getExecutiveDashboard(factoryId, days);
```

---

### Task 20: Frontend — Fix Role Guard pada Admin Routes

**File**: `frontend/src/App.tsx`

Buat komponen `AdminRoute` sederhana:
```tsx
const AdminRoute = ({ children }: { children: React.ReactNode }) => {
    const { user } = useAuth();
    if (!user || !['ADMIN', 'SUPERUSER'].includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    return <>{children}</>;
};
```

Gunakan di route admin:
```tsx
<Route path="admin">
    <Route path="users" element={<AdminRoute><Users /></AdminRoute>} />
</Route>
```

---

## File yang Dimodifikasi (Ringkasan)

| File | Task | Aksi |
|------|------|------|
| `implementation/T_seedSuperuser.ts` | 1 | Edit — hapus hardcoded secret |
| `src/services/stock.service.ts` | 3 | Edit — tambah `tx` parameter |
| `src/services/invoice.service.ts` | 2, 4 | Edit — fix cancel bug + transaction |
| `src/services/purchase-order.service.ts` | 5, 6 | Edit — fix transaction + number gen |
| `index.ts` | 7, 10, 13 | Edit — helmet, CSRF, error handling |
| `implementation/T_register.ts` | 8 | Edit — restrict registration |
| `src/repositories/*.ts` (6 files) | 9 | Edit — pagination cap |
| `src/services/auth.service.ts` | 11 | Edit — password policy |
| `prisma/schema.prisma` | 12 | Edit — add indexes |
| `src/utils/apiWrapper.ts` | 14 | Edit — fix logging |
| `src/services/dashboard.service.ts` | 15, 16 | Edit — maintenance query + parallel |
| `src/services/notification.service.ts` | 17 | Edit — batch queries |
| `frontend/src/pages/Settings.tsx` | 18 | Edit — hide dummy buttons |
| `frontend/src/pages/dashboard/Dashboard.tsx` | 19 | Edit — fix dateRange |
| `frontend/src/services/api.ts` | 19 | Edit — dashboard params |
| `frontend/src/App.tsx` | 20 | Edit — AdminRoute guard |
| `implementation/T_login.ts` | 10 | Edit — sameSite cookie |
| `implementation/T_getExecutiveDashboard.ts` | 19 | Edit — accept days param |

## Urutan Pengerjaan

```
Batch 1 (CRITICAL + HIGH):
  Task 1  → independent, bisa duluan
  Task 3  → HARUS selesai sebelum Task 4 dan 5
  Task 2  → bisa parallel dengan Task 3
  Task 4  → depends on Task 3
  Task 5  → depends on Task 3
  Task 6  → bisa parallel dengan Task 4/5
  Task 7  → independent (npm install + edit index.ts)

Batch 2 (MEDIUM Security):
  Task 8–14 → semua independent, bisa parallel

Batch 3 (MEDIUM Perf):
  Task 15–16 → related (dashboard), kerjakan bareng
  Task 17    → independent
  Task 18–20 → frontend, bisa parallel
```

## Testing Checklist

Setelah semua fix:
- [ ] `npm run build` backend — no TypeScript errors
- [ ] `npm run build` frontend — no TypeScript errors
- [ ] Test create invoice → cek stock berkurang
- [ ] Test cancel invoice → cek stock kembali
- [ ] Test delete invoice → cek stock kembali, data bersih
- [ ] Test create PO → receive goods → cek stock bertambah
- [ ] Test cancel PO → cek stock dikembalikan
- [ ] Test delete PO → cek stock dikembalikan, data bersih
- [ ] Test concurrent invoice creation → no duplicate numbers
- [ ] Test login → cek security headers (X-Content-Type-Options, etc.)
- [ ] Test register dengan `DISABLE_PUBLIC_REGISTRATION=true` → ditolak
- [ ] Test password < 8 char → ditolak
- [ ] Test password tanpa huruf kapital → ditolak
- [ ] Test dashboard 7 hari vs 30 hari → data berubah
- [ ] Test Settings page di production → tab "Data" tersembunyi
- [ ] Test `/admin/users` sebagai OPERATOR → redirect ke home
- [ ] `npx prisma migrate dev` → migration berhasil
