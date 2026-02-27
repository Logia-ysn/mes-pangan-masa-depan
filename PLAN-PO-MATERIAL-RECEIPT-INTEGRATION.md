# PLAN: Integrasi Purchase Order ↔ Material Receipt & Reorganisasi Modul Pengadaan

## Latar Belakang

Saat ini ada **dua jalur penerimaan barang yang terpisah dan tidak saling terhubung**:

| Jalur | Flow | Fitur | Masalah |
|-------|------|-------|---------|
| **Pembelian** | PO → GoodsReceipt → Stok langsung available | Tracking PO, partial receive | Tidak ada QC, quarantine, approval, payment |
| **Penerimaan Bahan** | MaterialReceipt → Quarantine → Approve → Available → Bayar | QC, quarantine, approval, payment, PDF, audit | Tidak terhubung ke PO |

**Dampak:** Manager tidak tahu PO sudah diterima berapa. Penerimaan raw material bisa bypass QC lewat GoodsReceipt. Duplikasi effort input data.

## Solusi: Opsi B — Hubungkan Tanpa Merge

1. Tambahkan link `PurchaseOrder` di `MaterialReceipt` (optional)
2. Saat MaterialReceipt dibuat dari PO, auto-update `received_quantity` di PO item
3. GoodsReceipt tetap ada untuk **barang non-raw material** saja
4. Reorganisasi sidebar menjadi satu modul "Pengadaan"

---

## STEP 1: Schema Migration

### File: `prisma/schema.prisma`

**1a. Tambahkan field di model `MaterialReceipt`:**

```prisma
model MaterialReceipt {
  // ... field existing ...
  
  // === TAMBAHKAN FIELD BARU ===
  id_purchase_order       Int?
  id_purchase_order_item  Int?
  
  // === TAMBAHKAN RELASI BARU ===
  PurchaseOrder      PurchaseOrder?     @relation(fields: [id_purchase_order], references: [id], onDelete: NoAction, onUpdate: NoAction)
  PurchaseOrderItem  PurchaseOrderItem? @relation(fields: [id_purchase_order_item], references: [id], onDelete: NoAction, onUpdate: NoAction)
  
  // === TAMBAHKAN INDEX ===
  @@index([id_purchase_order])
}
```

**1b. Update model `PurchaseOrder` — tambahkan relasi balik:**

```prisma
model PurchaseOrder {
  // ... field existing ...
  GoodsReceipt      GoodsReceipt[]
  MaterialReceipt   MaterialReceipt[]    // <<< TAMBAHKAN
  // ... sisa relasi ...
}
```

**1c. Update model `PurchaseOrderItem` — tambahkan relasi balik:**

```prisma
model PurchaseOrderItem {
  // ... field existing ...
  GoodsReceiptItem  GoodsReceiptItem[]
  MaterialReceipt   MaterialReceipt[]    // <<< TAMBAHKAN
  // ... sisa relasi ...
}
```

**1d. Jalankan migration:**

```bash
npx prisma migrate dev --name add-po-link-to-material-receipt
npx prisma generate
```

---

## STEP 2: Backend — Update MaterialReceipt Service

### File: `src/services/material-receipt.service.ts`

**2a. Update `CreateMaterialReceiptDTO` — tambahkan field PO:**

```typescript
export interface CreateMaterialReceiptDTO {
    // ... existing fields ...
    id_purchase_order?: number;       // <<< TAMBAHKAN
    id_purchase_order_item?: number;  // <<< TAMBAHKAN
}
```

**2b. Update method `create()` — tambahkan logika PO linkage:**

Di dalam `prisma.$transaction`, **setelah** create `MaterialReceipt` dan **sebelum** audit log, tambahkan blok berikut:

```typescript
// === PO LINKAGE: Update received_quantity on PO Item ===
if (dto.id_purchase_order && dto.id_purchase_order_item) {
    // Validasi: PO harus status APPROVED atau SENT atau PARTIAL_RECEIVED
    const po = await tx.purchaseOrder.findUnique({
        where: { id: dto.id_purchase_order },
        include: { PurchaseOrderItem: true }
    });
    if (!po) throw new BusinessRuleError('Purchase Order tidak ditemukan');
    
    const allowedStatuses = ['APPROVED', 'SENT', 'PARTIAL_RECEIVED'];
    if (!allowedStatuses.includes(po.status)) {
        throw new BusinessRuleError(
            `PO status "${po.status}" tidak bisa menerima barang. Status harus: ${allowedStatuses.join(', ')}`
        );
    }
    
    // Validasi: Quantity tidak melebihi sisa PO item
    const poItem = po.PurchaseOrderItem.find(i => i.id === dto.id_purchase_order_item);
    if (!poItem) throw new BusinessRuleError('PO Item tidak ditemukan');
    
    const remaining = Number(poItem.quantity) - Number(poItem.received_quantity);
    if (dto.quantity > remaining) {
        throw new BusinessRuleError(
            `Quantity (${dto.quantity} kg) melebihi sisa PO (${remaining} kg). Total PO: ${poItem.quantity} kg, Sudah diterima: ${poItem.received_quantity} kg`
        );
    }
    
    // Update received_quantity di PO Item
    await tx.purchaseOrderItem.update({
        where: { id: dto.id_purchase_order_item },
        data: {
            received_quantity: { increment: dto.quantity }
        }
    });
    
    // Update PO status berdasarkan total penerimaan
    const updatedPOItems = await tx.purchaseOrderItem.findMany({
        where: { id_purchase_order: dto.id_purchase_order }
    });
    
    const allReceived = updatedPOItems.every(
        item => Number(item.received_quantity) >= Number(item.quantity)
    );
    const someReceived = updatedPOItems.some(
        item => Number(item.received_quantity) > 0
    );
    
    let newPOStatus = po.status;
    if (allReceived) {
        newPOStatus = 'RECEIVED';
    } else if (someReceived) {
        newPOStatus = 'PARTIAL_RECEIVED';
    }
    
    if (newPOStatus !== po.status) {
        await tx.purchaseOrder.update({
            where: { id: dto.id_purchase_order },
            data: { status: newPOStatus as any }
        });
    }
}
```

Juga pastikan `receipt` create data menyertakan field baru:

```typescript
const receipt = await tx.materialReceipt.create({
    data: {
        // ... existing fields ...
        id_purchase_order: dto.id_purchase_order || null,       // <<< TAMBAHKAN
        id_purchase_order_item: dto.id_purchase_order_item || null, // <<< TAMBAHKAN
    }
});
```

**2c. Update method `delete()` — rollback PO received_quantity:**

Saat MaterialReceipt dihapus dan punya PO link, kurangi `received_quantity`:

```typescript
// Di dalam delete transaction, sebelum hapus receipt:
if (receipt.id_purchase_order_item) {
    await tx.purchaseOrderItem.update({
        where: { id: receipt.id_purchase_order_item },
        data: {
            received_quantity: { decrement: Number(receipt.quantity) }
        }
    });
    
    // Recalculate PO status
    const poItems = await tx.purchaseOrderItem.findMany({
        where: { id_purchase_order: receipt.id_purchase_order! }
    });
    const someReceived = poItems.some(i => Number(i.received_quantity) > 0);
    const allReceived = poItems.every(i => Number(i.received_quantity) >= Number(i.quantity));
    
    await tx.purchaseOrder.update({
        where: { id: receipt.id_purchase_order! },
        data: {
            status: allReceived ? 'RECEIVED' : someReceived ? 'PARTIAL_RECEIVED' : 'APPROVED'
        }
    });
}
```

**2d. Update query `findAll` dan `findById` — include PO data:**

Di repository `src/repositories/material-receipt.repository.ts`, tambahkan include:

```typescript
include: {
    // ... existing includes ...
    PurchaseOrder: {
        select: {
            id: true,
            po_number: true,
            order_date: true,
            status: true,
            Supplier: { select: { id: true, name: true } }
        }
    },
    PurchaseOrderItem: {
        select: {
            id: true,
            quantity: true,
            received_quantity: true,
            unit_price: true,
            ProductType: { select: { id: true, code: true, name: true } }
        }
    }
}
```

---

## STEP 3: Backend — API Baru untuk Fetch PO Items

### File: Buat endpoint baru atau tambahkan ke existing

Tambahkan endpoint `GET /purchase-orders/:id/receivable-items` yang mengembalikan PO items yang belum fully received, khusus untuk dropdown di form MaterialReceipt.

### File: `implementation/T_getPOReceivableItems.ts`

```typescript
// GET /purchase-orders/:id/receivable-items
// Return PO items yang masih bisa diterima (received_quantity < quantity)
// Include: product type info, remaining quantity

export const handler = async (req, res) => {
    const poId = parseInt(req.params.id);
    
    const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: {
            Supplier: { select: { id: true, name: true, code: true } },
            Factory: { select: { id: true, name: true, code: true } },
            PurchaseOrderItem: {
                include: {
                    ProductType: {
                        include: { RiceVariety: true }
                    }
                }
            }
        }
    });
    
    if (!po) return res.status(404).json({ error: 'PO not found' });
    
    // Filter items yang masih bisa diterima
    const receivableItems = po.PurchaseOrderItem
        .filter(item => Number(item.received_quantity) < Number(item.quantity))
        .map(item => ({
            ...item,
            remaining_quantity: Number(item.quantity) - Number(item.received_quantity)
        }));
    
    return { po, receivableItems };
};
```

### File: Route registration

Tambahkan route di router file yang sesuai:

```typescript
router.get('/purchase-orders/:id/receivable-items', authMiddleware, handler);
```

### File: `frontend/src/services/api.ts`

Tambahkan method di `purchaseOrderApi`:

```typescript
export const purchaseOrderApi = {
    // ... existing ...
    getReceivableItems: (id: number) => api.get(`/purchase-orders/${id}/receivable-items`),
};
```

Juga tambahkan endpoint `GET /purchase-orders/open` yang mengembalikan PO dengan status APPROVED/SENT/PARTIAL_RECEIVED (PO yang masih bisa menerima barang):

```typescript
// Di purchaseOrderApi:
getOpen: (params?: { id_factory?: number; id_supplier?: number }) => 
    api.get('/purchase-orders', { 
        params: { ...params, status: 'APPROVED,SENT,PARTIAL_RECEIVED' } 
    }),
```

> **Catatan:** Jika API GET `/purchase-orders` sudah support filter `status`, cukup gunakan itu. Jika belum, tambahkan support multi-status filter di backend (split by comma).

---

## STEP 4: Frontend — Update Form Penerimaan Bahan Baku

### File: `frontend/src/pages/production/RawMaterialReceipt.tsx`

**4a. Tambahkan state baru:**

```typescript
// PO Selection State
const [openPOs, setOpenPOs] = useState<any[]>([]);
const [selectedPO, setSelectedPO] = useState<number | null>(null);
const [poItems, setPOItems] = useState<any[]>([]);
const [selectedPOItem, setSelectedPOItem] = useState<number | null>(null);
const [loadingPO, setLoadingPO] = useState(false);
```

**4b. Fetch open POs saat factory berubah:**

```typescript
useEffect(() => {
    if (selectedFactory) {
        fetchOpenPOs();
    }
}, [selectedFactory]);

const fetchOpenPOs = async () => {
    try {
        const res = await purchaseOrderApi.getOpen({ id_factory: selectedFactory });
        const data = res.data?.data || res.data || [];
        setOpenPOs(data);
    } catch (error) {
        logger.error('Failed to fetch open POs', error);
    }
};
```

**4c. Fetch receivable items saat PO dipilih:**

```typescript
const handlePOSelect = async (poId: number | null) => {
    setSelectedPO(poId);
    setSelectedPOItem(null);
    setPOItems([]);
    
    if (!poId) return;
    
    setLoadingPO(true);
    try {
        const res = await purchaseOrderApi.getReceivableItems(poId);
        const data = res.data?.data || res.data;
        setPOItems(data.receivableItems || []);
        
        // Auto-fill supplier dari PO
        const po = data.po;
        if (po?.Supplier) {
            setFormData(prev => ({
                ...prev,
                supplierId: String(po.Supplier.id),
            }));
        }
    } catch (error) {
        logger.error('Failed to fetch PO items', error);
    } finally {
        setLoadingPO(false);
    }
};
```

**4d. Auto-fill form saat PO Item dipilih:**

```typescript
const handlePOItemSelect = (poItemId: number | null) => {
    setSelectedPOItem(poItemId);
    if (!poItemId) return;
    
    const item = poItems.find(i => i.id === poItemId);
    if (!item) return;
    
    // Auto-fill dari PO item
    setFormData(prev => ({
        ...prev,
        // product type & variety akan di-resolve otomatis saat save
        pricePerKg: String(item.unit_price),
        // Set max quantity hint di UI
        netWeight: '', // kosongkan, biar operator isi aktual
    }));
    
    // Jika PO item punya varietyId, set juga
    if (item.ProductType?.RiceVariety) {
        setFormData(prev => ({
            ...prev,
            varietyId: String(item.ProductType.RiceVariety.id),
        }));
    }
};
```

**4e. Tambahkan PO selection di form UI:**

Tambahkan di bagian atas form (sebelum field Batch ID), dua dropdown baru:

```tsx
{/* === PO Selection (Optional) === */}
<div className="form-section">
    <label className="form-label">
        Referensi PO <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(opsional)</span>
    </label>
    
    {/* Dropdown: Pilih PO */}
    <select
        className="form-input"
        value={selectedPO || ''}
        onChange={e => handlePOSelect(e.target.value ? Number(e.target.value) : null)}
    >
        <option value="">— Tanpa PO (pembelian langsung) —</option>
        {openPOs.map(po => (
            <option key={po.id} value={po.id}>
                {po.po_number} — {po.Supplier?.name} ({po.status})
            </option>
        ))}
    </select>
    
    {/* Dropdown: Pilih PO Item — muncul hanya jika PO dipilih */}
    {selectedPO && (
        <>
            <label className="form-label" style={{ marginTop: 8 }}>
                Item PO
            </label>
            {loadingPO ? (
                <div>Memuat item PO...</div>
            ) : poItems.length === 0 ? (
                <div style={{ color: 'var(--warning)' }}>Semua item PO sudah diterima lengkap</div>
            ) : (
                <select
                    className="form-input"
                    value={selectedPOItem || ''}
                    onChange={e => handlePOItemSelect(e.target.value ? Number(e.target.value) : null)}
                >
                    <option value="">— Pilih item —</option>
                    {poItems.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.ProductType?.name} — Sisa: {item.remaining_quantity} kg 
                            (Total PO: {Number(item.quantity)} kg, Sudah diterima: {Number(item.received_quantity)} kg)
                        </option>
                    ))}
                </select>
            )}
        </>
    )}
</div>
```

**4f. Update `handleSave()` — kirim id_purchase_order ke backend:**

Di object `payload` yang dikirim ke `materialReceiptApi.create()`, tambahkan:

```typescript
const payload = {
    // ... existing fields ...
    id_purchase_order: selectedPO || undefined,              // <<< TAMBAHKAN
    id_purchase_order_item: selectedPOItem || undefined,     // <<< TAMBAHKAN
};
```

**4g. Tampilkan info PO di tabel list:**

Di kolom tabel daftar penerimaan, tambahkan kolom baru atau tampilkan PO number di bawah batch code:

```tsx
{/* Di baris tabel, setelah kolom batch code atau receipt number */}
<td>
    {batch.receiptNumber}
    {batch.poNumber && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            PO: {batch.poNumber}
        </div>
    )}
</td>
```

Ini memerlukan update di mapping data dari API response ke interface `RawMaterialBatch`. Tambahkan field:

```typescript
interface RawMaterialBatch {
    // ... existing ...
    poNumber?: string;           // dari PurchaseOrder.po_number
    poItemRemaining?: number;    // sisa quantity PO item
}
```

Dan di mapping response `fetchData()`:

```typescript
const mapped: RawMaterialBatch = {
    // ... existing mapping ...
    poNumber: item.PurchaseOrder?.po_number || '',
};
```

---

## STEP 5: Frontend — Reorganisasi Sidebar

### File: `frontend/src/components/Layout/Sidebar.tsx`

**Ubah struktur sidebar dari:**

```
📦 Pembelian
   ├── Purchase Order
   ├── Penerimaan Barang
   └── Supplier

📥 Penerimaan Bahan
   ├── Daftar Penerimaan
   └── QC Bahan Baku
```

**Menjadi:**

```
📦 Pengadaan
   ├── Purchase Order
   ├── Penerimaan Bahan Baku     ← MaterialReceipt (raw material, dengan QC)
   ├── Penerimaan Barang Umum    ← GoodsReceipt (non-raw material)
   ├── QC Bahan Baku
   └── Supplier
```

**Kode perubahan di `navItems`:**

Hapus dua item lama (`Pembelian` dan `Penerimaan Bahan`), ganti dengan satu item baru:

```typescript
{
    label: 'Pengadaan',
    icon: 'local_shipping',
    children: [
        { label: 'Purchase Order', to: '/purchasing/purchase-orders' },
        { label: 'Penerimaan Bahan Baku', to: '/receiving/raw-materials' },
        { label: 'Penerimaan Barang Umum', to: '/purchasing/goods-receipts' },
        { label: 'QC Bahan Baku', to: '/receiving/qc-gabah' },
        { label: 'Supplier', to: '/purchasing/suppliers' },
    ]
},
```

> **Catatan:** Route path (`/purchasing/...` dan `/receiving/...`) tidak perlu diubah. Hanya grouping visual di sidebar yang berubah.

---

## STEP 6: Tampilkan Penerimaan di PO Detail

### File: `frontend/src/pages/purchasing/PurchaseOrderDetail.tsx`

Tambahkan section baru di halaman detail PO yang menampilkan daftar MaterialReceipt terkait.

**6a. Fetch MaterialReceipts berdasarkan PO:**

```typescript
const [linkedReceipts, setLinkedReceipts] = useState<any[]>([]);

useEffect(() => {
    if (po?.id) {
        fetchLinkedReceipts(po.id);
    }
}, [po]);

const fetchLinkedReceipts = async (poId: number) => {
    try {
        const res = await materialReceiptApi.getAll({ id_purchase_order: poId });
        setLinkedReceipts(res.data?.data || res.data || []);
    } catch (error) {
        logger.error('Failed to fetch linked receipts', error);
    }
};
```

> **Catatan:** Backend GET `/material-receipts` perlu support query param `id_purchase_order` untuk filter. Tambahkan di repository query.

**6b. Render section "Riwayat Penerimaan" di PO detail:**

Setelah tabel PO items, tambahkan card:

```tsx
{/* Riwayat Penerimaan */}
<div className="card" style={{ marginTop: 24 }}>
    <div className="card-header">
        <h3 className="card-title">Riwayat Penerimaan Bahan Baku</h3>
        <span className="badge badge-info">{linkedReceipts.length} penerimaan</span>
    </div>
    {linkedReceipts.length === 0 ? (
        <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
            Belum ada penerimaan untuk PO ini
        </div>
    ) : (
        <div className="table-container">
            <table style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th>No. Receipt</th>
                        <th>Tanggal</th>
                        <th>Batch</th>
                        <th className="text-right">Quantity</th>
                        <th>Status</th>
                        <th>QC Grade</th>
                    </tr>
                </thead>
                <tbody>
                    {linkedReceipts.map(r => (
                        <tr key={r.id}>
                            <td className="font-mono">{r.receipt_number}</td>
                            <td>{formatDate(r.receipt_date)}</td>
                            <td><span className="badge badge-default">{r.batch_code}</span></td>
                            <td className="text-right font-mono">{formatNumber(r.quantity)} kg</td>
                            <td><StatusBadge status={r.status} /></td>
                            <td>{r.quality_grade || '-'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )}
</div>
```

---

## STEP 7: Backend — Filter MaterialReceipt by PO

### File: `src/repositories/material-receipt.repository.ts`

Tambahkan filter `id_purchase_order` di method `findAll`:

```typescript
// Di query params / where clause:
if (params.id_purchase_order) {
    where.id_purchase_order = Number(params.id_purchase_order);
}
```

---

## STEP 8: Validasi & Guard di GoodsReceipt

### File: `src/services/purchase-order.service.ts` → method `receiveGoods()`

Tambahkan warning/guard: jika PO item adalah kategori `RAW_MATERIAL`, **tolak** pembuatan GoodsReceipt dan arahkan ke MaterialReceipt:

```typescript
// Di awal method receiveGoods, setelah fetch PO:
for (const item of items) {
    const poItem = po.PurchaseOrderItem.find(i => i.id === item.id_purchase_order_item);
    if (poItem?.ProductType?.category === 'RAW_MATERIAL') {
        throw new BusinessRuleError(
            `Item "${poItem.ProductType.name}" adalah bahan baku. Gunakan halaman Penerimaan Bahan Baku untuk menerima bahan baku dengan QC dan quarantine.`
        );
    }
}
```

---

## Urutan Eksekusi

```
STEP 1 → Schema migration (5 menit)
STEP 2 → Backend MaterialReceipt service (30-45 menit)
STEP 3 → Backend API endpoint baru (20 menit)
STEP 7 → Backend filter by PO (10 menit)
STEP 8 → Backend guard GoodsReceipt (10 menit)
STEP 4 → Frontend form update (45-60 menit)
STEP 5 → Frontend sidebar reorganisasi (5 menit)
STEP 6 → Frontend PO detail section (30 menit)
```

**Total estimasi: 3-4 jam**

---

## Testing Checklist

- [ ] Create MaterialReceipt **tanpa** PO → harus tetap bisa (backward compatible)
- [ ] Create MaterialReceipt **dengan** PO → PO item `received_quantity` bertambah
- [ ] Create MaterialReceipt dengan quantity > sisa PO → harus error
- [ ] Create MaterialReceipt dari PO status DRAFT → harus error
- [ ] Delete MaterialReceipt yang linked ke PO → `received_quantity` berkurang
- [ ] PO status auto-update: APPROVED → PARTIAL_RECEIVED → RECEIVED
- [ ] GoodsReceipt untuk item RAW_MATERIAL → harus ditolak dengan pesan arahkan ke MaterialReceipt
- [ ] GoodsReceipt untuk non-raw material → tetap bisa
- [ ] Sidebar menampilkan satu grup "Pengadaan" dengan 5 child items
- [ ] PO detail menampilkan riwayat MaterialReceipt terkait
- [ ] Form Penerimaan Bahan: dropdown PO muncul, auto-fill supplier & harga
- [ ] Semua route lama (`/purchasing/*`, `/receiving/*`) tetap bisa diakses

---

## File yang Diubah

| File | Aksi | Deskripsi |
|------|------|-----------|
| `prisma/schema.prisma` | EDIT | Tambah field + relasi PO di MaterialReceipt |
| `src/services/material-receipt.service.ts` | EDIT | PO linkage di create, rollback di delete |
| `src/repositories/material-receipt.repository.ts` | EDIT | Include PO, filter by PO |
| `src/services/purchase-order.service.ts` | EDIT | Guard raw material di receiveGoods |
| `implementation/T_getPOReceivableItems.ts` | CREATE | Endpoint baru: PO receivable items |
| `frontend/src/services/api.ts` | EDIT | Tambah `getReceivableItems`, `getOpen` |
| `frontend/src/pages/production/RawMaterialReceipt.tsx` | EDIT | PO selection UI, auto-fill, kirim PO id |
| `frontend/src/pages/purchasing/PurchaseOrderDetail.tsx` | EDIT | Section riwayat penerimaan |
| `frontend/src/components/Layout/Sidebar.tsx` | EDIT | Merge 2 grup jadi 1 "Pengadaan" |

**Tidak ada file yang dihapus. Tidak ada route yang berubah. Full backward compatible.**
