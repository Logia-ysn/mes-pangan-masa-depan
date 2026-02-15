# Plan: Fitur Transfer Stok Antar Pabrik

## Context & Kebutuhan Bisnis

### Alur Produksi PMD (Updated)

**PMD 1 — Penggilingan (hanya sampai PK/Glosor):**
```
Padi (GKP) → [Dryer] → GKG → [Husker] → Pecah Kulit (PK) / Glosor (Medium)
Side products: Sekam, Dedak
```

**PMD 2 — Finishing (dari PK/Glosor → Beras Akhir):**
```
PK/Glosor → [Polisher Batu] → [Polisher Kebi] → [Sorter] → [Grader] → Beras Premium / Beras Medium Super
Side products: Menir
```

### Kenapa Butuh Transfer Stok?

PMD 1 menghasilkan PK dan Glosor, tapi **TIDAK memproses lebih lanjut**. Hasil produksi PMD 1 punya **2 kemungkinan**:

1. **Dijual langsung** — PK/Glosor bisa dijual ke pelanggan sebagai produk akhir PMD 1 (via Invoice dari PMD 1)
2. **Ditransfer ke PMD 2** — untuk dipoles dan di-packing menjadi beras akhir (Premium/Medium Super)

> **PENTING**: Transfer TIDAK otomatis. User secara manual memutuskan berapa banyak stok yang ditransfer vs dijual. Fitur transfer harus bersifat **on-demand** — user pilih produk, tentukan jumlah, lalu eksekusi transfer. Sisa stok yang tidak ditransfer tetap di PMD 1 dan bisa dijual.

**Contoh alur:**
```
PMD 1: Produksi hari ini → PK = 10.000 kg
  │
  ├─ [JUAL 3.000 kg PK] → Invoice ke pelanggan dari PMD 1
  │   PMD 1: Stok PK = 7.000 kg
  │
  └─ [TRANSFER 5.000 kg PK ke PMD 2]
      PMD 1: Stok PK = 2.000 kg  (-5.000)
      PMD P: Stok PK = 5.000 kg  (+5.000)
        ↓ [PMD 2 proses PK → Beras]
      PMD P: Stok BRS-P = 4.250 kg
```

### Kondisi Saat Ini

| Komponen | Status | Detail |
|----------|--------|--------|
| `StockService.transferStock()` | **SUDAH ADA** | `src/services/stock.service.ts` line 187-266. Fully implemented: validasi stock, deduct source, add destination, create 2 movements (OUT + IN) |
| `StockTransferDTO` | **SUDAH ADA** | `src/dto/stock.dto.ts` line 54-66. Fields: `fromFactoryId`, `toFactoryId`, `productCode`, `quantity` |
| API Endpoint | **BELUM ADA** | Tidak ada `T_transferStock.ts` — service tidak bisa dipanggil dari frontend |
| Frontend `stockApi.transfer()` | **BELUM ADA** | Tidak ada method transfer di `api.ts` |
| UI Transfer | **BELUM ADA** | Halaman Stocks (`Stocks.tsx`) tidak ada tombol/modal transfer |

**Kesimpulan**: Backend logic 100% ready, hanya perlu wiring (endpoint + frontend).

---

## Task yang Harus Dikerjakan

### Task 1: Buat API endpoint `POST /stocks/transfer`

**File baru**: `types/api/T_transferStock.ts`

```typescript
import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber, Min } from "class-validator";

export class T_transferStock_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_transferStock_body {
    @IsNotEmpty({ message: 'fromFactoryId cannot be empty' })
    @IsNumber({}, { message: 'fromFactoryId must be a number' })
    fromFactoryId!: number

    @IsNotEmpty({ message: 'toFactoryId cannot be empty' })
    @IsNumber({}, { message: 'toFactoryId must be a number' })
    toFactoryId!: number

    @IsNotEmpty({ message: 'productCode cannot be empty' })
    @IsString({ message: 'productCode must be a string' })
    productCode!: string

    @IsNotEmpty({ message: 'quantity cannot be empty' })
    @IsNumber({}, { message: 'quantity must be a number' })
    @Min(0.01, { message: 'quantity must be greater than 0' })
    quantity!: number

    notes?: string
}

export type T_transferStock = (request: {
    headers: T_transferStock_headers,
    body: T_transferStock_body
}, response: Response) => Promise<{
    status: string,
    message: string,
    data: {
        from: {
            factory_id: number,
            product_code: string,
            new_quantity: number
        },
        to: {
            factory_id: number,
            product_code: string,
            new_quantity: number
        }
    }
}>;

export const method = 'post';
export const url_path = '/stocks/transfer';
export const alias = 'T_transferStock';
export const is_streaming = false;
```

**File baru**: `implementation/T_transferStock.ts`

```typescript
import { T_transferStock } from "../types/api/T_transferStock";
import { StockService } from "../src/services/stock.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

const stockService = new StockService();

export const t_transferStock: T_transferStock = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'ADMIN');

    const { fromFactoryId, toFactoryId, productCode, quantity, notes } = req.body;

    // Validate different factories
    if (fromFactoryId === toFactoryId) {
        throw new Error('Pabrik asal dan tujuan tidak boleh sama');
    }

    const result = await stockService.transferStock(
        fromFactoryId,
        toFactoryId,
        productCode,
        quantity,
        user.id
    );

    return {
        status: 'success',
        message: `Transfer ${quantity} kg ${productCode} berhasil`,
        data: {
            from: {
                factory_id: fromFactoryId,
                product_code: productCode,
                new_quantity: Number(result.from?.quantity || 0)
            },
            to: {
                factory_id: toFactoryId,
                product_code: productCode,
                new_quantity: Number(result.to?.quantity || 0)
            }
        }
    };
});
```

> **Catatan**: `StockService.transferStock()` sudah handle validasi insufficient stock dan auto-create destination stock. Tapi perlu cek apakah parameter `notes` di-support — jika belum, tambahkan.

---

### Task 2: Update `StockService.transferStock()` — tambah parameter `notes`

**File**: `src/services/stock.service.ts` (line 187-266)

Saat ini `transferStock()` tidak menerima `notes` parameter. Tambahkan agar user bisa input keterangan transfer.

**Perubahan signature:**
```typescript
// SEBELUM:
async transferStock(
    fromFactoryId: number,
    toFactoryId: number,
    productCode: string,
    quantity: number,
    userId: number
): Promise<{ from: Stock | null; to: Stock | null }>

// SESUDAH:
async transferStock(
    fromFactoryId: number,
    toFactoryId: number,
    productCode: string,
    quantity: number,
    userId: number,
    notes?: string
): Promise<{ from: Stock | null; to: Stock | null }>
```

**Perubahan di movement creation (line 240-261):**
```typescript
// SEBELUM (line 248):
notes: JSON.stringify({ type: 'TRANSFER_OUT', productCode, toFactory: toFactoryId })

// SESUDAH:
notes: JSON.stringify({
    type: 'TRANSFER_OUT',
    productCode,
    toFactory: toFactoryId,
    userNotes: notes || ''
})

// SEBELUM (line 260):
notes: JSON.stringify({ type: 'TRANSFER_IN', productCode, fromFactory: fromFactoryId })

// SESUDAH:
notes: JSON.stringify({
    type: 'TRANSFER_IN',
    productCode,
    fromFactory: fromFactoryId,
    userNotes: notes || ''
})
```

---

### Task 3: Tambah `stockApi.transfer()` di frontend API

**File**: `frontend/src/services/api.ts`

Cari block `stockApi` (sekitar line 83-89), tambah method `transfer`:

```typescript
export const stockApi = {
    getAll: (params?: any) => api.get('/stocks', { params }),
    getById: (id: number) => api.get(`/stocks/${id}`),
    create: (data: any) => api.post('/stocks', data),
    update: (id: number, data: any) => api.put(`/stocks/${id}`, data),
    delete: (id: number) => api.delete(`/stocks/${id}`),
    // NEW: Transfer stock between factories
    transfer: (data: { fromFactoryId: number; toFactoryId: number; productCode: string; quantity: number; notes?: string }) =>
        api.post('/stocks/transfer', data),
};
```

---

### Task 4: Tambah UI Transfer di Stocks.tsx

**File**: `frontend/src/pages/production/Stocks.tsx`

#### A. Tambah state untuk transfer modal:
```typescript
const [showTransferModal, setShowTransferModal] = useState(false);
const [transferForm, setTransferForm] = useState({
    fromFactoryId: 0,
    toFactoryId: 0,
    productCode: '',
    quantity: '',
    notes: ''
});
const [transferLoading, setTransferLoading] = useState(false);
```

#### B. Tambah import `useToast` (jika belum):
```typescript
import { useToast } from '../../contexts/ToastContext';
// di dalam component:
const { showSuccess, showError } = useToast();
```

#### C. Tambah fungsi openTransferModal dan handleTransfer:

```typescript
const openTransferModal = (stock?: Stock) => {
    // Pre-fill jika dipanggil dari row tertentu
    if (stock && stock.product_type) {
        setTransferForm({
            fromFactoryId: stock.id_factory,
            toFactoryId: factories.find(f => f.id !== stock.id_factory)?.id || 0,
            productCode: stock.product_type.code,
            quantity: '',
            notes: ''
        });
    } else {
        setTransferForm({
            fromFactoryId: selectedFactory || (factories[0]?.id || 0),
            toFactoryId: factories.find(f => f.id !== selectedFactory)?.id || 0,
            productCode: '',
            quantity: '',
            notes: ''
        });
    }
    setShowTransferModal(true);
};

const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (transferForm.fromFactoryId === transferForm.toFactoryId) {
        showError('Validasi', 'Pabrik asal dan tujuan tidak boleh sama');
        return;
    }
    if (!transferForm.productCode) {
        showError('Validasi', 'Pilih produk yang akan ditransfer');
        return;
    }
    const qty = parseFloat(transferForm.quantity);
    if (!qty || qty <= 0) {
        showError('Validasi', 'Jumlah transfer harus lebih dari 0');
        return;
    }

    setTransferLoading(true);
    try {
        const res = await stockApi.transfer({
            fromFactoryId: transferForm.fromFactoryId,
            toFactoryId: transferForm.toFactoryId,
            productCode: transferForm.productCode,
            quantity: qty,
            notes: transferForm.notes || undefined
        });

        const fromFactory = factories.find(f => f.id === transferForm.fromFactoryId)?.name || 'Unknown';
        const toFactory = factories.find(f => f.id === transferForm.toFactoryId)?.name || 'Unknown';

        showSuccess('Transfer Berhasil',
            `${formatNumber(qty)} kg ${transferForm.productCode} berhasil ditransfer dari ${fromFactory} ke ${toFactory}`
        );

        setShowTransferModal(false);
        fetchData(); // Refresh stock data
    } catch (error: any) {
        showError('Transfer Gagal', error.response?.data?.message || error.message);
    } finally {
        setTransferLoading(false);
    }
};
```

#### D. Tambah tombol "Transfer Stok" di header card (sebelah "Tambah Stok"):

```tsx
<div style={{ display: 'flex', gap: 12 }}>
    {/* Category Filter */}
    <select ...> ... </select>

    {/* NEW: Transfer button */}
    <button className="btn btn-secondary" onClick={() => openTransferModal()}
        style={{ background: 'var(--info)', color: 'white', border: 'none' }}>
        <span className="material-symbols-outlined icon-sm">swap_horiz</span>
        Transfer Stok
    </button>

    <button className="btn btn-primary" onClick={() => openModal()}>
        <span className="material-symbols-outlined icon-sm">add</span>
        Tambah Stok
    </button>
</div>
```

#### E. Tambah tombol Transfer per row (di kolom Aksi, sebelum edit):

```tsx
<td style={{ textAlign: 'right' }}>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {/* NEW: Transfer button per row */}
        <button className="btn btn-ghost btn-sm" onClick={() => openTransferModal(stock)}
            title="Transfer ke pabrik lain">
            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--info)' }}>swap_horiz</span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => openModal(stock)}>
            <span className="material-symbols-outlined icon-sm">edit</span>
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(stock.id)}>
            <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
        </button>
    </div>
</td>
```

#### F. Tambah Transfer Modal (setelah existing stock modal, sebelum `</>` penutup):

```tsx
{/* Transfer Modal */}
{showTransferModal && (
    <div className="modal-overlay" onClick={() => setShowTransferModal(false)}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
                <h3 className="modal-title">
                    <span className="material-symbols-outlined" style={{ marginRight: 8, color: 'var(--info)' }}>swap_horiz</span>
                    Transfer Stok Antar Pabrik
                </h3>
                <button className="modal-close" onClick={() => setShowTransferModal(false)}>
                    <span className="material-symbols-outlined">close</span>
                </button>
            </div>
            <form onSubmit={handleTransfer}>
                <div className="modal-body">
                    {/* Transfer Direction */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 16, alignItems: 'end', marginBottom: 16 }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Dari Pabrik</label>
                            <select
                                className="form-input form-select"
                                value={transferForm.fromFactoryId}
                                onChange={(e) => setTransferForm({ ...transferForm, fromFactoryId: parseInt(e.target.value) })}
                                required
                            >
                                <option value={0}>Pilih Pabrik Asal</option>
                                {factories.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ paddingBottom: 8 }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--info)', fontSize: 28 }}>arrow_forward</span>
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Ke Pabrik</label>
                            <select
                                className="form-input form-select"
                                value={transferForm.toFactoryId}
                                onChange={(e) => setTransferForm({ ...transferForm, toFactoryId: parseInt(e.target.value) })}
                                required
                            >
                                <option value={0}>Pilih Pabrik Tujuan</option>
                                {factories.filter(f => f.id !== transferForm.fromFactoryId).map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Product Selection */}
                    <div className="form-group">
                        <label className="form-label">Produk</label>
                        <select
                            className="form-input form-select"
                            value={transferForm.productCode}
                            onChange={(e) => setTransferForm({ ...transferForm, productCode: e.target.value })}
                            required
                        >
                            <option value="">Pilih Produk</option>
                            {/* Filter: hanya tampilkan product yang ada stock-nya di factory asal */}
                            {stocks
                                .filter(s => s.id_factory === transferForm.fromFactoryId && s.quantity > 0)
                                .map(s => (
                                    <option key={s.id} value={s.product_type?.code || ''}>
                                        {s.product_type?.code} - {s.product_type?.name} ({formatNumber(s.quantity)} {s.unit})
                                    </option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Quantity + Available Stock Info */}
                    <div className="form-group">
                        <label className="form-label">Jumlah Transfer (kg)</label>
                        <input
                            type="number"
                            className="form-input"
                            value={transferForm.quantity}
                            onChange={(e) => setTransferForm({ ...transferForm, quantity: e.target.value })}
                            placeholder="0"
                            step="0.01"
                            min="0.01"
                            required
                        />
                        {/* Show available stock */}
                        {transferForm.productCode && (() => {
                            const sourceStock = stocks.find(
                                s => s.id_factory === transferForm.fromFactoryId &&
                                     s.product_type?.code === transferForm.productCode
                            );
                            return sourceStock ? (
                                <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                    Stok tersedia: <strong>{formatNumber(sourceStock.quantity)} {sourceStock.unit}</strong>
                                </small>
                            ) : null;
                        })()}
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label className="form-label">Catatan (opsional)</label>
                        <input
                            type="text"
                            className="form-input"
                            value={transferForm.notes}
                            onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                            placeholder="Contoh: Transfer PK untuk proses poles batch #123"
                        />
                    </div>

                    {/* Transfer Summary */}
                    {transferForm.productCode && transferForm.quantity && parseFloat(transferForm.quantity) > 0 && (
                        <div style={{
                            background: 'rgba(19, 127, 236, 0.1)',
                            padding: 16,
                            borderRadius: 8,
                            marginTop: 8
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--info)' }}>
                                <span className="material-symbols-outlined icon-sm">info</span>
                                <strong>Ringkasan Transfer</strong>
                            </div>
                            <p style={{ fontSize: '0.875rem', marginTop: 8, color: 'var(--text-secondary)' }}>
                                <strong>{formatNumber(parseFloat(transferForm.quantity))} kg {transferForm.productCode}</strong> akan
                                dipindahkan dari <strong>{factories.find(f => f.id === transferForm.fromFactoryId)?.name}</strong> ke
                                <strong> {factories.find(f => f.id === transferForm.toFactoryId)?.name}</strong>.
                            </p>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowTransferModal(false)}>
                        Batal
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={transferLoading}
                        style={{ background: 'var(--info)', border: 'none' }}>
                        {transferLoading ? (
                            <>
                                <span className="material-symbols-outlined animate-spin icon-sm">sync</span>
                                Memproses...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined icon-sm">swap_horiz</span>
                                Transfer Stok
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    </div>
)}
```

#### G. Perbaikan: Fetch stocks SEMUA factory untuk transfer modal

Transfer modal perlu tahu stock dari factory asal. Saat filter aktif untuk 1 factory, `stocks` state hanya berisi data factory itu. Untuk transfer, kita perlu data factory lain juga.

Tambah state `allStocks`:
```typescript
const [allStocks, setAllStocks] = useState<Stock[]>([]);
```

Fetch semua stock saat buka transfer modal:
```typescript
const openTransferModal = async (stock?: Stock) => {
    // Fetch ALL stocks (tanpa filter factory) agar dropdown produk lengkap
    try {
        const res = await stockApi.getAll({ limit: 200 });
        setAllStocks(res.data.data || res.data || []);
    } catch (e) { logger.error(e); }

    // ... rest of pre-fill logic
    setShowTransferModal(true);
};
```

Lalu di modal, gunakan `allStocks` untuk dropdown produk (bukan `stocks` yang di-filter per factory):
```tsx
{allStocks
    .filter(s => s.id_factory === transferForm.fromFactoryId && s.quantity > 0)
    .map(s => (
        <option key={s.id} value={s.product_type?.code || ''}>
            {s.product_type?.code} - {s.product_type?.name} ({formatNumber(s.quantity)} {s.unit})
        </option>
    ))
}
```

---

### Task 5: Tampilkan riwayat transfer di Stock Movements (opsional tapi recommended)

Saat ini StockMovement halaman tidak ada. Transfer tercatat sebagai movement biasa (OUT + IN dengan `reference_type: 'TRANSFER'`). Agar user tahu ada transfer, di halaman Stocks tambahkan section **"Riwayat Transfer Terbaru"** di bawah tabel.

**Tambah di Stocks.tsx — setelah chart card, sebelum closing tag:**

```tsx
{/* Recent Transfers Card */}
<div className="card" style={{ marginTop: 24 }}>
    <div className="card-header">
        <h3 className="card-title">
            <span className="material-symbols-outlined" style={{ marginRight: 8 }}>history</span>
            Riwayat Transfer Terbaru
        </h3>
    </div>
    {/* Fetch dan tampilkan stock movements where reference_type = 'TRANSFER' */}
    {/* Gunakan stockMovementApi.getAll({ reference_type: 'TRANSFER', limit: 10 }) */}
    {/* Tampilkan tabel: Tanggal, Dari, Ke, Produk, Qty, Catatan */}
</div>
```

**Fetch transfer history:**
```typescript
const [transfers, setTransfers] = useState<any[]>([]);

useEffect(() => {
    const fetchTransfers = async () => {
        try {
            const res = await api.get('/stock-movements', {
                params: { reference_type: 'TRANSFER', limit: 10, movement_type: 'OUT' }
            });
            setTransfers(res.data?.data || []);
        } catch (e) { logger.error(e); }
    };
    fetchTransfers();
}, []);
```

> **Catatan**: Setiap transfer menghasilkan 2 movements (OUT + IN). Cukup tampilkan yang OUT saja, lalu parse `notes` JSON untuk ambil `toFactory` dan `userNotes`.

Cek dulu apakah `T_getStockMovements.ts` handler sudah support filter `reference_type`. Jika belum, tambahkan di handler-nya:
```typescript
const { limit, offset, id_stock, movement_type, reference_type } = req.query;
// Pass reference_type ke repository findWithFilters
```

Cek juga `stock-movement.repository.ts` `findWithFilters()` — pastikan sudah handle `reference_type` filter.

---

## File yang Dimodifikasi — Ringkasan

| # | File | Aksi | Detail |
|---|------|------|--------|
| 1 | `types/api/T_transferStock.ts` | **NEW** | POST `/stocks/transfer` type definition |
| 2 | `implementation/T_transferStock.ts` | **NEW** | Handler — panggil `StockService.transferStock()` |
| 3 | `src/services/stock.service.ts` | **EDIT** | Tambah parameter `notes` di `transferStock()` |
| 4 | `frontend/src/services/api.ts` | **EDIT** | Tambah `stockApi.transfer()` |
| 5 | `frontend/src/pages/production/Stocks.tsx` | **EDIT** | Tombol transfer, modal transfer, riwayat transfer |
| 6 | `implementation/T_getStockMovements.ts` | **VERIFY** | Pastikan filter `reference_type` di-support |
| 7 | `src/repositories/stock-movement.repository.ts` | **VERIFY** | Pastikan `findWithFilters` handle `reference_type` |

---

## Verification

1. **Transfer dari UI:**
   - Buka `/production/stocks` → pilih factory PMD 1
   - Pastikan ada stok PK atau Glosor > 0
   - Klik tombol "Transfer Stok" di header ATAU klik icon transfer (swap_horiz) di row PK
   - Modal transfer muncul: Dari = PMD 1, Ke = PMD 2, Produk = PK (pre-filled jika dari row)
   - Isi quantity (misal 5000 kg), tambah catatan
   - Summary box muncul di bawah: "5.000 kg PK akan dipindahkan dari PMD 1 ke PMD 2"
   - Klik "Transfer Stok" → Toast sukses

2. **Validasi stok:**
   - Setelah transfer: Stok PK di PMD 1 berkurang 5.000 kg
   - Toggle ke PMD 2: Stok PK bertambah 5.000 kg
   - Jika transfer lebih dari available stock → Error "Insufficient stock"

3. **Validasi factory:**
   - Pilih factory asal = factory tujuan → Error "Pabrik asal dan tujuan tidak boleh sama"
   - Dropdown "Ke Pabrik" otomatis hide factory yang sama dengan "Dari Pabrik"

4. **Riwayat transfer:**
   - Section "Riwayat Transfer Terbaru" menampilkan transfer yang baru dilakukan
   - Kolom: Tanggal, Produk, Qty, Dari → Ke, Catatan

5. **Stock movements:**
   - Di database: 2 records StockMovement (OUT dari PMD 1, IN di PMD 2)
   - reference_type = 'TRANSFER'
   - notes berisi JSON dengan `type`, `productCode`, `toFactory`/`fromFactory`, `userNotes`

6. `npm run build` — no TypeScript errors

---

## Catatan Penting

- **Backend sudah siap**: `StockService.transferStock()` sudah fully implemented dan tested. Yang dibutuhkan hanya wiring (endpoint + UI).
- **Enum TRANSFER**: Tidak perlu tambah enum `TRANSFER` di Prisma. Service sudah handle dengan pattern `OUT` + `IN` + `reference_type: 'TRANSFER'`. Ini lebih baik karena tidak perlu migrasi schema.
- **Auth level**: Endpoint transfer menggunakan `ADMIN` auth, bukan `SUPERUSER`. Transfer adalah operasi bisnis normal, bukan operasi admin/developer.
- **Pre-fill dari row**: Saat user klik icon transfer di row stock tertentu, modal pre-fill factory asal + product code. Ini UX improvement yang signifikan.
- **Dropdown produk**: Hanya tampilkan produk yang **punya stock > 0** di factory asal. Ini mencegah transfer 0 quantity.
