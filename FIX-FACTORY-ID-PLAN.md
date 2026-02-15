# Fix Factory ID Bug — Implementation Plan

## Context & Bug Report

**Bug yang dilaporkan:**
1. User toggle ke PMD 1 di Penerimaan Bahan Baku
2. Input penerimaan padi (GKP), lalu Save
3. Batch **tidak muncul** di filter PMD 1, tapi **muncul di "Semua"**
4. Saat input Worksheet di PMD 1, batch padi tersebut **tidak tersedia** untuk dipilih

**Root Cause yang ditemukan:**

Di `RawMaterialReceipt.tsx` line 279-281, saat save penerimaan:
```typescript
// BUG: Fetch ALL stocks tanpa filter factory!
const stocksResponse = await stockApi.getAll();
const stocks = ...;
// BUG: Ambil stock pertama yang ditemukan, bisa dari factory manapun!
let targetStock = stocks.length > 0 ? stocks[0] : null;
```

Stock movement yang dibuat terhubung ke `id_stock` milik factory lain (misal PMD 2), sehingga:
- Filter `m.otm_id_stock?.id_factory !== selectedFactory` menyingkirkan batch ini dari view PMD 1
- WorksheetForm yang filter `stockApi.getAll({ id_factory: selectedFactory })` juga tidak menemukan batch ini

**Masalah tambahan:** Bahkan jika factory benar, stock yang dipilih tidak mempertimbangkan `id_product_type` — harusnya match ke jenis bahan (GKP, GKG, PK, dll) yang dipilih di form.

### Tech Stack
- **Frontend**: React 19 + Vite 7 + Plain CSS
- **Backend**: Node.js + Express + NAIV framework + Prisma ORM + PostgreSQL
- **Stock Schema**: `Stock` punya `id_factory` + `id_product_type` (unique constraint)

### Dampak Bug Ini
- Semua penerimaan bahan baku tersimpan di stock yang salah
- Stok per pabrik tidak akurat
- Worksheet tidak bisa memilih batch bahan baku yang sudah diterima
- Laporan stok dan produksi per factory menjadi tidak reliable

---

## Bug Map — Semua Lokasi yang Perlu Diperbaiki

| # | File | Line | Bug | Severity |
|---|------|------|-----|----------|
| 1 | `RawMaterialReceipt.tsx` | 279-281 | `stockApi.getAll()` tanpa filter → `stocks[0]` ambil stock random | **CRITICAL** |
| 2 | `RawMaterialReceipt.tsx` | 279 | Tidak cocokkan `id_product_type` dengan kategori yang dipilih | **CRITICAL** |
| 3 | `RawMaterialReceipt.tsx` | 299-301 | Fallback factory ambil `factoriesResponse[0]` bukan `selectedFactory` | HIGH |
| 4 | `Machines.tsx` | 56 | `id_factory: 1` hardcoded di form initial state | MEDIUM |

---

## Task yang Harus Dikerjakan

### Task 1: Fix `handleSave()` di RawMaterialReceipt.tsx (CRITICAL)

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

**Alur yang BENAR:**
1. Tentukan `id_product_type` berdasarkan kategori bahan yang dipilih di form
2. Cari stock yang cocok: `id_factory = selectedFactory` DAN `id_product_type = productTypeId`
3. Jika tidak ada, buat stock baru dengan factory dan product type yang benar
4. Create stock movement terhadap stock tersebut

**Ganti blok `handleSave` lines 278-322** (dari comment `// 1. Try to find...` sampai sebelum `// 2. Prepare payload`) dengan:

```typescript
// 1. Determine the correct product type based on selected category
// Map category to product type (e.g., "Padi/Gabah" → GKP)
const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId));

// Find matching product type by category name/code
const productTypesResponse = await productTypeApi.getAll();
const allProductTypes = productTypesResponse.data?.data || productTypesResponse.data || [];

// Try to match product type by category code or name
let matchedProductType = allProductTypes.find((pt: any) =>
    pt.code === selectedCategory?.code ||
    pt.name === selectedCategory?.name
);

// Fallback: use GKP as default for raw material
if (!matchedProductType) {
    matchedProductType = allProductTypes.find((pt: any) => pt.code === 'GKP');
}

// If still no product type, create GKP
if (!matchedProductType) {
    const newTypeRes = await productTypeApi.create({
        code: selectedCategory?.code || 'GKP',
        name: selectedCategory?.name || 'Gabah Kering Panen',
        unit: 'kg'
    });
    matchedProductType = newTypeRes.data?.data || newTypeRes.data;
}

// 2. Find or create stock for THIS factory + THIS product type
const factoryId = selectedFactory;
if (!factoryId) {
    showError("Error", "Pilih pabrik terlebih dahulu");
    setLoading(false);
    return;
}

// Search for existing stock matching factory + product type
const stocksResponse = await stockApi.getAll({
    id_factory: factoryId,
    id_product_type: matchedProductType.id
});
const stocks = Array.isArray(stocksResponse.data) ? stocksResponse.data : stocksResponse.data?.data || [];

// Filter to exact match (in case API doesn't filter precisely)
let targetStock = stocks.find((s: any) =>
    s.id_factory === factoryId && s.id_product_type === matchedProductType.id
);

// If no matching stock exists, create one
if (!targetStock) {
    const newStockRes = await api.post('/stocks', {
        id_factory: factoryId,
        id_product_type: matchedProductType.id,
        quantity: 0,
        unit: 'kg'
    });
    targetStock = newStockRes.data?.data || newStockRes.data;
}
```

**Juga hapus blok fallback factory creation (lines 299-312)** — tidak perlu create factory dari frontend. Jika factory tidak ada, itu masalah konfigurasi.

> **PENTING**: Setelah fix ini, `targetStock` akan selalu cocok dengan factory yang dipilih DAN jenis bahan yang dipilih. Stock movement yang dibuat akan terhubung ke stock yang benar.

### Task 2: Pastikan `stockApi.getAll` support filter `id_product_type`

**File backend**: Cek `src/repositories/stock.repository.ts` atau `implementation/T_getStocks.ts`

Pastikan API `GET /stocks` menerima query param `id_product_type` selain `id_factory`. Jika belum:

**Cek di repository** (`src/repositories/stock.repository.ts`):
```typescript
async findWithFilters(params: StockListParams): Promise<{ stocks: Stock[], total: number }> {
    const where: any = {};
    if (params.id_factory) where.id_factory = params.id_factory;
    if (params.id_product_type) where.id_product_type = params.id_product_type;  // TAMBAH INI jika belum ada
    // ...
}
```

**Cek di handler** (`implementation/T_getStocks.ts`):
```typescript
const { limit, offset, id_factory, id_product_type } = req.query;  // TAMBAH id_product_type
// ... pass ke repository
```

> **Catatan**: Kemungkinan besar ini sudah ada karena stock punya unique constraint `[id_factory, id_product_type]`. Tapi verifikasi.

### Task 3: Fix hardcoded `id_factory` di Machines.tsx

**File**: `frontend/src/pages/production/Machines.tsx`

Cari line 56:
```typescript
// SEBELUM:
id_factory: 1,

// SESUDAH:
id_factory: selectedFactory || 1,
```

Dan cari line ~174 dimana form dibuat saat create:
```typescript
// Pastikan form create menggunakan selectedFactory:
id_factory: selectedFactory,
```

### Task 4: Validasi — Pastikan selectedFactory selalu ada sebelum Save

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

Di awal `handleSave()` (setelah validasi existing), tambahkan:
```typescript
if (!selectedFactory) {
    showError("Validasi", "Pilih pabrik tujuan terlebih dahulu");
    return;
}
```

Ini mencegah user save tanpa memilih factory (misalnya saat toggle "Semua").

### Task 5: Disable tombol "Semua" saat di form entry / sembunyikan form saat "Semua"

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

Saat user pilih "Semua" (selectedFactory = null), form entry seharusnya tidak bisa digunakan karena kita tidak tahu stock mana yang harus diupdate. Dua opsi:

**Opsi A (Recommended)**: Sembunyikan form saat "Semua" dipilih:
```tsx
{/* Form Card — hanya tampil jika factory dipilih */}
{selectedFactory && (
    <div className="card">
        <div className="card-header">
            <h3 className="card-title">New Batch Entry</h3>
        </div>
        {/* ... existing form ... */}
    </div>
)}
```

**Opsi B**: Tampilkan warning di atas form:
```tsx
{!selectedFactory && (
    <div className="alert alert-warning">
        Pilih pabrik tujuan sebelum menambah penerimaan bahan baku.
    </div>
)}
```

> **Catatan**: Pattern ini sudah dipakai di `Worksheets.tsx` — tombol "New Entry" hanya muncul jika `selectedFactory` terisi (line 149).

---

## File yang Perlu Dimodifikasi

| # | File | Aksi | Detail |
|---|------|------|--------|
| 1 | `frontend/src/pages/production/RawMaterialReceipt.tsx` | **EDIT** | Fix `handleSave()` stock matching logic, tambah validasi factory, hide form saat "Semua" |
| 2 | `frontend/src/pages/production/Machines.tsx` | **EDIT** | Fix hardcoded `id_factory: 1` |
| 3 | `implementation/T_getStocks.ts` (backend) | **VERIFY** | Pastikan `id_product_type` query param di-support |
| 4 | `src/repositories/stock.repository.ts` (backend) | **VERIFY** | Pastikan `findWithFilters` filter `id_product_type` |

---

## Alur Penerimaan Bahan Baku yang BENAR Setelah Fix

```
User toggle "PMD 1" → selectedFactory = id PMD-1
User pilih kategori "Padi/Gabah" → categoryId matched
User isi form → klik Save

handleSave():
  1. Cari ProductType yang cocok dengan kategori "Padi/Gabah" → GKP (id: X)
  2. Cari Stock WHERE id_factory = PMD-1 AND id_product_type = X
     - Jika ada → gunakan stock ini
     - Jika tidak → create Stock baru { id_factory: PMD-1, id_product_type: X }
  3. Create StockMovement { id_stock: <stock PMD-1 GKP>, type: IN, qty: 5000 }

Setelah save:
  - Filter PMD 1 → movement.stock.id_factory === PMD-1 ✅ MUNCUL
  - WorksheetForm PMD 1 → stockApi.getAll({ id_factory: PMD-1 }) → stock GKP ada ✅ MUNCUL
```

---

## Verification

1. ✅ Toggle ke "PMD 1"
2. ✅ Input penerimaan padi (GKP), isi form, Save
3. ✅ Batch muncul di tabel "Recent Received Batches" saat filter PMD 1
4. ✅ Batch TIDAK muncul saat filter PMD 2 (karena disimpan di stock PMD 1)
5. ✅ Batch muncul saat filter "Semua"
6. ✅ Buka Worksheet Form → pilih factory PMD 1 → "Add Batch" → batch padi muncul di daftar available stocks
7. ✅ Form entry tersembunyi saat toggle "Semua" (harus pilih factory dulu)
8. ✅ Test di PMD 2: input PK → disimpan di stock PMD 2 → muncul di filter PMD 2
9. ✅ `npm run build` — no TypeScript errors

---

## Catatan Penting

- **Data lama yang salah**: Batch yang sudah tersimpan dengan stock dari factory lain **tidak akan otomatis terperbaiki**. Jika perlu, migrasi data manual melalui database atau fitur reset.
- **Unique constraint**: Prisma schema punya `@@unique([id_factory, id_product_type])` di Stock. Jadi tidak mungkin ada duplikat stock untuk factory+product yang sama — aman untuk `findFirst` lalu `create` jika tidak ada.
- **Jangan delete stock yang sudah ada** — stock movement lama bergantung pada stock entry tersebut.
- **Backend kemungkinan sudah support filter** — cek dulu sebelum edit. Jika `GET /stocks?id_factory=1&id_product_type=5` sudah return hasil yang benar, Task 2 bisa di-skip.
