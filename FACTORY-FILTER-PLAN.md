# Factory Filter/Toggle Implementation Plan — ERP Pangan Masa Depan

## Context

PMD memiliki **2 plant produksi** dengan alur berbeda:
- **PMD 1** (`code: 'PMD-1'`): Padi → Drying → GKG → Pecah Kulit (PK) → Glosor (jika dipoles). Atau input PK → Glosor.
- **PMD 2** (`code: 'PMD-2'`): PK/Glosor → Poles Batu → Poles Kebi → Sorter → Grading → Beras Akhir (Medium Super, Premium) → Finished Good.

Beberapa modul sudah punya factory toggle (Worksheets, Machines, 4 Report pages), tapi banyak yang belum. **Backend sudah mendukung `id_factory` filtering di hampir semua API** — yang perlu dikerjakan hanya **frontend factory toggle/filter UI**.

### Tech Stack
- **Frontend**: React 19 + Vite 7 + React Router 7 + Plain CSS (CSS Variables, dark/light theme)
- **Icons**: Material Symbols via `<span className="material-symbols-outlined">`
- **API Client**: Axios instance di `frontend/src/services/api.ts`

### Audit Saat Ini

| Modul | Backend `id_factory` | Frontend Filter UI | Status |
|-------|---------------------|-------------------|--------|
| Dashboard | ✅ `getExecutiveDashboard(factoryId?)` | ❌ Tidak ada | **PERLU** |
| Worksheets | ✅ | ✅ Toggle buttons | OK — skip |
| WorksheetForm | ✅ | ✅ Factory selector | OK — skip |
| Stocks | ✅ (factory relation) | ❌ Hardcoded `id_factory: 1` | **PERLU** |
| Machines | ✅ | ✅ Toggle buttons | OK — skip |
| Maintenance | ✅ (via Machine→Factory) | ❌ Tidak ada | **PERLU** |
| OEE | ✅ (via Machine→Factory) | ❌ Tidak ada | **PERLU** |
| RawMaterialReceipt | ~ (via Stock→Factory) | ❌ Tidak ada | **PERLU** |
| QC Gabah | ❌ Tidak ada relasi factory | ❌ | SKIP |
| Invoices | ✅ `id_factory` di API | ❌ List tidak filter | **PERLU** |
| PurchaseOrders | ✅ `id_factory` di API | ❌ List tidak filter | **PERLU** |
| Reports (4 halaman) | ✅ | ✅ Dropdown select | OK — skip |

---

## Pattern yang Harus Diikuti

Semua halaman yang sudah punya factory toggle menggunakan pattern ini (lihat `Worksheets.tsx` dan `Machines.tsx` sebagai referensi). **Gunakan pattern ini di semua task.**

### Interface Factory
```typescript
interface Factory {
    id: number;
    code: string;
    name: string;
}
```

### State & Fetch
```typescript
const [factories, setFactories] = useState<Factory[]>([]);
const [selectedFactory, setSelectedFactory] = useState<number | null>(null);

// Di useEffect mount:
const fetchFactories = async () => {
    try {
        const res = await factoryApi.getAll();
        const data = res.data?.data || res.data || [];
        const pmdFactories = data.filter((f: Factory) => f.code.startsWith('PMD'));
        setFactories(pmdFactories);
        // Default ke PMD-1
        const pmd1 = pmdFactories.find((f: Factory) => f.code === 'PMD-1');
        if (pmd1) setSelectedFactory(pmd1.id);
        else if (pmdFactories.length > 0) setSelectedFactory(pmdFactories[0].id);
    } catch (error) {
        logger.error('Error:', error);
    }
};
```

### UI Toggle Buttons
```tsx
{/* Factory Toggle — taruh di atas content, sebelum stats-grid atau card */}
<div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    <button
        className={`btn ${selectedFactory === null ? 'btn-primary' : 'btn-secondary'}`}
        onClick={() => setSelectedFactory(null)}
    >
        <span className="material-symbols-outlined icon-sm">apps</span>
        Semua
    </button>
    {factories.map(factory => (
        <button
            key={factory.id}
            className={`btn ${selectedFactory === factory.id ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setSelectedFactory(factory.id)}
        >
            <span className="material-symbols-outlined icon-sm">factory</span>
            {factory.name}
        </button>
    ))}
</div>
```

### Re-fetch saat factory berubah
```typescript
useEffect(() => {
    fetchData();
}, [selectedFactory]);
```

### Import
```typescript
import { factoryApi } from '../../services/api';
// factoryApi sudah ada di api.ts:
// export const factoryApi = {
//     getAll: (params?: Record<string, any>) => api.get('/factories', { params }),
//     ...
// };
```

---

## Task yang Harus Dikerjakan

### Task 1: Dashboard — Factory Toggle

**File**: `frontend/src/pages/dashboard/Dashboard.tsx`

Saat ini Dashboard tidak ada factory filter sama sekali. API backend sudah support via `dashboardApi.getExecutive({ id_factory })`.

**Yang perlu dilakukan:**

1. Tambah import `factoryApi` dari `../../services/api`:
```typescript
import { dashboardApi, factoryApi } from '../../services/api';
```

2. Tambah state factory:
```typescript
const [factories, setFactories] = useState<Factory[]>([]);
const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
```

3. Tambah interface `Factory` (lihat pattern di atas).

4. Tambah `fetchFactories()` — panggil di `useEffect` mount. Default ke PMD-1.

5. Ubah `useEffect` yang fetch dashboard data agar re-fetch saat `selectedFactory` berubah:
```typescript
useEffect(() => {
    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await dashboardApi.getExecutive(
                selectedFactory ? { id_factory: selectedFactory } : undefined
            );
            setData(response.data);
        } catch (error) {
            logger.error('Error fetching executive dashboard:', error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
}, [selectedFactory]);
```

6. Tambah UI toggle buttons **setelah `<Header>`** dan **sebelum KPI cards section**:
```tsx
<Header title="Dashboard" subtitle={`Overview produksi — ${selectedFactoryName || 'Semua Pabrik'}`} />
<div className="page-content">
    {/* Factory Toggle — TAMBAH DI SINI */}
    <div style={{ marginBottom: 24, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        ...toggle buttons...
    </div>
    {/* KPI Cards section yang sudah ada */}
```

7. Tambah computed value untuk subtitle:
```typescript
const selectedFactoryName = factories.find(f => f.id === selectedFactory)?.name;
```

> **Catatan**: `dashboardApi.getExecutive` sudah menerima `params?: { id_factory?: number }` di `api.ts` line 61. Backend `T_getExecutiveDashboard.ts` sudah extract `id_factory` dari query dan pass ke service.

---

### Task 2: Stocks — Factory Toggle + Fix Hardcoded Factory

**File**: `frontend/src/pages/production/Stocks.tsx`

Saat ini Stocks **tidak ada factory toggle** dan **hardcode `id_factory: 1`** di form submit (line 78). Harus diperbaiki.

**Yang perlu dilakukan:**

1. Tambah import `factoryApi`:
```typescript
import { stockApi, factoryApi } from '../../services/api';
```

2. Tambah state & interface `Factory`:
```typescript
const [factories, setFactories] = useState<Factory[]>([]);
const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
```

3. Tambah `fetchFactories()` di `useEffect` mount.

4. Ubah `fetchData()` agar pass `id_factory`:
```typescript
const fetchData = async () => {
    try {
        const [stocksRes, productTypesRes] = await Promise.all([
            stockApi.getAll({ limit: 100, id_factory: selectedFactory || undefined }),
            api.get('/product-types')
        ]);
        // ... rest sama
    }
};
```

5. Tambah `useEffect` yang re-fetch saat factory berubah:
```typescript
useEffect(() => {
    fetchData();
}, [selectedFactory]);
```

6. **FIX hardcoded `id_factory: 1`** di `handleSubmit`:
```typescript
// SEBELUM (line 78):
id_factory: 1

// SESUDAH:
id_factory: selectedFactory || 1
```

7. Saat edit, gunakan factory dari stock yang di-edit:
```typescript
// Di openEditModal, set selectedFactory sesuai stock:
const openEditModal = (stock: Stock) => {
    setEditingStock(stock);
    // ... existing code
};
```

8. Tambah UI toggle buttons setelah `<Header>` dan sebelum konten utama.

> **Catatan**: `stockApi.getAll` sudah menerima `params` sebagai `Record<string, any>` yang akan dikirim sebagai query params. Backend `T_getStocks` sudah extract `id_factory` dan filter.

---

### Task 3: Maintenance — Factory Toggle (Client-side Filter)

**File**: `frontend/src/pages/production/Maintenance.tsx`

Saat ini Maintenance **tidak ada factory filter**. Data maintenance terhubung ke Machine via `id_machine`, dan Machine punya `id_factory`. Backend API `/maintenances` **tidak langsung support `id_factory` parameter** — jadi kita filter client-side via `machine.id_factory`.

**Yang perlu dilakukan:**

1. Tambah import `factoryApi`:
```typescript
import api, { factoryApi } from '../../services/api';
```

2. Tambah interface `Factory` dan state.

3. Update interface `Machine` untuk include `id_factory`:
```typescript
interface Machine {
    id: number;
    code: string;
    name: string;
    id_factory: number;
}
```

4. Update interface `Maintenance` → `machine` field tambah `id_factory`:
```typescript
machine?: {
    id: number;
    code: string;
    name: string;
    id_factory?: number;
};
```

5. Tambah `fetchFactories()` di mount.

6. Filter maintenances client-side berdasarkan factory:
```typescript
const filteredMaintenances = useMemo(() => {
    if (!selectedFactory) return maintenances;
    return maintenances.filter(m => m.machine?.id_factory === selectedFactory);
}, [maintenances, selectedFactory]);
```
Lalu gunakan `filteredMaintenances` di render, bukan `maintenances`.

7. Filter machines dropdown di form berdasarkan factory:
```typescript
const filteredMachines = useMemo(() => {
    if (!selectedFactory) return machines;
    return machines.filter(m => m.id_factory === selectedFactory);
}, [machines, selectedFactory]);
```
Gunakan `filteredMachines` di dropdown `id_machine` di modal form.

8. Tambah import `useMemo` dari react.

9. Tambah UI toggle buttons setelah `<Header>`.

10. Update stats cards agar hitung dari `filteredMaintenances` bukan `maintenances`.

> **Catatan**: Periksa apakah API `/maintenances` mengembalikan relasi `machine` dengan `id_factory`. Jika tidak, mungkin perlu update include di backend repository. Tapi biasanya machine sudah di-include — cek response API terlebih dahulu.

---

### Task 4: OEE — Factory Toggle (Client-side + API Filter)

**File**: `frontend/src/pages/production/OEE.tsx`

Saat ini OEE **tidak ada factory filter**. Fetch `/worksheets` dan `/machines` tanpa filter factory.

**Yang perlu dilakukan:**

1. Tambah import `{ factoryApi, worksheetApi, machineApi }` (ganti `api.get('/worksheets')` dengan `worksheetApi`):
```typescript
import { factoryApi, machineApi } from '../../services/api';
import api from '../../services/api';
```

2. Tambah state & interface `Factory`.

3. Tambah `fetchFactories()` di mount.

4. Ubah `fetchData()` agar pass `id_factory`:
```typescript
const fetchData = async () => {
    try {
        const [worksheetsRes, machinesRes] = await Promise.all([
            api.get('/worksheets', { params: { limit: 100, id_factory: selectedFactory || undefined } }),
            api.get('/machines', { params: { id_factory: selectedFactory || undefined } })
        ]);
        // ... rest sama
    }
};
```

5. Tambah `useEffect` yang re-fetch saat factory berubah:
```typescript
useEffect(() => {
    fetchData();
}, [selectedFactory]);
```

6. Tambah UI toggle buttons setelah `<Header>`.

> **Catatan**: `/worksheets` API sudah support `id_factory` query param. `/machines` juga sudah support `id_factory` — lihat `Machines.tsx` yang sudah filter by factory.

---

### Task 5: RawMaterialReceipt — Factory Toggle

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

Saat ini RawMaterialReceipt tidak filter by factory. Penerimaan bahan baku berhubungan dengan stock movement, yang terhubung ke Stock via `id_stock`, dan Stock punya `id_factory`.

**Yang perlu dilakukan:**

1. Tambah import `factoryApi`:
```typescript
import api, { stockApi, supplierApi, productTypeApi, rawMaterialCategoryApi, rawMaterialVarietyApi, qualityAnalysisApi, factoryApi } from '../../services/api';
```

2. Tambah state & interface `Factory`.

3. Tambah `fetchFactories()` di mount.

4. Filter data client-side: stock movements yang ditampilkan di tabel "Recent Received Batches" harus bisa difilter by factory. Periksa bagaimana data batches di-fetch — kemungkinan via `api.get('/stock-movements')`.

5. Jika stock movements API support `id_factory` via Stock relation, pass parameter tersebut. Jika tidak, filter client-side dengan mencocokkan stock factory.

6. Saat membuat penerimaan baru, gunakan `selectedFactory` sebagai default factory untuk stock lookup:
```typescript
// Saat ini line 283 hardcode factory.id — pastikan ini menggunakan selectedFactory
id_factory: selectedFactory || factory.id,
```

7. Tambah UI toggle buttons setelah `<Header>`.

> **Catatan**: Perlu investigasi bagaimana RawMaterialReceipt fetch data dan structure kodenya. File ini cukup besar — baca seluruh file terlebih dahulu sebelum implementasi.

---

### Task 6: Invoices — Factory Toggle di List

**File**: `frontend/src/pages/sales/Invoices.tsx`

Saat ini Invoices punya `id_factory` di form create (required field, dropdown) tapi **list tidak difilter** by factory. API backend `GET /invoices` sudah support `id_factory` query param.

**Yang perlu dilakukan:**

1. Tambah state factory filter (factories sudah di-fetch di `fetchFactories()` existing):
```typescript
const [selectedFactory, setSelectedFactory] = useState<number | null>(null);
```

2. Ubah `fetchInvoices()` agar pass `id_factory`:
```typescript
const fetchInvoices = async () => {
    try {
        const response = await invoiceApi.getAll({
            limit: 500,
            id_factory: selectedFactory || undefined
        });
        // ... rest sama
    }
};
```

3. Tambah `useEffect` yang re-fetch saat factory berubah:
```typescript
useEffect(() => {
    fetchInvoices();
}, [selectedFactory]);
```

4. Default `formData.id_factory` ke `selectedFactory` saat buka modal create:
```typescript
// Di openCreateModal, set id_factory:
setFormData(prev => ({
    ...prev,
    id_factory: selectedFactory || (factories.length > 0 ? factories[0].id : 0),
    // ... rest
}));
```

5. Tambah UI toggle buttons **di atas tabel**, setelah stats grid.

6. Update subtitle Header:
```typescript
const selectedFactoryName = factories.find(f => f.id === selectedFactory)?.name;
// <Header title="Invoice" subtitle={`Kelola invoice penjualan — ${selectedFactoryName || 'Semua Pabrik'}`} />
```

> **Catatan**: `factories` state sudah ada di Invoices.tsx (untuk dropdown di form). Yang perlu ditambahkan hanya `selectedFactory` state, toggle UI, dan filter parameter di fetch.

---

### Task 7: PurchaseOrders — Factory Toggle di List

**File**: `frontend/src/pages/purchasing/PurchaseOrders.tsx`

Saat ini PurchaseOrders punya `id_factory` di form create tapi **list tidak difilter**. API backend `GET /purchase-orders` sudah support `id_factory`.

**Yang perlu dilakukan:**

Identik dengan Task 6 (Invoices), tapi untuk Purchase Orders:

1. Tambah state `selectedFactory`.

2. Ubah `fetchPurchaseOrders()` agar pass `id_factory`:
```typescript
const fetchPurchaseOrders = async () => {
    try {
        const response = await purchaseOrderApi.getAll({
            limit: 500,
            id_factory: selectedFactory || undefined
        });
        // ... rest sama
    }
};
```

3. Tambah `useEffect` re-fetch saat `selectedFactory` berubah.

4. Default `formData.id_factory` ke `selectedFactory` di modal create.

5. Tambah UI toggle buttons di atas tabel.

6. Update subtitle Header.

> **Catatan**: Sama seperti Invoices — `factories` sudah di-fetch. Tinggal tambah `selectedFactory` dan wire up.

---

## File yang Perlu Dimodifikasi

| # | File | Aksi | Detail |
|---|------|------|--------|
| 1 | `frontend/src/pages/dashboard/Dashboard.tsx` | **EDIT** | Tambah factory toggle, pass `id_factory` ke API, re-fetch saat berubah |
| 2 | `frontend/src/pages/production/Stocks.tsx` | **EDIT** | Tambah factory toggle, pass `id_factory` ke `stockApi.getAll`, fix hardcoded `id_factory: 1` |
| 3 | `frontend/src/pages/production/Maintenance.tsx` | **EDIT** | Tambah factory toggle, client-side filter via `machine.id_factory`, filter machines dropdown |
| 4 | `frontend/src/pages/production/OEE.tsx` | **EDIT** | Tambah factory toggle, pass `id_factory` ke worksheets & machines API |
| 5 | `frontend/src/pages/production/RawMaterialReceipt.tsx` | **EDIT** | Tambah factory toggle, filter stock movements by factory |
| 6 | `frontend/src/pages/sales/Invoices.tsx` | **EDIT** | Tambah factory toggle, pass `id_factory` ke `invoiceApi.getAll`, default form factory |
| 7 | `frontend/src/pages/purchasing/PurchaseOrders.tsx` | **EDIT** | Tambah factory toggle, pass `id_factory` ke `purchaseOrderApi.getAll`, default form factory |

**Backend TIDAK perlu diubah** — semua API sudah support `id_factory` query parameter.

---

## CSS Classes yang Sudah Tersedia (Jangan Buat Baru)

```
Layout:      .page-content, .stats-grid, .stat-card
Card:        .card, .card-header, .card-title
Button:      .btn, .btn-primary, .btn-secondary, .btn-ghost, .btn-sm, .btn-icon
Badge:       .badge, .badge-success, .badge-warning, .badge-error, .badge-info, .badge-muted
Table:       .table-container, .table
Icon:        .material-symbols-outlined, .icon-sm
```

---

## Referensi Pattern — File yang Sudah Mengimplementasi Factory Toggle

Buka dan pelajari file-file ini sebagai referensi sebelum mulai:

1. **`frontend/src/pages/production/Worksheets.tsx`** — Factory toggle buttons (lines 128-155)
   - Toggle buttons: Semua / PMD 1 / PMD 2
   - Default ke PMD-1
   - Re-fetch saat factory berubah
   - Tombol "New Entry" hanya muncul jika factory dipilih

2. **`frontend/src/pages/production/Machines.tsx`** — Factory toggle buttons (lines 210-230)
   - Toggle buttons: Semua / PMD 1 / PMD 2
   - Client-side filter: `machines.filter(m => m.id_factory === selectedFactory)`
   - Form create default ke `selectedFactory`

3. **`frontend/src/pages/reports/ProductionReport.tsx`** — Factory dropdown select
   - Dropdown `<select>` instead of toggle buttons (untuk reports)
   - Pass `id_factory` ke report API

---

## Urutan Pengerjaan yang Disarankan

1. **Task 1: Dashboard** — paling visible, impact tinggi
2. **Task 2: Stocks** — paling kritikal (hardcoded `id_factory: 1` adalah bug)
3. **Task 6: Invoices** — sudah punya factories state, paling sedikit perubahan
4. **Task 7: PurchaseOrders** — identik dengan Invoices
5. **Task 3: Maintenance** — client-side filter
6. **Task 4: OEE** — mirip Maintenance
7. **Task 5: RawMaterialReceipt** — paling kompleks, perlu investigasi

---

## Verification

Setelah semua task selesai:

1. ✅ Setiap halaman yang dimodifikasi menampilkan factory toggle buttons (Semua / PMD 1 / PMD 2)
2. ✅ Default selected factory = PMD-1 (atau factory pertama yang ditemukan)
3. ✅ Klik toggle → data langsung berubah sesuai factory yang dipilih
4. ✅ Klik "Semua" → menampilkan data dari semua factory
5. ✅ Dashboard KPI, chart, inventory, maintenance, machines semua berubah sesuai factory
6. ✅ Stocks: tidak lagi hardcoded `id_factory: 1` — menggunakan selected factory
7. ✅ Form create (Stocks, Invoice, PO) menggunakan `selectedFactory` sebagai default `id_factory`
8. ✅ Maintenance & OEE: machines dropdown di form hanya menampilkan mesin dari factory yang dipilih
9. ✅ `npm run build` — no TypeScript errors

---

## Catatan Penting

- **Jangan ubah backend** — semua API sudah siap menerima `id_factory`.
- **`factoryApi`** sudah ada di `frontend/src/services/api.ts` — tidak perlu buat baru.
- **Filter `f.code.startsWith('PMD')`** digunakan untuk exclude factory non-PMD (jika ada) dari toggle.
- **Dark mode**: CSS Variables otomatis berubah, tidak perlu handling khusus.
- **Mobile**: Toggle buttons sudah responsive karena menggunakan `display: flex` + `gap` + `flexWrap: wrap`.
- **QC Gabah di-SKIP** — QC analysis tidak terikat pabrik, dilakukan terhadap sampel bahan baku.
