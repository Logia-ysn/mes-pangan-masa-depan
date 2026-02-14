# Form Input Produksi — Implementation Plan

## Context

Kamu akan membuat halaman form input produksi yang terpisah dari list worksheet. Saat ini form dan list campur di `Worksheets.tsx` (1282 baris). Kita akan memecah menjadi halaman terpisah `/production/worksheets/new` dan `/production/worksheets/:id/edit`.

### Tech Stack
- **Backend**: Node.js + Express + NAIV framework + Prisma ORM + PostgreSQL
- **Frontend**: React 19 + Vite 7 + React Router 7 + Plain CSS (CSS Variables, dark/light theme)
- **Icons**: Material Symbols via className
- **Toast**: react-hot-toast

### Yang Sudah Ada
Backend API sudah lengkap (CRUD worksheet). Tidak perlu ubah backend. Yang perlu dibuat hanya **frontend form page baru**.

### Endpoint yang Dipakai
| Method | URL | Fungsi |
|--------|-----|--------|
| `POST /worksheets` | Create worksheet | Auth: SUPERVISOR |
| `PUT /worksheets/:id` | Update worksheet | Auth: SUPERVISOR |
| `GET /worksheets/:id` | Get detail (untuk edit mode) | Auth: OPERATOR |
| `GET /stocks?id_factory=X` | Get stok bahan baku (untuk input batch) | |
| `GET /machines` | Get daftar mesin | |
| `GET /employees` | Get daftar operator | |
| `GET /process-categories` | Get kategori proses | |
| `GET /output-products?id_factory=X` | Get produk output per factory | |
| `GET /factories` | Get daftar factory | |

### API Client yang Sudah Ada (`frontend/src/services/api.ts`)
```typescript
worksheetApi.create(data)
worksheetApi.update(id, data)
worksheetApi.getById(id)
stockApi.getAll(params)
machineApi.getAll()
employeeApi.getAll()
processCategoryApi.getAll()
outputProductApi.getAll(params)
factoryApi.getAll()
```

### Request Body untuk Create Worksheet
```typescript
{
  id_factory: number,           // Required
  worksheet_date: string,       // Required - "YYYY-MM-DD"
  shift: string,                // Required - "SHIFT_1" | "SHIFT_2" | "SHIFT_3"
  id_machine: number,           // Optional
  id_output_product: number,    // Optional
  process_steps: string,        // JSON.stringify(string[]) - e.g. '["DRYING","HUSKING"]'
  batch_code: string,           // Optional - "PMD1-20260214-A3F2"
  gabah_input: number,          // Required - total dari input_batches
  beras_output: number,         // Required
  menir_output: number,         // Optional
  dedak_output: number,         // Optional
  sekam_output: number,         // Optional
  machine_hours: number,        // Default 8
  downtime_hours: number,       // Default 0
  downtime_reason: string,      // Optional
  production_cost: number,      // Optional
  raw_material_cost: number,    // Calculated sum(batch.quantity * batch.unit_price)
  side_product_revenue: number, // Calculated sum(sp.quantity * sp.unit_price)
  hpp: number,                  // Calculated production_cost + raw_material_cost - side_product_revenue
  hpp_per_kg: number,           // Calculated hpp / beras_output
  notes: string,                // Optional + "Operator ID: X"
  input_batches: [{             // Array - bahan baku yang dipakai
    id_stock: number,
    quantity: number,
    unit_price: number,
  }],
  side_products: [{             // Array - produk sampingan
    product_code: string,
    product_name: string,
    quantity: number,
    unit_price: number,
    total_value: number,
    is_auto_calculated: boolean,
    auto_percentage: number,
  }],
}
```

### Side Product Config per Factory
```typescript
const sideProductConfig = {
  PMD1: [
    { code: 'BEKATUL', name: 'Bekatul', defaultPercentage: 0 },
    { code: 'SEKAM', name: 'Sekam', defaultPercentage: 15, isAuto: true },
  ],
  PMD2: [
    { code: 'BEKATUL', name: 'Bekatul', defaultPercentage: 0 },
    { code: 'BROKEN', name: 'Broken', defaultPercentage: 0 },
    { code: 'REJECT', name: 'Reject', defaultPercentage: 0 },
    { code: 'MENIR_JITAY', name: 'Menir Jitay', defaultPercentage: 0 },
    { code: 'MENIR_GULA', name: 'Menir Gula', defaultPercentage: 0 },
  ],
};
```

### Process Steps
```typescript
const PROCESS_STEPS = {
  DRYING: 'Pengeringan',        // GKP → GKG
  HUSKING: 'Penggilingan',      // GKG → PK + Sekam
  STONE_POLISHING: 'Poles',     // PK → Glosor + Bekatul
};
```

---

## Task yang Harus Dikerjakan

### Task 1: Buat Halaman Form — `WorksheetForm.tsx`

Buat file **baru**: `frontend/src/pages/production/WorksheetForm.tsx`

Halaman ini digunakan untuk **create** dan **edit** worksheet. Mode ditentukan dari URL:
- `/production/worksheets/new` → create mode
- `/production/worksheets/:id/edit` → edit mode

#### Layout (Multi-Step Form / Wizard)

Form dibagi menjadi **4 step** dengan navigasi step indicator di atas:

```
┌─────────────────────────────────────────────────────────┐
│ Header: "Input Produksi Baru" / "Edit Worksheet #123"   │
├─────────────────────────────────────────────────────────┤
│ Step Indicator:                                         │
│ [1. Info Produksi] → [2. Bahan Baku] → [3. Output] → [4. Review]│
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Step Content (berubah sesuai step aktif)                 │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ Footer: [← Kembali]                      [Lanjut →]    │
│         atau                              [Simpan]      │
└─────────────────────────────────────────────────────────┘
```

#### Step 1: Informasi Produksi

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Factory | Button group (PMD-1 / PMD-2) | Ya | Menentukan side products & output products |
| Tanggal Produksi | Date input | Ya | Default: hari ini |
| Shift Kerja | Dropdown (SHIFT_1, SHIFT_2, SHIFT_3) | Ya | |
| Mesin | Dropdown (dari machineApi) | Tidak | Filter by factory |
| Operator | Dropdown (dari employeeApi) + tombol "+ Tambah" | Ya | |
| Batch Code | Text input + tombol "Generate" | Tidak | Format: `{FACTORY}-{YYYYMMDD}-{RAND4}` |

#### Step 2: Input Bahan Baku (Input Batches)

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Daftar Input | Table/card list | Ya (min 1) | |
| ├ Stok Bahan Baku | Dropdown (dari stockApi, filter by factory) | Ya | Tampilkan: nama produk + stok tersedia |
| ├ Jumlah (kg) | Number input | Ya | Validasi: tidak boleh > stok tersedia |
| └ Harga per kg | Number input | Tidak | Default: 0 |
| **Total Input** | Display (auto-calculate) | - | Sum semua batch quantity |
| **Total Biaya Bahan** | Display (auto-calculate) | - | Sum(quantity × unit_price) |

UI pattern:
- Tombol "+ Tambah Bahan Baku" untuk menambah row
- Setiap row ada tombol hapus (×)
- Bisa pakai inline row atau modal selector untuk pilih stok
- Tampilkan warning jika quantity > stok tersedia

#### Step 3: Output Produksi

**3a: Produk Utama**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Produk Output | Button grid (dari outputProductApi) | Tidak | Pilih 1 dari list |
| Proses yang Dilakukan | Toggle buttons (multi-select) | Tidak | DRYING, HUSKING, STONE_POLISHING |
| Berat Output (kg) | Number input | Ya | Beras output utama |

**3b: Produk Sampingan** (auto-generated berdasarkan factory)

Tampilkan tabel/card list side products berdasarkan `sideProductConfig[factory]`:

| Field | Type | Notes |
|-------|------|-------|
| Nama Produk | Display (readonly) | Dari config |
| Jumlah (kg) | Number input | SEKAM auto = 15% total input, sisanya manual |
| Harga per kg | Number input | Optional |
| Total Nilai | Display (auto-calculate) | quantity × unit_price |

**3c: Biaya & HPP** (auto-calculated)

| Field | Type | Notes |
|-------|------|-------|
| Biaya Produksi (non-material) | Number input | Listrik, tenaga kerja, dll |
| Biaya Bahan Baku | Display | Dari step 2: sum(batch.qty × batch.price) |
| Pendapatan Sampingan | Display | Sum(side_product.qty × side_product.price) |
| **HPP Total** | Display | production_cost + raw_material_cost - side_product_revenue |
| **HPP per kg** | Display | hpp / beras_output |

**3d: Informasi Tambahan** (collapsible section, optional)

| Field | Type | Notes |
|-------|------|-------|
| Jam Mesin | Number input | Default: 8 |
| Jam Downtime | Number input | Default: 0 |
| Alasan Downtime | Textarea | Tampilkan hanya jika downtime > 0 |
| Catatan | Textarea | Free text |

#### Step 4: Review & Submit

Tampilkan ringkasan semua data dalam format read-only:

```
┌─ Informasi Produksi ──────────────────┐
│ Factory: PMD-1         Shift: SHIFT_1 │
│ Tanggal: 2026-02-14    Mesin: M-01    │
│ Operator: Budi         Batch: PMD1-.. │
├─ Bahan Baku ──────────────────────────┤
│ 1. GKP Cianjur  500 kg  @ Rp 5.000   │
│ 2. GKP Subang   300 kg  @ Rp 4.800   │
│ Total: 800 kg   Biaya: Rp 3.940.000  │
├─ Output ──────────────────────────────┤
│ Beras Premium     640 kg (80%)        │
│ Bekatul            40 kg              │
│ Sekam             120 kg (auto 15%)   │
├─ HPP ─────────────────────────────────┤
│ Biaya Produksi:    Rp    500.000      │
│ Biaya Bahan Baku:  Rp  3.940.000     │
│ Pendapatan Samping:Rp   (200.000)    │
│ HPP Total:         Rp  4.240.000     │
│ HPP per kg:        Rp      6.625     │
└───────────────────────────────────────┘
         [← Kembali]  [✓ Simpan]
```

Tombol "Simpan" → submit ke API → redirect ke `/production/worksheets` atau ke detail page.

---

### Task 2: State Management

```typescript
// Mode detection
const { id } = useParams();
const isEditMode = !!id;
const navigate = useNavigate();

// Step management
const [currentStep, setCurrentStep] = useState(1);
const TOTAL_STEPS = 4;

// Reference data (fetch on mount)
const [factories, setFactories] = useState<any[]>([]);
const [machines, setMachines] = useState<any[]>([]);
const [employees, setEmployees] = useState<any[]>([]);
const [stocks, setStocks] = useState<any[]>([]);
const [processCategories, setProcessCategories] = useState<any[]>([]);
const [outputProducts, setOutputProducts] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);

// Form data
const [formData, setFormData] = useState({
  // Step 1
  id_factory: null as number | null,
  worksheet_date: new Date().toISOString().split('T')[0],
  shift: '',
  id_machine: null as number | null,
  operator_id: '',
  batch_code: '',

  // Step 2
  input_batches: [] as InputBatch[],

  // Step 3
  id_output_product: null as number | null,
  selected_processes: [] as string[],
  beras_output: '',
  side_products: [] as SideProduct[],
  production_cost: '',
  machine_hours: '8',
  downtime_hours: '0',
  downtime_reason: '',
  notes: '',
});

// Interfaces
interface InputBatch {
  id_stock: number;
  stock_name: string;      // display only
  available_qty: number;   // display only
  quantity: number;
  unit_price: number;
}

interface SideProduct {
  product_code: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  is_auto_calculated: boolean;
  auto_percentage: number;
}
```

---

### Task 3: Computed Values (useMemo)

```typescript
// Total input dari batches
const totalInput = useMemo(() =>
  formData.input_batches.reduce((sum, b) => sum + b.quantity, 0),
  [formData.input_batches]
);

// Total biaya bahan baku
const rawMaterialCost = useMemo(() =>
  formData.input_batches.reduce((sum, b) => sum + (b.quantity * b.unit_price), 0),
  [formData.input_batches]
);

// Side product revenue
const sideProductRevenue = useMemo(() =>
  formData.side_products.reduce((sum, sp) => sum + (sp.quantity * sp.unit_price), 0),
  [formData.side_products]
);

// HPP
const productionCost = Number(formData.production_cost) || 0;
const hpp = useMemo(() =>
  productionCost + rawMaterialCost - sideProductRevenue,
  [productionCost, rawMaterialCost, sideProductRevenue]
);

const berasOutput = Number(formData.beras_output) || 0;
const hppPerKg = useMemo(() =>
  berasOutput > 0 ? hpp / berasOutput : 0,
  [hpp, berasOutput]
);

// Rendemen
const rendemen = useMemo(() =>
  totalInput > 0 ? (berasOutput / totalInput) * 100 : 0,
  [berasOutput, totalInput]
);
```

---

### Task 4: Auto-Calculate Side Products

Ketika `totalInput` berubah, update SEKAM (15% auto):

```typescript
useEffect(() => {
  setFormData(prev => ({
    ...prev,
    side_products: prev.side_products.map(sp => {
      if (sp.is_auto_calculated && sp.auto_percentage > 0) {
        const autoQty = (totalInput * sp.auto_percentage) / 100;
        return { ...sp, quantity: autoQty };
      }
      return sp;
    })
  }));
}, [totalInput]);
```

---

### Task 5: Initialize Side Products on Factory Change

Ketika factory berubah, reset side products dan fetch output products + stocks:

```typescript
useEffect(() => {
  if (!formData.id_factory) return;

  // Determine factory code
  const factory = factories.find(f => f.id === formData.id_factory);
  const factoryCode = factory?.code?.includes('PMD-1') || factory?.code?.includes('PMD1') ? 'PMD1' : 'PMD2';

  // Initialize side products
  const config = sideProductConfig[factoryCode] || sideProductConfig['PMD1'];
  const sideProducts = config.map(sp => ({
    product_code: sp.code,
    product_name: sp.name,
    quantity: 0,
    unit_price: 0,
    is_auto_calculated: sp.isAuto || false,
    auto_percentage: sp.defaultPercentage || 0,
  }));

  setFormData(prev => ({
    ...prev,
    side_products: sideProducts,
    input_batches: [],  // Reset batches
    id_output_product: null,
  }));

  // Fetch stocks and output products for this factory
  fetchStocks(formData.id_factory);
  fetchOutputProducts(formData.id_factory);
}, [formData.id_factory]);
```

---

### Task 6: Step Validation

Validasi per step sebelum boleh "Lanjut":

```typescript
const validateStep = (step: number): string | null => {
  switch (step) {
    case 1:
      if (!formData.id_factory) return 'Pilih factory';
      if (!formData.shift) return 'Pilih shift kerja';
      if (!formData.worksheet_date) return 'Isi tanggal produksi';
      if (!formData.operator_id) return 'Pilih operator';
      return null;
    case 2:
      if (formData.input_batches.length === 0) return 'Tambahkan minimal 1 bahan baku';
      const overStock = formData.input_batches.find(b => b.quantity > b.available_qty);
      if (overStock) return `Jumlah ${overStock.stock_name} melebihi stok tersedia`;
      const zeroQty = formData.input_batches.find(b => b.quantity <= 0);
      if (zeroQty) return 'Jumlah bahan baku harus > 0';
      return null;
    case 3:
      if (!formData.beras_output || Number(formData.beras_output) <= 0)
        return 'Isi berat output produk utama';
      if (Number(formData.beras_output) > totalInput)
        return 'Output tidak boleh melebihi total input';
      return null;
    default:
      return null;
  }
};

const handleNext = () => {
  const error = validateStep(currentStep);
  if (error) {
    toast.error(error);
    return;
  }
  setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS));
};

const handleBack = () => {
  setCurrentStep(prev => Math.max(prev - 1, 1));
};
```

---

### Task 7: Form Submission

```typescript
const handleSubmit = async () => {
  setSubmitting(true);
  try {
    const payload = {
      id_factory: formData.id_factory,
      worksheet_date: formData.worksheet_date,
      shift: formData.shift,
      id_machine: formData.id_machine || undefined,
      id_output_product: formData.id_output_product || undefined,
      process_steps: JSON.stringify(formData.selected_processes),
      batch_code: formData.batch_code || undefined,
      gabah_input: totalInput,
      beras_output: Number(formData.beras_output),
      menir_output: 0,
      dedak_output: 0,
      sekam_output: 0,
      machine_hours: Number(formData.machine_hours) || 8,
      downtime_hours: Number(formData.downtime_hours) || 0,
      downtime_reason: formData.downtime_reason || undefined,
      production_cost: productionCost,
      raw_material_cost: rawMaterialCost,
      side_product_revenue: sideProductRevenue,
      hpp,
      hpp_per_kg: hppPerKg,
      notes: formData.operator_id ? `Operator ID: ${formData.operator_id}` : formData.notes,
      input_batches: formData.input_batches.map(b => ({
        id_stock: b.id_stock,
        quantity: b.quantity,
        unit_price: b.unit_price,
      })),
      side_products: formData.side_products
        .filter(sp => sp.quantity > 0)
        .map(sp => ({
          product_code: sp.product_code,
          product_name: sp.product_name,
          quantity: sp.quantity,
          unit_price: sp.unit_price,
          total_value: sp.quantity * sp.unit_price,
          is_auto_calculated: sp.is_auto_calculated,
          auto_percentage: sp.auto_percentage || 0,
        })),
    };

    if (isEditMode) {
      await worksheetApi.update(Number(id), payload);
      toast.success('Worksheet berhasil diupdate');
    } else {
      await worksheetApi.create(payload);
      toast.success('Worksheet berhasil dibuat');
    }

    navigate('/production/worksheets');
  } catch (error: any) {
    toast.error(error.response?.data?.error?.message || 'Gagal menyimpan worksheet');
  } finally {
    setSubmitting(false);
  }
};
```

---

### Task 8: Edit Mode — Load Existing Data

```typescript
useEffect(() => {
  if (!isEditMode) return;

  const loadWorksheet = async () => {
    try {
      const res = await worksheetApi.getById(Number(id));
      const ws = res.data;

      setFormData({
        id_factory: ws.id_factory,
        worksheet_date: ws.worksheet_date?.split('T')[0] || '',
        shift: ws.shift,
        id_machine: ws.id_machine,
        operator_id: ws.notes?.match(/Operator ID: (\d+)/)?.[1] || '',
        batch_code: ws.batch_code || '',
        id_output_product: ws.id_output_product,
        selected_processes: ws.process_steps ? JSON.parse(ws.process_steps) : [],
        beras_output: String(ws.beras_output),
        production_cost: String(ws.production_cost || ''),
        machine_hours: String(ws.machine_hours || 8),
        downtime_hours: String(ws.downtime_hours || 0),
        downtime_reason: ws.downtime_reason || '',
        notes: ws.notes || '',
        input_batches: (ws.WorksheetInputBatch || []).map((b: any) => ({
          id_stock: b.id_stock,
          stock_name: b.Stock?.ProductType?.name || 'Unknown',
          available_qty: Number(b.Stock?.quantity || 0) + Number(b.quantity), // restore available
          quantity: Number(b.quantity),
          unit_price: Number(b.unit_price || 0),
        })),
        side_products: (ws.WorksheetSideProduct || []).map((sp: any) => ({
          product_code: sp.product_code,
          product_name: sp.product_name,
          quantity: Number(sp.quantity),
          unit_price: Number(sp.unit_price || 0),
          is_auto_calculated: sp.is_auto_calculated,
          auto_percentage: Number(sp.auto_percentage || 0),
        })),
      });
    } catch (error) {
      toast.error('Gagal memuat data worksheet');
      navigate('/production/worksheets');
    }
  };

  loadWorksheet();
}, [id, isEditMode]);
```

---

### Task 9: Generate Batch Code

```typescript
const generateBatchCode = () => {
  const factory = factories.find(f => f.id === formData.id_factory);
  const prefix = factory?.code?.includes('PMD-1') || factory?.code?.includes('PMD1') ? 'PMD1' : 'PMD2';
  const dateStr = formData.worksheet_date.replace(/-/g, '');
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  setFormData(prev => ({ ...prev, batch_code: `${prefix}-${dateStr}-${rand}` }));
};
```

---

### Task 10: Routing & Navigation

**File**: `frontend/src/App.tsx`

Tambah lazy import:
```typescript
const WorksheetForm = React.lazy(() => import('./pages/production/WorksheetForm'));
```

Tambah routes di dalam production group:
```tsx
<Route path="production">
  {/* existing routes */}
  <Route path="worksheets" element={<Worksheets />} />
  <Route path="worksheets/:id" element={<WorksheetDetail />} />
  {/* NEW */}
  <Route path="worksheets/new" element={<WorksheetForm />} />
  <Route path="worksheets/:id/edit" element={<WorksheetForm />} />
</Route>
```

> **PENTING**: Route `worksheets/new` harus di ATAS `worksheets/:id` agar tidak match sebagai ID "new".

---

### Task 11: Update Worksheets.tsx — Link ke Form Baru

**File**: `frontend/src/pages/production/Worksheets.tsx`

**11a**: Ganti tombol "Tambah Worksheet" dari `setShowForm(true)` menjadi navigate:
```tsx
// SEBELUM:
<button onClick={() => { setEditingId(null); setShowForm(true); }}>
  + Tambah Worksheet
</button>

// SESUDAH:
<button onClick={() => navigate('/production/worksheets/new')}>
  + Input Produksi
</button>
```

**11b**: Ganti tombol "Edit" di tabel:
```tsx
// SEBELUM:
<button onClick={() => handleEdit(ws)}>Edit</button>

// SESUDAH:
<button onClick={() => navigate(`/production/worksheets/${ws.id}/edit`)}>Edit</button>
```

**11c**: Hapus atau comment out semua state dan JSX terkait inline form:
- State: `showForm`, `showBatchModal`, `showAddOperatorModal`, `formData`, `newOperator`
- Functions: `handleSubmit`, `handleEdit`, `initializeSideProducts`, `calculateAutoSideProducts`, `calculateHPP`, `addInputBatch`, `removeInputBatch`, `updateSideProduct`, `handleProcessToggle`, `generateBatchCode`, `handleAddOperator`
- JSX: Seluruh form section (`{showForm && (...)}`) dan batch modal (`{showBatchModal && (...)}`)

> **CATATAN**: Jangan hapus sekaligus. Biarkan kode lama di-comment dulu sebagai referensi. Bisa dihapus nanti setelah form baru stabil.

---

### Task 12: CSS untuk Form Page

Tambah di `frontend/src/index.css` (atau buat file terpisah `WorksheetForm.css` jika diperlukan):

```css
/* Step Indicator */
.step-indicator {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 24px 0;
  margin-bottom: 24px;
}

.step-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  background: var(--bg-elevated);
  color: var(--text-secondary);
  border: 2px solid var(--border-color);
  transition: var(--transition);
}

.step-item.active .step-number {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.step-item.completed .step-number {
  background: var(--success);
  color: white;
  border-color: var(--success);
}

.step-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.step-item.active .step-label {
  color: var(--text-primary);
  font-weight: 600;
}

.step-connector {
  width: 40px;
  height: 2px;
  background: var(--border-color);
  align-self: center;
}

.step-item.completed + .step-connector {
  background: var(--success);
}

/* Form Footer */
.form-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  margin-top: 24px;
}

/* Input Batch Table */
.batch-table {
  width: 100%;
  margin: 12px 0;
}

.batch-table td {
  padding: 8px;
  vertical-align: middle;
}

.batch-row-remove {
  color: var(--error);
  cursor: pointer;
  background: none;
  border: none;
  padding: 4px 8px;
}

/* Side Product Grid */
.side-product-row {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr auto;
  gap: 8px;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

/* HPP Summary Card */
.hpp-summary {
  background: var(--bg-elevated);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-top: 16px;
}

.hpp-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border-color);
}

.hpp-row.total {
  font-weight: 700;
  font-size: 1.125rem;
  border-bottom: none;
  padding-top: 12px;
}

/* Review Section */
.review-section {
  background: var(--bg-surface);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  margin-bottom: 16px;
}

.review-section h4 {
  margin-bottom: 12px;
  color: var(--text-secondary);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.review-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px 24px;
}

.review-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 0;
}

.review-label {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.review-value {
  font-weight: 600;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .step-indicator {
    overflow-x: auto;
    justify-content: flex-start;
    padding: 16px;
  }

  .step-label {
    display: none;
  }

  .step-connector {
    width: 24px;
  }

  .side-product-row {
    grid-template-columns: 1fr 1fr;
  }

  .review-grid {
    grid-template-columns: 1fr;
  }

  .form-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }

  .form-footer .btn {
    width: 100%;
  }
}
```

---

## File yang Dimodifikasi

| File | Aksi | Detail |
|------|------|--------|
| `frontend/src/pages/production/WorksheetForm.tsx` | **CREATE** | Halaman form baru (multi-step wizard) |
| `frontend/src/App.tsx` | **EDIT** | Tambah lazy import + 2 routes baru |
| `frontend/src/pages/production/Worksheets.tsx` | **EDIT** | Ganti tombol "Tambah" dan "Edit" ke navigate, hapus/comment inline form |
| `frontend/src/index.css` | **EDIT** | Tambah CSS step indicator, batch table, side product grid, review section |

## Urutan Pengerjaan

1. **CSS dulu** — tambah styles di `index.css` (Task 12)
2. **WorksheetForm.tsx** — buat file baru dengan semua logic (Task 1–9)
3. **App.tsx** — tambah routes (Task 10)
4. **Worksheets.tsx** — update navigasi (Task 11)
5. **Test manual**:
   - Create worksheet baru → cek data masuk + stock berubah
   - Edit worksheet → cek data terupdate
   - Navigasi antar step → validasi per step
   - Test di mobile view (375px, 768px)

## Referensi Pattern

Gunakan CSS class yang sudah ada — jangan buat baru kecuali yang didefinisikan di Task 12:
```
.card, .card-header, .card-body
.btn, .btn-primary, .btn-secondary, .btn-ghost
.form-group, .form-label, .form-input, .form-select, .form-row
.stats-grid, .stat-card
.badge, .badge-success, .badge-warning
.page-content
```

Untuk format angka, import dari `frontend/src/utils/formatUtils.ts`:
```typescript
import { formatNumber, formatCurrency } from '../../utils/formatUtils';
```

Untuk toast:
```typescript
import toast from 'react-hot-toast';
```
