# Plan: Fix Worksheet Input Batch Material Selection

## Context & Bug Report

**Bug yang dilaporkan:**
1. Saat input worksheet → "Add Batch" → daftar batch menampilkan **"Unknown"** bukan nama material
2. Tidak ada **nomor batch** — hanya muncul total qty tersedia per stock (aggregate)
3. **Harga/HPP bahan baku** tidak terdeteksi otomatis — user harus input manual
4. Seharusnya cukup pilih batch → isi qty yang dipakai → harga otomatis dari data penerimaan

### Root Cause Analysis

**Bug 1 — "Unknown" batch name:**
Di `WorksheetForm.tsx` line 34, interface `Stock` pakai `otm_id_product_type` (konvensi lama Naiv/TypeORM). Tapi backend Prisma return `ProductType` (PascalCase):

```typescript
// Frontend expects (WorksheetForm.tsx:34):
otm_id_product_type?: { code: string; name: string };

// Backend returns (stock.repository.ts:61-64):
include: { ProductType: true, Factory: true }
// → { ProductType: { code: "GKP", name: "Gabah Kering Panen" } }

// Result: stock.otm_id_product_type === undefined → fallback "Unknown"
```

**Bug 2 — Tidak ada nomor batch:**
`BatchSelectionModal` menampilkan **Stock entries** (1 row per product type per factory), bukan individual receipt batches. Jadi user hanya lihat "GKP - 50.000 kg" tanpa tahu batch mana yang tersedia.

Padahal data penerimaan (per batch) tersimpan di `StockMovement` dengan:
- `reference_type: 'RAW_MATERIAL_RECEIPT'`
- `notes`: JSON berisi `{ batchId, supplier, pricePerKg, qualityGrade, ... }`

**Bug 3 — Harga tidak otomatis:**
`BatchSelectionModal` tidak fetch data harga dari penerimaan. User harus manual isi "Price per kg". Padahal setiap batch penerimaan sudah punya `pricePerKg` di notes JSON.

### Dampak
- User tidak tahu batch mana yang dipakai → traceability hilang
- HPP/harga bahan baku salah (manual input → rawan human error)
- "Unknown" material name membingungkan

---

## Approach

### Ubah dari Stock-based → Batch-based Selection

**SEBELUM (Stock-based):**
```
Modal "Select Input Batch":
┌──────────────────────────────────┐
│ Unknown          50.000 kg       │  ← aggregate stock, no batch info
│ Unknown          20.000 kg       │
│                                  │
│ Quantity: [____] Price/kg: [____]│  ← manual input harga
└──────────────────────────────────┘
```

**SESUDAH (Batch-based):**
```
Modal "Pilih Batch Bahan Baku":
┌──────────────────────────────────────────────────────────────┐
│ BTC-2026-001 | GKP | UD Padi Jaya | 5.000 kg | Rp 6.000/kg │ ← actual batch
│ BTC-2026-002 | GKP | CV Tani      | 3.000 kg | Rp 5.800/kg │
│ BTC-2026-003 | PK  | Transfer     | 2.000 kg | Rp 8.000/kg │
│                                                              │
│ Qty yang dipakai: [____] kg     Harga: Rp 6.000/kg (auto)   │
│ Tersedia: 5.000 kg                                           │
└──────────────────────────────────────────────────────────────┘
```

### Data Source

Fetch `StockMovement` dimana:
- `reference_type = 'RAW_MATERIAL_RECEIPT'` (batch penerimaan bahan baku)
- `movement_type = 'IN'`
- `Stock.id_factory = selectedFactory`
- Parse `notes` JSON → extract `batchId`, `supplier`, `pricePerKg`, `qualityGrade`, `category`

Untuk mengetahui **sisa qty tersedia per batch**:
- Qty tersedia = qty movement IN - qty yang sudah terpakai di WorksheetInputBatch
- ATAU simplified: tampilkan semua batch receipt, user pilih batch + isi qty, validasi max = stock.quantity (aggregate)

> **Catatan**: Karena schema `WorksheetInputBatch` track `id_stock` (bukan `id_stock_movement`), kita tidak bisa track per-batch usage secara akurat. Approach: tampilkan semua batch receipt sebagai referensi info (batchId, price, supplier), tapi validasi max qty tetap berdasarkan aggregate Stock.quantity.

---

## Task yang Harus Dikerjakan

### Task 1: Fix naming convention `otm_` → Prisma PascalCase

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

#### A. Update interface `Stock` (line 29-35):
```typescript
// SEBELUM:
interface Stock {
    id: number;
    id_factory: number;
    quantity: number;
    unit: string;
    otm_id_product_type?: { code: string; name: string };
}

// SESUDAH:
interface Stock {
    id: number;
    id_factory: number;
    id_product_type: number;
    quantity: number;
    unit: string;
    ProductType?: { id: number; code: string; name: string };
    Factory?: { id: number; code: string; name: string };
}
```

#### B. Update `addInputBatch` (line 321-333):
```typescript
// SEBELUM (line 324):
stock_name: stock.otm_id_product_type?.name || 'Unknown',

// SESUDAH:
stock_name: stock.ProductType?.name || 'Unknown',
```

#### C. Update edit mode mapping (line 244-249):
```typescript
// SEBELUM:
input_batches: (ws.input_batches || []).map((b: any) => ({
    id_stock: b.otm_id_stock.id,
    stock_name: b.otm_id_stock.otm_id_product_type.name,
    quantity: Number(b.quantity),
    unit_price: Number(b.unit_price || 0)
})),

// SESUDAH:
input_batches: (ws.input_batches || []).map((b: any) => ({
    id_stock: (b.Stock || b.otm_id_stock)?.id || b.id_stock,
    stock_name: (b.Stock || b.otm_id_stock)?.ProductType?.name
        || (b.Stock || b.otm_id_stock)?.otm_id_product_type?.name
        || 'Unknown',
    quantity: Number(b.quantity),
    unit_price: Number(b.unit_price || 0)
})),
```

> **Catatan**: Gunakan fallback `b.Stock || b.otm_id_stock` untuk backward compatibility — beberapa endpoint mungkin masih return `otm_` naming.

#### D. Update edit mode relations lain (line 240, 242):
```typescript
// SEBELUM:
id_output_product: ws.otm_id_output_product?.id ? String(ws.otm_id_output_product.id) : '',
machine_id: ws.otm_id_machine?.id ? String(ws.otm_id_machine.id) : '',

// SESUDAH:
id_output_product: (ws.OutputProduct || ws.otm_id_output_product)?.id
    ? String((ws.OutputProduct || ws.otm_id_output_product).id) : '',
machine_id: (ws.Machine || ws.otm_id_machine)?.id
    ? String((ws.Machine || ws.otm_id_machine).id) : '',
```

---

### Task 2: Rewrite `BatchSelectionModal` — Batch-based selection

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

Ganti seluruh `BatchSelectionModal` component (line 967-1063) dengan versi baru yang:
1. Fetch receipt batches dari API stock movements
2. Tampilkan per-batch info (batchId, supplier, qty, price)
3. Auto-fill harga saat batch dipilih
4. User hanya isi qty yang mau dipakai

**Interface baru untuk receipt batch:**
```typescript
interface ReceiptBatch {
    id: number;              // StockMovement ID
    id_stock: number;        // Stock ID (untuk link ke WorksheetInputBatch)
    batchId: string;         // e.g. "BTC-2026-001"
    supplier: string;        // e.g. "UD Padi Jaya"
    category: string;        // e.g. "Padi/Gabah"
    productName: string;     // e.g. "Gabah Kering Panen"
    productCode: string;     // e.g. "GKP"
    qualityGrade: string;    // e.g. "KW 1"
    quantity: number;         // qty diterima (dari movement)
    pricePerKg: number;      // harga per kg
    dateReceived: string;    // tanggal penerimaan
    stockQuantity: number;   // current stock available (aggregate)
}
```

**Komponen baru:**

```tsx
const BatchSelectionModal = ({ stocks, selectedFactory, onSelect, onClose }: {
    stocks: Stock[];
    selectedFactory: number | null;
    onSelect: (stock: Stock, quantity: number, unitPrice: number, batchLabel: string) => void;
    onClose: () => void;
}) => {
    const [receiptBatches, setReceiptBatches] = useState<ReceiptBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<ReceiptBatch | null>(null);
    const [quantity, setQuantity] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch receipt batches on mount
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                // Get all stock movements for this factory with reference_type = RAW_MATERIAL_RECEIPT
                const params: any = {
                    reference_type: 'RAW_MATERIAL_RECEIPT',
                    movement_type: 'IN',
                    limit: 200
                };
                const res = await api.get('/stock-movements', { params });
                const movements = res.data?.data || [];

                // Parse notes JSON and build batch list
                const batches: ReceiptBatch[] = movements
                    .filter((m: any) => {
                        // Filter by factory via Stock relation
                        const stock = m.Stock;
                        return stock && (!selectedFactory || stock.id_factory === selectedFactory);
                    })
                    .map((m: any) => {
                        let noteData: any = {};
                        try {
                            noteData = JSON.parse(m.notes || '{}');
                        } catch { noteData = {}; }

                        const stock = m.Stock;
                        return {
                            id: m.id,
                            id_stock: m.id_stock,
                            batchId: noteData.batchId || `MOV-${m.id}`,
                            supplier: noteData.supplier || '-',
                            category: noteData.category || '-',
                            productName: stock?.ProductType?.name || noteData.category || 'Unknown',
                            productCode: stock?.ProductType?.code || '-',
                            qualityGrade: noteData.qualityGrade || '-',
                            quantity: Number(m.quantity),
                            pricePerKg: Number(noteData.pricePerKg) || 0,
                            dateReceived: m.created_at,
                            stockQuantity: Number(stock?.quantity) || 0
                        };
                    });

                setReceiptBatches(batches);
            } catch (error) {
                logger.error('Error fetching receipt batches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, [selectedFactory]);

    // Filter batches by search
    const filteredBatches = searchTerm
        ? receiptBatches.filter(b =>
            b.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : receiptBatches;

    const handleSelectBatch = (batch: ReceiptBatch) => {
        setSelectedBatch(batch);
        setQuantity(''); // Reset qty
    };

    const handleConfirm = () => {
        if (!selectedBatch || !quantity) return;

        // Find the Stock object for this batch
        const stock = stocks.find(s => s.id === selectedBatch.id_stock);
        if (!stock) return;

        const qty = parseFloat(quantity);
        const batchLabel = `${selectedBatch.batchId} - ${selectedBatch.productName}`;

        onSelect(stock, qty, selectedBatch.pricePerKg, batchLabel);
    };

    // Max available = aggregate stock quantity for this product
    const maxAvailable = selectedBatch
        ? stocks.find(s => s.id === selectedBatch.id_stock)?.quantity || 0
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
                <div className="modal-header">
                    <h3 className="modal-title">Pilih Batch Bahan Baku</h3>
                    <button className="modal-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="modal-body">
                    {/* Search */}
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', fontSize: 18
                            }}>search</span>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Cari batch ID, supplier, atau material..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    {/* Batch List */}
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                        {loading ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined animate-spin">sync</span>
                                <p>Memuat data batch...</p>
                            </div>
                        ) : filteredBatches.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inventory</span>
                                <p>Tidak ada batch penerimaan ditemukan</p>
                            </div>
                        ) : (
                            <table className="table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th>Batch ID</th>
                                        <th>Material</th>
                                        <th>Supplier</th>
                                        <th>Grade</th>
                                        <th style={{ textAlign: 'right' }}>Qty Terima</th>
                                        <th style={{ textAlign: 'right' }}>Harga/kg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatches.map(batch => (
                                        <tr
                                            key={batch.id}
                                            onClick={() => handleSelectBatch(batch)}
                                            style={{
                                                cursor: 'pointer',
                                                background: selectedBatch?.id === batch.id
                                                    ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderLeft: selectedBatch?.id === batch.id
                                                    ? '3px solid var(--primary)' : '3px solid transparent'
                                            }}
                                        >
                                            <td>
                                                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{batch.batchId}</span>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {new Date(batch.dateReceived).toLocaleDateString('id-ID')}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{batch.productCode}</span>
                                                {' '}{batch.productName}
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{batch.supplier}</td>
                                            <td>
                                                <span className="badge badge-muted">{batch.qualityGrade}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                {formatNumber(batch.quantity)} kg
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                                {batch.pricePerKg > 0 ? formatCurrency(batch.pricePerKg) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Selected Batch Detail + Qty Input */}
                    {selectedBatch && (
                        <div style={{
                            marginTop: 16, padding: 16, borderRadius: 8,
                            border: '2px solid var(--primary)',
                            background: 'rgba(59, 130, 246, 0.03)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <strong>{selectedBatch.batchId}</strong> — {selectedBatch.productName}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Supplier: {selectedBatch.supplier} | Grade: {selectedBatch.qualityGrade}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        {formatCurrency(selectedBatch.pricePerKg)}/kg
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Stok tersedia: {formatNumber(maxAvailable)} kg
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Jumlah yang dipakai (kg) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    max={maxAvailable}
                                    placeholder={`Max: ${formatNumber(maxAvailable)} kg`}
                                    step="0.01"
                                    style={{ fontSize: '1.1rem', fontWeight: 600 }}
                                    autoFocus
                                />
                                {quantity && parseFloat(quantity) > 0 && (
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                        Total biaya: <strong style={{ color: 'var(--primary)' }}>
                                            {formatCurrency(parseFloat(quantity) * selectedBatch.pricePerKg)}
                                        </strong>
                                    </small>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button
                        className="btn btn-primary"
                        onClick={handleConfirm}
                        disabled={!selectedBatch || !quantity || parseFloat(quantity) <= 0}
                    >
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Tambah Batch
                    </button>
                </div>
            </div>
        </div>
    );
};
```

---

### Task 3: Update `InputBatch` interface dan `addInputBatch`

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

#### A. Update `InputBatch` interface (line 51-56):
```typescript
// SEBELUM:
interface InputBatch {
    id_stock: number;
    stock_name: string;
    quantity: number;
    unit_price: number;
}

// SESUDAH:
interface InputBatch {
    id_stock: number;
    stock_name: string;  // "BTC-2026-001 - Gabah Kering Panen"
    quantity: number;
    unit_price: number;
    batch_id?: string;   // "BTC-2026-001" (untuk traceability)
}
```

#### B. Update `addInputBatch` (line 321-333):
```typescript
// SEBELUM:
const addInputBatch = (stock: Stock, quantity: number, unitPrice: number) => {
    const batch: InputBatch = {
        id_stock: stock.id,
        stock_name: stock.otm_id_product_type?.name || 'Unknown',
        quantity,
        unit_price: unitPrice
    };
    ...
};

// SESUDAH:
const addInputBatch = (stock: Stock, quantity: number, unitPrice: number, batchLabel?: string) => {
    const batch: InputBatch = {
        id_stock: stock.id,
        stock_name: batchLabel || stock.ProductType?.name || 'Unknown',
        quantity,
        unit_price: unitPrice,
    };
    setFormData(prev => ({
        ...prev,
        input_batches: [...prev.input_batches, batch]
    }));
    setShowBatchModal(false);
};
```

#### C. Update `BatchSelectionModal` usage (line 909-915):
```tsx
// SEBELUM:
<BatchSelectionModal
    stocks={stocks}
    onSelect={addInputBatch}
    onClose={() => setShowBatchModal(false)}
/>

// SESUDAH:
<BatchSelectionModal
    stocks={stocks}
    selectedFactory={selectedFactory}
    onSelect={addInputBatch}
    onClose={() => setShowBatchModal(false)}
/>
```

---

### Task 4: Update tampilan tabel input batch di form

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

Di tabel input batches (line 716-751), update header dan kolom agar lebih informatif:

```tsx
<table className="table" style={{ margin: 0 }}>
    <thead>
        <tr>
            <th>Batch / Material</th>
            <th style={{ textAlign: 'right' }}>Qty Pakai</th>
            <th style={{ textAlign: 'right' }}>Harga/kg</th>
            <th style={{ textAlign: 'right' }}>Total Biaya</th>
            <th></th>
        </tr>
    </thead>
    <tbody>
        {formData.input_batches.map((batch, idx) => (
            <tr key={idx}>
                <td>
                    <div style={{ fontWeight: 500 }}>{batch.stock_name}</div>
                </td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(batch.quantity)} kg</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(batch.unit_price)}</td>
                <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(batch.quantity * batch.unit_price)}</td>
                <td style={{ textAlign: 'center' }}>
                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => removeInputBatch(idx)}>
                        <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                    </button>
                </td>
            </tr>
        ))}
        <tr style={{ background: 'var(--bg-elevated)' }}>
            <td style={{ fontWeight: 600 }}>Total Input</td>
            <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatNumber(totalInputWeight)} kg</td>
            <td></td>
            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{formatCurrency(hppCalc.rawMaterialCost)}</td>
            <td></td>
        </tr>
    </tbody>
</table>
```

---

### Task 5: Tambah import `api` jika belum ada di BatchSelectionModal scope

**File**: `frontend/src/pages/production/WorksheetForm.tsx`

BatchSelectionModal perlu akses ke `api` untuk fetch stock movements. Cek line 5 — `api` sudah di-import:
```typescript
import { worksheetApi, stockApi, factoryApi, machineApi, employeeApi, processCategoryApi, outputProductApi } from '../../services/api';
```

Tapi perlu juga import default `api`:
```typescript
import api, { worksheetApi, stockApi, factoryApi, machineApi, employeeApi, processCategoryApi, outputProductApi } from '../../services/api';
```

> **Cek dulu** apakah `api` sudah di-import. Jika belum, tambahkan.

---

### Task 6: Verify backend includes untuk worksheet edit mode

**File**: Cek `src/services/worksheet.service.ts` atau `implementation/T_getWorksheetById.ts`

Saat edit mode, frontend load worksheet via `worksheetApi.getById(id)`. Pastikan response include relasi yang benar:
- `input_batches` harus include `Stock` (bukan `otm_id_stock`)
- `Stock` harus include `ProductType`

Cek di backend handler apakah include sudah benar. Jika masih pakai `otm_` naming, tambahkan alias atau fix include:

```typescript
// Pastikan query include seperti ini:
include: {
    WorksheetInputBatch: {
        include: {
            Stock: {
                include: { ProductType: true }
            }
        }
    },
    WorksheetSideProduct: true,
    Machine: true,
    OutputProduct: true
}
```

> **PENTING**: Jika backend NAIV framework masih transform relasi ke `otm_` prefix, maka frontend perlu handle kedua naming (`Stock || otm_id_stock`). Ini sudah di-handle di Task 1 section C dengan fallback.

---

## File yang Dimodifikasi — Ringkasan

| # | File | Aksi | Detail |
|---|------|------|--------|
| 1 | `frontend/src/pages/production/WorksheetForm.tsx` | **EDIT** | Fix `otm_` → Prisma naming, rewrite BatchSelectionModal, update InputBatch interface |
| 2 | `src/services/worksheet.service.ts` atau `implementation/T_getWorksheetById.ts` | **VERIFY** | Pastikan include relasi Stock→ProductType di response |

---

## Verification

1. **Create Worksheet:**
   - Buka `/production/worksheet/new`
   - Pilih factory → klik "Add Batch"
   - Modal menampilkan **daftar batch penerimaan** (bukan aggregate stock)
   - Setiap batch menampilkan: Batch ID, Material name, Supplier, Grade, Qty diterima, Harga/kg
   - Klik salah satu batch → detail muncul di bawah: harga auto-fill, stok tersedia
   - Isi qty → preview total biaya otomatis
   - Klik "Tambah Batch" → batch muncul di tabel form dengan nama "BTC-xxxx - Gabah Kering Panen"
   - HPP section: "Raw Material Cost" otomatis terhitung dari qty × harga per kg

2. **Edit Worksheet:**
   - Buka worksheet existing → Edit
   - Input batches ter-load dengan nama material yang benar (bukan "Unknown")

3. **Validasi:**
   - Tidak bisa add batch tanpa pilih batch
   - Tidak bisa add batch tanpa isi qty
   - Max qty = stok tersedia (warning jika melebihi)

4. **No "Unknown":**
   - Semua material name menampilkan nama dari ProductType (GKP, PK, BRS-P, dll)
   - Tidak ada "Unknown" di manapun

5. `npm run build` — no TypeScript errors

---

## Catatan Penting

- **`otm_` naming convention**: Ini legacy dari Naiv/TypeORM. Prisma pakai PascalCase (`ProductType`, `Factory`, `Stock`). Gunakan fallback pattern `(x.Stock || x.otm_id_stock)` untuk backward compatibility sampai semua endpoint di-fix.
- **Batch tracking limitation**: Schema `WorksheetInputBatch` punya `id_stock` tapi BUKAN `id_stock_movement`. Artinya kita tahu material dari stock mana, tapi tidak bisa track batch penerimaan mana yang dipakai. Untuk traceability penuh, perlu tambah kolom `id_stock_movement` di schema — tapi itu out of scope untuk fix ini.
- **Price auto-fill**: Jika batch receipt tidak punya `pricePerKg` (data lama), harga tetap 0 dan user bisa edit manual. Ini fallback yang aman.
- **Search**: Modal punya search box untuk filter batch by ID, supplier, atau material name. Berguna kalau batch banyak.

---

**STATUS: COMPLETED (2026-02-15)**
- [x] Task 1: Fix naming convention `otm_` → Prisma PascalCase
- [x] Task 2: Rewrite `BatchSelectionModal` — Batch-based selection
- [x] Task 3: Update `InputBatch` interface dan `addInputBatch`
- [x] Task 4: Update tampilan tabel input batch di form
- [x] Task 5: Tambah import `api`
- [x] Task 6: Verify backend includes untuk worksheet edit mode
- [x] Generate Dummy Data for verification (Raw Material Receipts with JSON notes)
- [x] Backend Build & Restart verified.
- [x] Multi-factory data support verified.

