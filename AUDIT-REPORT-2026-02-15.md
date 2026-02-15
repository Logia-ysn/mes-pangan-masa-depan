# LAPORAN AUDIT SISTEM — ERP Pangan Masa Depan v2.2.0

**Tanggal Audit**: 15 Februari 2026
**Auditor**: Claude Opus 4.6
**Scope**: Backend, Frontend, ML Service, Infrastructure

---

## RINGKASAN EKSEKUTIF

| Area | CRITICAL | WARNING | INFO |
|------|----------|---------|------|
| Backend | 6 | 25 | 9 |
| Frontend | 6 | 32 | 10 |
| ML Service & Infra | 5 | 16 | 6 |
| **TOTAL** | **17** | **73** | **25** |

---

# FASE 1 — CRITICAL SECURITY FIXES (Quick Wins)

Semua fix di fase ini harus dilakukan PERTAMA karena menyangkut keamanan data.

---

## FIX-01: Patch password_hash leakage di getUsers [CRITICAL]

**File**: `implementation/T_getUsers.ts`
**Problem**: `getUsers` endpoint mengembalikan full User object tanpa `sanitizeUser()`, sehingga `password_hash` dikirim ke client.

**Fix**: Tambahkan mapping `sanitizeUser()` pada response:

```typescript
// implementation/T_getUsers.ts — line 26-28
// SEBELUM:
return {
  data: users,
  total,
  ...
};

// SESUDAH:
import { sanitizeUser } from "../utility/auth";
return {
  data: users.map(sanitizeUser),
  total,
  ...
};
```

**Alternatif (lebih baik)**: Tambahkan `select` di repository agar `password_hash` tidak pernah di-fetch:

```typescript
// src/repositories/user.repository.ts — method findWithFilters
// Tambahkan select clause yang exclude password_hash
select: {
  id: true,
  email: true,
  fullname: true,
  role: true,
  id_factory: true,
  created_at: true,
  updated_at: true,
  // JANGAN include password_hash
}
```

---

## FIX-02: Hapus hardcoded SEED_SECRET fallback [CRITICAL]

**File**: `implementation/T_seedSuperuser.ts`, line 10

```typescript
// SEBELUM:
const SEED_SECRET = process.env.SEED_SECRET || 'P4ng4nM4s4D3p4nJ4y4!';

// SESUDAH:
const SEED_SECRET = process.env.SEED_SECRET;
if (!SEED_SECRET) {
  throw new Error('SEED_SECRET environment variable is required');
}
```

**Tambahan**: Update `.env.example` untuk include `SEED_SECRET`.

---

## FIX-03: Disable/protect public registration [CRITICAL]

**File**: `implementation/T_register.ts`
**Problem**: `/auth/register` terbuka untuk siapapun. ERP internal seharusnya tidak bisa self-register.

**Opsi A — Disable sepenuhnya**:
```typescript
// implementation/T_register.ts — tambah di awal handler
if (process.env.NODE_ENV === 'production') {
  throw new ForbiddenError('Public registration is disabled. Contact admin.');
}
```

**Opsi B — Require admin token (lebih baik)**:
```typescript
// Ubah registration menjadi admin-only
const admin = await requireAuth(req, 'ADMIN');
// Lanjutkan create user dengan role dari body
```

---

## FIX-04: Disable hard-reset & seed endpoints di production [CRITICAL]

**File**: `implementation/T_hardReset.ts`
**File**: `implementation/T_seedSuperuser.ts`

Tambahkan guard di awal kedua handler:
```typescript
if (process.env.NODE_ENV === 'production') {
  throw new ForbiddenError('This endpoint is disabled in production');
}
```

Atau lebih baik, conditional register di `index.ts`:
```typescript
if (process.env.NODE_ENV !== 'production') {
  // register seed dan hard-reset routes
}
```

---

## FIX-05: Fix CORS wildcard di backend [WARNING → prevent CRITICAL]

**File**: `index.ts`, line 32

```typescript
// SEBELUM:
if (allowedOrigins.includes('*')) { ... }

// SESUDAH — tolak wildcard saat credentials mode:
const sanitizedOrigins = allowedOrigins.filter(o => o !== '*');
if (sanitizedOrigins.length === 0) {
  console.warn('WARNING: No valid CORS origins configured');
}
```

---

## FIX-06: ML Service — hapus CORS wildcard [CRITICAL]

**File**: `ml-service/app/main.py`, line 9-15

```python
# SEBELUM:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    ...
)

# SESUDAH — ML service hanya dipanggil server-to-server:
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3005").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "PUT"],
    allow_headers=["*"],
)
```

---

## FIX-07: ML Service — tambah file size limit [CRITICAL]

**File**: `ml-service/app/routers/analyze.py`, line 38-46

```python
# Tambahkan di awal handler setelah menerima file:
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

contents = await file.read()
if len(contents) > MAX_FILE_SIZE:
    raise HTTPException(status_code=413, detail="File too large. Max 10MB.")
```

**File**: `ml-service/app/models/requests.py`, line 10-13

```python
# Tambahkan max_length pada base64 field:
image_base64: str = Field(..., max_length=15_000_000)  # ~10MB in base64
```

---

## FIX-08: ML Service — jangan expose internal error details [CRITICAL]

**File**: `ml-service/app/routers/analyze.py`, line 46
**File**: `ml-service/app/routers/analyze_detailed.py`, line 48

```python
# SEBELUM:
except Exception as e:
    raise HTTPException(status_code=500, detail=str(e))

# SESUDAH:
import logging
logger = logging.getLogger(__name__)

except Exception as e:
    logger.error(f"Analysis failed: {str(e)}", exc_info=True)
    raise HTTPException(status_code=500, detail="Internal analysis error")
```

---

## FIX-09: Git cleanup — hapus file sensitif [CRITICAL]

**Jalankan commands berikut**:

```bash
cd /Users/yay/Project/erp-pangan-masa-depan

# Hapus database dumps dari tracking
git rm --cached backup_db_v2.5.0.sql
git rm --cached backup_db_v2.9.0.sql 2>/dev/null
git rm --cached backup_db_v2.9.2_final.sql 2>/dev/null

# Hapus log files dari tracking
git rm --cached backend.log 2>/dev/null
git rm --cached backend_migration.log 2>/dev/null
git rm --cached backend_restart.log 2>/dev/null
git rm --cached backend_debug.log 2>/dev/null
git rm --cached backend_transfer.log 2>/dev/null

# Hapus .DS_Store
git rm --cached .DS_Store 2>/dev/null
git rm --cached stitch_executive_dashboard/.DS_Store 2>/dev/null
```

**Update `.gitignore`** — tambahkan:
```gitignore
# Database backups
*.sql
backup_db_*

# Logs
*.log

# macOS
.DS_Store

# Environment
.env
.env.production
```

---

# FASE 2 — BACKEND BUSINESS LOGIC & DATA INTEGRITY

---

## FIX-10: Refactor stockService untuk menerima transaction parameter [CRITICAL]

**File**: `src/services/stock.service.ts`
**Problem**: `addStock()` dan `removeStock()` membuat transaction sendiri. Ketika dipanggil dari dalam transaction parent (invoice cancel, PO delete, dll), hasilnya tidak atomic.

**Fix**: Buat overloaded methods yang menerima `tx` (Prisma transaction client):

```typescript
// src/services/stock.service.ts

// Method yang menerima optional transaction client
async addStock(params: AddStockParams, tx?: PrismaTransactionClient) {
  const client = tx || prisma;
  // Gunakan client alih-alih prisma untuk semua queries
  // Jika tx tidak diberikan, buat transaction sendiri (backward compatible)
}

async removeStock(params: RemoveStockParams, tx?: PrismaTransactionClient) {
  const client = tx || prisma;
  // ...
}
```

**Kemudian update callers**:
- `src/services/invoice.service.ts` — `cancelInvoice`, `deleteInvoice`, `addItem`, `removeItem`
- `src/services/purchase-order.service.ts` — `cancelPO`, `deleteGoodsReceipt`

Pass `tx` dari parent transaction ke `stockService.addStock(params, tx)`.

---

## FIX-11: Fix invoice/PO number race condition [WARNING]

**File**: `src/services/invoice.service.ts`, lines 50-60
**File**: `src/services/purchase-order.service.ts`, lines 53-61

**Opsi A — Database sequence** (recommended):
```sql
CREATE SEQUENCE invoice_number_seq;
-- Gunakan nextval('invoice_number_seq') di query
```

**Opsi B — Retry on unique constraint violation**:
```typescript
async generateInvoiceNumber(): Promise<string> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const number = await this._generateNumber();
      return number;
    } catch (err) {
      if (isUniqueConstraintError(err) && attempt < 2) continue;
      throw err;
    }
  }
}
```

---

## FIX-12: Fix N+1 queries di notification service [WARNING]

**File**: `src/services/notification.service.ts`, lines 40-41, 75-108

```typescript
// SEBELUM (N+1): loop per stock → existsRecent()

// SESUDAH: batch check
async checkLowStock() {
  const stocks = await prisma.stock.findMany({ where: { quantity: { lt: threshold } } });

  // Batch fetch existing recent notifications
  const recentNotifs = await prisma.notification.findMany({
    where: {
      type: 'LOW_STOCK',
      created_at: { gte: twentyFourHoursAgo },
      reference_id: { in: stocks.map(s => s.id) }
    }
  });
  const existingIds = new Set(recentNotifs.map(n => n.reference_id));

  // Only create for stocks without recent notification
  const toCreate = stocks.filter(s => !existingIds.has(s.id));
  // Batch create...
}
```

Terapkan pattern yang sama untuk `checkOverdueInvoices` dan `checkOverdueMaintenance`.

---

## FIX-13: Missing database indexes [WARNING]

**File**: `prisma/schema.prisma`

Tambahkan index berikut:

```prisma
model InvoiceItem {
  // ... existing fields
  @@index([id_invoice])
}

model PurchaseOrderItem {
  // ... existing fields
  @@index([id_purchase_order])
}

model WorksheetInputBatch {
  // ... existing fields
  @@index([id_worksheet])
}

model WorksheetSideProduct {
  // ... existing fields
  @@index([id_worksheet])
}

model GoodsReceiptItem {
  // ... existing fields
  @@index([id_goods_receipt])
}
```

Kemudian jalankan: `npx prisma migrate dev --name add_missing_indexes`

---

## FIX-14: Rate limiter auth terlalu longgar [WARNING]

**File**: `index.ts`, line 72-86

```typescript
// SEBELUM:
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Terlalu tinggi untuk brute-force prevention
});

// SESUDAH:
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Max 15 login attempts per 15 min
  message: { error: 'Too many login attempts. Please try again later.' }
});
```

---

## FIX-15: Password minimum length & complexity [WARNING]

**File**: `src/services/auth.service.ts`, line 71

```typescript
// SEBELUM:
if (password.length < 6) throw new ValidationError('Password min 6 characters');

// SESUDAH:
if (password.length < 8) {
  throw new ValidationError('Password minimal 8 karakter');
}
if (!/[A-Z]/.test(password)) {
  throw new ValidationError('Password harus mengandung huruf kapital');
}
if (!/[0-9]/.test(password)) {
  throw new ValidationError('Password harus mengandung angka');
}
```

---

## FIX-16: Error classes — ganti `new Error()` dengan AppError [WARNING]

**Files**:
- `implementation/T_transferStock.ts`, line 14
- `implementation/T_resetUserPassword.ts`, lines 13, 19
- `implementation/T_createUserByAdmin.ts`, line 12

```typescript
// SEBELUM:
throw new Error('Insufficient stock');

// SESUDAH:
import { ValidationError } from '../src/utils/errors';
throw new ValidationError('Insufficient stock');
```

---

## FIX-17: BaseRepository.delete swallows errors [WARNING]

**File**: `src/repositories/base.repository.ts`, lines 69-78

```typescript
// SEBELUM:
async delete(id: number): Promise<boolean> {
  try {
    await this.model.delete({ where: { id } });
    return true;
  } catch {
    return false; // Hides FK constraint violations!
  }
}

// SESUDAH:
async delete(id: number): Promise<boolean> {
  try {
    await this.model.delete({ where: { id } });
    return true;
  } catch (error: any) {
    if (error.code === 'P2025') return false; // Not found — OK
    throw error; // Re-throw FK violations and other real errors
  }
}
```

---

## FIX-18: Hapus model & endpoints out-of-scope (Employee/Attendance/Expense) [WARNING]

**Hapus files**:
```
implementation/T_createEmployee.ts
implementation/T_getEmployees.ts
implementation/T_getEmployeeById.ts
implementation/T_getEmployeeDemographics.ts
implementation/T_updateEmployee.ts
implementation/T_deleteEmployee.ts
types/api/T_createEmployee.ts
types/api/T_getEmployees.ts
types/api/T_getEmployeeById.ts
types/api/T_getEmployeeDemographics.ts
types/api/T_updateEmployee.ts
types/api/T_deleteEmployee.ts
src/repositories/employee.repository.ts
```

**Prisma schema**: Hapus atau comment out model `Employee`, `Attendance`, `DailyExpense`, `ExpenseCategory`.
**Catatan**: Buat migration untuk drop tables jika sudah tidak dipakai.

---

# FASE 3 — FRONTEND FIXES

---

## FIX-19: Buat RoleGuard component untuk route protection [CRITICAL]

**Buat file baru**: `frontend/src/components/RoleGuard.tsx`

```tsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ROLE_HIERARCHY = { OPERATOR: 1, SUPERVISOR: 2, MANAGER: 3, ADMIN: 4, SUPERUSER: 5 };

interface RoleGuardProps {
  requiredRole: keyof typeof ROLE_HIERARCHY;
  children: React.ReactNode;
}

export default function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;

  const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY] || 0;
  const requiredLevel = ROLE_HIERARCHY[requiredRole];

  if (userLevel < requiredLevel) return <Navigate to="/" />;
  return <>{children}</>;
}
```

**Update `App.tsx`** — wrap admin routes:
```tsx
<Route path="/admin/users" element={
  <RoleGuard requiredRole="ADMIN"><UserManagement /></RoleGuard>
} />
```

---

## FIX-20: Buat shared types directory [CRITICAL — code quality]

**Buat file**: `frontend/src/types/index.ts`

```typescript
export interface Factory {
  id: number;
  code: string;
  name: string;
  address?: string;
}

export interface Machine {
  id: number;
  name: string;
  code: string;
  id_factory: number;
  status: string;
}

export interface User {
  id: number;
  email: string;
  fullname: string;
  role: string;
  id_factory?: number;
}

// ... tambahkan semua shared interfaces
```

Kemudian replace semua inline interface definitions di pages dengan import dari `types/`.

---

## FIX-21: Buat useFactory() custom hook [CRITICAL — code quality]

**Buat file**: `frontend/src/hooks/useFactory.ts`

```typescript
import { useState, useEffect } from 'react';
import { factoryApi } from '../services/api';
import type { Factory } from '../types';

export function useFactory() {
  const [factories, setFactories] = useState<Factory[]>([]);
  const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFactories = async () => {
      try {
        const res = await factoryApi.getAll();
        const data = res.data?.data || res.data || [];
        const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
        setFactories(pmdFactories);
        const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
        setSelectedFactory(pmd1?.id || pmdFactories[0]?.id || null);
      } catch (err) {
        console.error('Failed to fetch factories', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFactories();
  }, []);

  return { factories, selectedFactory, setSelectedFactory, loading };
}
```

**Update 8+ pages** untuk menggunakan hook ini alih-alih inline fetch logic:
- `Dashboard.tsx`, `Worksheets.tsx`, `Stocks.tsx`, `Maintenance.tsx`, `OEE.tsx`, `RawMaterialReceipt.tsx`, `WorksheetForm.tsx`, `Machines.tsx`

---

## FIX-22: Buat FactorySelector component [WARNING]

**Buat file**: `frontend/src/components/FactorySelector.tsx`

```tsx
import type { Factory } from '../types';

interface Props {
  factories: Factory[];
  selectedFactory: number | null;
  onSelect: (id: number) => void;
}

export default function FactorySelector({ factories, selectedFactory, onSelect }: Props) {
  return (
    <div className="factory-toggle">
      {factories.map(f => (
        <button
          key={f.id}
          className={`factory-btn ${selectedFactory === f.id ? 'active' : ''}`}
          onClick={() => onSelect(f.id)}
        >
          {f.name}
        </button>
      ))}
    </div>
  );
}
```

---

## FIX-23: Gunakan formatUtils.ts di semua pages [CRITICAL — code quality]

**File yang perlu diubah** — hapus inline `formatNumber`/`formatDate`/`formatCurrency` dan ganti dengan import:

```typescript
import { formatNumber, formatDate, formatCurrency } from '../../utils/formatUtils';
```

**Pages yang perlu diupdate**:
- `pages/production/Worksheets.tsx` (line 107-114)
- `pages/production/WorksheetDetail.tsx` (line 99-110)
- `pages/dashboard/Dashboard.tsx` (line 123-131)
- `pages/production/Stocks.tsx` (line 257-267)
- `pages/production/Maintenance.tsx` (line 172-187)
- `pages/production/OEE.tsx`

---

## FIX-24: Pindahkan Header ke Layout.tsx [WARNING]

**File**: `frontend/src/components/Layout/Layout.tsx`

```tsx
// Layout.tsx — render Header sekali di sini
import Header from './Header';
import { Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  // Gunakan route metadata atau mapping untuk title
  const location = useLocation();
  const title = getPageTitle(location.pathname); // Buat helper function

  return (
    <div className="layout">
      <Sidebar />
      <div className="main-content">
        <Header title={title} />
        <div className="page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
```

Kemudian **hapus** `<Header />` dari semua individual pages.
**Hapus juga** komentar "thinking notes" di Layout.tsx (line 5-24).

---

## FIX-25: Implementasi pagination [CRITICAL — performance]

Tambahkan pagination di halaman berikut:

1. **`Worksheets.tsx`** — saat ini limit 50, tanpa pagination UI
2. **`Stocks.tsx`** — limit 100, tanpa pagination
3. **`Customers.tsx`** — limit 500, tanpa pagination
4. **`Maintenance.tsx`** — tanpa limit
5. **`Machines.tsx`** — tanpa limit

**Pattern**:
```tsx
const [page, setPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const ITEMS_PER_PAGE = 20;

// Di fetch function:
const res = await api.getAll({ limit: ITEMS_PER_PAGE, offset: (page - 1) * ITEMS_PER_PAGE });
setTotalPages(Math.ceil(res.data.total / ITEMS_PER_PAGE));

// Di JSX — tambahkan pagination component di bawah table
```

---

## FIX-26: Fix hardcoded user ID di Maintenance [WARNING]

**File**: `frontend/src/pages/production/Maintenance.tsx`, line 114

```typescript
// SEBELUM:
id_user: 1

// SESUDAH:
const { user } = useAuth();
// ...
id_user: user.id
```

---

## FIX-27: Ganti alert() dan window.confirm() [WARNING]

**QCGabah.tsx line 61**:
```typescript
// SEBELUM:
alert(`Analysis Failed: ${errorMessage}`);

// SESUDAH:
toast.error(`Analisis gagal: ${errorMessage}`);
```

**Semua delete actions** — ganti `window.confirm()` dengan custom `<ConfirmDialog />` component (opsional, bisa dilakukan terakhir).

---

## FIX-28: Fix unused state variables [WARNING]

**File**: `pages/production/QCGabah.tsx`, line 8
```typescript
// Hapus _imageFile jika tidak dipakai:
const [, setImageFile] = useState<File | null>(null);
```

**File**: `pages/production/RawMaterialReceipt.tsx`, line 70
```typescript
// Hapus _productTypes jika tidak dipakai:
const [, setProductTypes] = useState<ProductType[]>([]);
```

---

## FIX-29: Fix Login dummy elements [WARNING]

**File**: `frontend/src/pages/auth/Login.tsx`

- Line 129: Hapus atau implement "Ingat saya" checkbox (connect ke cookie expiry)
- Line 132: Hapus `<a href="#">Lupa password?</a>` karena belum ada fitur reset password

---

## FIX-30: Dashboard — fix non-functional elements [WARNING]

**File**: `frontend/src/pages/dashboard/Dashboard.tsx`

- `dateRange` state (line 83) tidak dikirim ke API — fix: pass ke `dashboardApi.getExecutive({ ..., period: dateRange })`
- Export button (line 268-271) tidak punya onClick — fix: tambahkan handler atau hapus button

---

# FASE 4 — ML SERVICE & INFRASTRUCTURE

---

## FIX-31: Upgrade Python version [WARNING]

**File**: `ml-service/Dockerfile`, line 1

```dockerfile
# SEBELUM:
FROM python:3.9-slim

# SESUDAH:
FROM python:3.12-slim
```

Test compatibility terlebih dahulu.

---

## FIX-32: Tambahkan logging ke ML service [WARNING]

**File**: `ml-service/app/main.py`

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("ml-service")
```

Tambahkan `logger.info()` dan `logger.error()` di semua routers.

---

## FIX-33: Persist calibration state [WARNING]

**File**: `ml-service/app/services/calibration_store.py`

Ubah dari in-memory ke file-based atau database:

```python
import json
from pathlib import Path

CALIBRATION_FILE = Path("/app/data/calibration.json")

class CalibrationStore:
    def save(self):
        CALIBRATION_FILE.parent.mkdir(parents=True, exist_ok=True)
        CALIBRATION_FILE.write_text(json.dumps(self._state))

    def load(self):
        if CALIBRATION_FILE.exists():
            self._state = json.loads(CALIBRATION_FILE.read_text())
```

---

## FIX-34: Frontend Dockerfile — non-root user [WARNING]

**File**: `frontend/Dockerfile`

```dockerfile
# Setelah COPY ke nginx, tambahkan:
RUN chown -R nginx:nginx /usr/share/nginx/html
USER nginx
```

Atau gunakan `nginx:alpine-unprivileged` sebagai base image.

---

## FIX-35: Deep health checks [WARNING]

**Backend** (`index.ts`):
```typescript
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'healthy', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected' });
  }
});
```

**ML Service** (`health.py`):
```python
@router.get("/health")
async def health():
    try:
        import cv2
        return {"status": "healthy", "opencv": cv2.__version__}
    except Exception:
        return JSONResponse(status_code=503, content={"status": "unhealthy"})
```

---

## FIX-36: Setup minimal CI/CD [INFO → recommended]

**Buat file**: `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npx tsc --noEmit
      - run: npx prisma generate

  frontend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: frontend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - run: npm run build

  ml-service:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ml-service
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.12' }
      - run: pip install -r requirements.txt
      - run: python -c "from app.main import app; print('OK')"
```

---

# FASE 5 — CODE QUALITY & NICE-TO-HAVES

---

## FIX-37: Konsistensi bahasa UI [WARNING]

Standardisasi ke **Bahasa Indonesia** untuk semua UI text:
- Table headers: "TANGGAL", "TINDAKAN", "KETERANGAN" (bukan "DATE", "ACTIONS", "NOTES")
- Buttons: "Batal", "Simpan", "Hapus" (bukan "Cancel", "Save", "Delete")
- Form labels: standardisasi ke Indonesia

**Pages yang perlu diupdate**: `WorksheetForm.tsx`, `RawMaterialReceipt.tsx`, `QCGabah.tsx`, `OEE.tsx`

---

## FIX-38: Inconsistent API usage (direct api vs named modules) [WARNING]

**Files**: `Machines.tsx`, `Maintenance.tsx`, `OEE.tsx`, `Stocks.tsx`

Ganti semua `api.get('/machines')` menjadi `machineApi.getAll()`, `api.get('/maintenance')` menjadi `maintenanceApi.getAll()`, dst.

Jika named API module belum ada, buat di `frontend/src/services/api.ts`.

---

## FIX-39: Cleanup miscellaneous [INFO]

1. **Sinkronkan versi** — `frontend/package.json` versi 1.7.1 → update ke 2.2.0
2. **Hapus dead code** di `Header.tsx` — search input tanpa handler (line 131)
3. **Fix typo** di `ErrorBoundary.tsx` — "Has Refresh Page" → "Muat Ulang Halaman"
4. **Pindahkan** `@types/jsonwebtoken` dan `@types/pdfkit` ke devDependencies (backend `package.json`)
5. **Hapus console.log** di `implementation/T_createWorksheet.ts` line 28
6. **Hapus komentar "thinking notes"** di `Layout.tsx` line 5-24
7. **Pindahkan** PLAN.md files ke `docs/plans/` directory
8. **Fix** `ToastContext.tsx` interface mismatch — `showSuccess` message parameter harus optional di interface juga
9. **Ganti** `catch (err: any)` di `Login.tsx` line 27 dengan `catch (err: unknown)` + proper type guard

---

# CHECKLIST PELAKSANAAN

- [ ] **Fase 1**: Critical Security Fixes (FIX-01 s/d FIX-09)
- [ ] **Fase 2**: Backend Business Logic (FIX-10 s/d FIX-18)
- [ ] **Fase 3**: Frontend Fixes (FIX-19 s/d FIX-30)
- [ ] **Fase 4**: ML & Infra (FIX-31 s/d FIX-36)
- [ ] **Fase 5**: Code Quality (FIX-37 s/d FIX-39)

**Setelah setiap fase**: jalankan `npm run build` (backend & frontend) dan test manual untuk memastikan tidak ada regresi.

---

*Generated by Claude Opus 4.6 — 15 Februari 2026*
