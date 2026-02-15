# Print Receipt Penerimaan Bahan Baku — Implementation Plan

## Context

Kamu akan menambahkan fitur **print tanda terima** di halaman Penerimaan Bahan Baku (`/production/raw-materials`). Saat user menerima batch bahan baku, mereka perlu mencetak bukti penerimaan sebagai dokumen fisik.

### Tech Stack
- **Frontend**: React 19 + Vite 7 + Plain CSS (CSS Variables, dark/light theme)
- **Icons**: Material Symbols via `<span className="material-symbols-outlined">`
- **Print**: Browser `window.print()` + CSS `@media print` (sudah ada pattern-nya)

### Yang Sudah Ada

1. **`frontend/src/utils/printUtils.ts`** — Utility print yang sudah ada tapi BELUM PERNAH DIPAKAI:
```typescript
export const printElement = (elementId: string, title?: string) => {
    const originalTitle = document.title;
    if (title) document.title = title;
    document.body.classList.add('is-printing');
    const element = document.getElementById(elementId);
    if (element) element.classList.add('print-visible');
    window.print();
    // Cleanup after print dialog closes
    const cleanup = () => {
        document.body.classList.remove('is-printing');
        if (element) element.classList.remove('print-visible');
        if (title) document.title = originalTitle;
        window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
};

export const printPage = () => {
    window.print();
};
```

2. **CSS `@media print` di `frontend/src/index.css`** (lines ~1721-1783) — Sudah hide sidebar, header, buttons saat print:
```css
@media print {
  .sidebar, .sidebar-overlay, .header, .btn,
  .notification-dropdown, .menu-toggle, .filter-bar,
  .report-actions, .no-print {
    display: none !important;
  }
  .main-content { margin-left: 0 !important; width: 100% !important; }
  .page-content { padding: 0 !important; max-width: none !important; }
  body { background: white !important; color: black !important; }
  /* ... more rules ... */
}
```

3. **`WorksheetDetail.tsx`** — Contoh penggunaan `printPage()` (bukan `printElement`):
```tsx
import { printPage } from '../../utils/printUtils';
// ...
<button className="btn btn-secondary" onClick={printPage}>
    <span className="material-symbols-outlined icon-sm">print</span>
    Print
</button>
```

4. **Invoice PDF** — Backend PDFKit generation di `src/services/pdf.service.ts` + route di `index.ts`. Tapi untuk receipt ini kita TIDAK perlu backend PDF — cukup browser print.

### Halaman RawMaterialReceipt Saat Ini

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx` (~1131 baris)

**Interfaces yang relevan:**
```typescript
interface RawMaterialBatch {
    id: number;
    batchId: string;
    poNumber: string;
    dateReceived: string;
    supplier: string;
    materialType: string;       // Product Type Name
    qualityGrade: string;
    moistureContent: number;
    netWeight: number;
    pricePerKg: number;
    notes: string;
    deliveryNoteUrl?: string;
    createdAt: string;
    supplierId?: string;
    categoryId?: string;
    varietyId?: string;
}
```

**Layout halaman:**
1. Factory Toggle Buttons (Semua / PMD 1 / PMD 2)
2. Form Card "New Batch Entry" — inline form (bukan modal)
3. Table Card "Recent Received Batches" — tabel dengan kolom:
   - BATCH ID | DATE | SUPPLIER | MATERIAL | GRADE | NET WEIGHT | MOISTURE | ACTIONS
   - Actions saat ini: Quality Analysis (science icon), Edit (edit icon), Delete (delete icon)

**Utilities yang sudah diimport:**
```typescript
import { formatDate, formatNumber } from '../../utils/formatUtils';
```

---

## Task yang Harus Dikerjakan

### Task 1: Tambah Tombol Print & State di RawMaterialReceipt.tsx

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

**A. Tambah import `printElement`:**

Cari baris import yang ada dan tambahkan:
```typescript
import { printElement } from '../../utils/printUtils';
```

**B. Tambah state `printingBatch`:**

Di dalam component, setelah state-state yang sudah ada, tambahkan:
```typescript
const [printingBatch, setPrintingBatch] = useState<RawMaterialBatch | null>(null);
```

**C. Tambah fungsi `handlePrint`:**

Tambahkan fungsi ini di antara fungsi-fungsi handler yang sudah ada:
```typescript
const handlePrint = (batch: RawMaterialBatch) => {
    setPrintingBatch(batch);
    // Delay kecil agar DOM render printable element terlebih dahulu
    setTimeout(() => {
        printElement('receipt-print', `Tanda Terima - ${batch.batchId}`);
        setPrintingBatch(null);
    }, 100);
};
```

**D. Tambah tombol Print di kolom Actions tabel:**

Cari bagian actions di tabel "Recent Received Batches". Saat ini ada 3 tombol per row: Quality Analysis, Edit, Delete. Tambahkan tombol Print **sebelum** tombol Edit:

```tsx
{/* Print Button — TAMBAH INI */}
<button className="btn btn-ghost btn-icon btn-sm" onClick={() => handlePrint(batch)} title="Print Tanda Terima">
    <span className="material-symbols-outlined" style={{ color: 'var(--info)' }}>print</span>
</button>
```

> **Catatan**: Variabel per-row di tabel ini kemungkinan bernama `batch` atau `item` — cek nama variabel di `.map()` callback.

### Task 2: Tambah Printable Receipt Component di RawMaterialReceipt.tsx

**File**: `frontend/src/pages/production/RawMaterialReceipt.tsx`

Tambahkan blok JSX berikut **di akhir JSX component**, sebelum closing `</>` atau `</div>` terakhir:

```tsx
{/* ===== Printable Receipt — hidden di layar, hanya muncul saat print ===== */}
{printingBatch && (
    <div id="receipt-print" className="print-receipt">
        {/* Header Perusahaan */}
        <div className="receipt-header">
            <h2>PT. Pangan Masa Depan</h2>
            <h3>Tanda Terima Penerimaan Bahan Baku</h3>
        </div>

        {/* Info Batch */}
        <table className="receipt-info">
            <tbody>
                <tr>
                    <td className="receipt-label">No. Batch</td>
                    <td>: {printingBatch.batchId}</td>
                </tr>
                <tr>
                    <td className="receipt-label">No. PO</td>
                    <td>: {printingBatch.poNumber || '-'}</td>
                </tr>
                <tr>
                    <td className="receipt-label">Tanggal Terima</td>
                    <td>: {formatDate(printingBatch.dateReceived)}</td>
                </tr>
                <tr>
                    <td className="receipt-label">Supplier</td>
                    <td>: {printingBatch.supplier}</td>
                </tr>
            </tbody>
        </table>

        {/* Tabel Detail Bahan */}
        <h4 style={{ marginBottom: 8 }}>Detail Bahan</h4>
        <table className="receipt-detail-table">
            <thead>
                <tr>
                    <th>Jenis Bahan</th>
                    <th>Grade Kualitas</th>
                    <th>Kadar Air</th>
                    <th>Berat Bersih</th>
                    <th>Harga/Kg</th>
                    <th>Total Harga</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>{printingBatch.materialType}</td>
                    <td>{printingBatch.qualityGrade}</td>
                    <td>{printingBatch.moistureContent}%</td>
                    <td>{formatNumber(printingBatch.netWeight)} Kg</td>
                    <td>Rp {formatNumber(printingBatch.pricePerKg)}</td>
                    <td>Rp {formatNumber(printingBatch.netWeight * printingBatch.pricePerKg)}</td>
                </tr>
            </tbody>
        </table>

        {/* Catatan */}
        {printingBatch.notes && (
            <div className="receipt-notes">
                <strong>Catatan:</strong> {printingBatch.notes}
            </div>
        )}

        {/* Kolom Tanda Tangan */}
        <div className="receipt-signatures">
            <div className="signature-box">
                <p>Pengirim / Supplier</p>
                <div className="signature-line"></div>
                <p>({printingBatch.supplier})</p>
            </div>
            <div className="signature-box">
                <p>Penerima</p>
                <div className="signature-line"></div>
                <p>(________________)</p>
            </div>
            <div className="signature-box">
                <p>Mengetahui</p>
                <div className="signature-line"></div>
                <p>(________________)</p>
            </div>
        </div>

        {/* Footer */}
        <div className="receipt-footer">
            <p>Dicetak pada: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
        </div>
    </div>
)}
```

**Layout dokumen yang dihasilkan:**
```
┌─────────────────────────────────────────────────────┐
│              PT. Pangan Masa Depan                   │
│      Tanda Terima Penerimaan Bahan Baku              │
│─────────────────────────────────────────────────────│
│ No. Batch      : RM-20260215-001                     │
│ No. PO         : PO-001                              │
│ Tanggal Terima : 15 Feb 2026                         │
│ Supplier       : PT Supplier Jaya                    │
│                                                      │
│ Detail Bahan                                         │
│ ┌──────────┬───────┬───────┬────────┬──────┬───────┐│
│ │Jenis     │Grade  │K.Air  │Berat   │Harga │Total  ││
│ ├──────────┼───────┼───────┼────────┼──────┼───────┤│
│ │GKP       │KW 1   │14%    │5.000 Kg│2.000 │10.000 ││
│ └──────────┴───────┴───────┴────────┴──────┴───────┘│
│                                                      │
│ Catatan: Kondisi baik, sesuai standar.               │
│                                                      │
│                                                      │
│                                                      │
│  Pengirim          Penerima         Mengetahui       │
│  ___________      ___________      ___________       │
│  (Supplier)       (__________)     (__________)      │
│                                                      │
│                      Dicetak pada: 15 Februari 2026  │
└─────────────────────────────────────────────────────┘
```

### Task 3: Tambah CSS Print Styles di index.css

**File**: `frontend/src/index.css`

Tambahkan CSS berikut **di akhir file**, setelah `@media print` block yang sudah ada:

```css
/* ===== Receipt Print Styles ===== */
.print-receipt {
    display: none;
}

@media print {
    /* Saat printing receipt, tampilkan receipt dan hide semua yang lain */
    .print-receipt {
        display: block !important;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: white;
        z-index: 99999;
        padding: 40px;
        font-family: 'Arial', sans-serif;
        color: black;
    }

    /* Hide main content saat body punya class is-printing */
    body.is-printing .main-content,
    body.is-printing .sidebar,
    body.is-printing .header {
        display: none !important;
    }

    /* Receipt Header */
    .receipt-header {
        text-align: center;
        margin-bottom: 24px;
        border-bottom: 2px solid black;
        padding-bottom: 12px;
    }
    .receipt-header h2 {
        font-size: 18pt;
        margin: 0;
        color: black;
    }
    .receipt-header h3 {
        font-size: 13pt;
        margin: 4px 0 0;
        font-weight: normal;
        color: black;
    }

    /* Receipt Info Table (No. Batch, PO, Supplier, dll) */
    .receipt-info {
        width: auto;
        margin-bottom: 20px;
        border: none;
    }
    .receipt-info td {
        padding: 3px 12px 3px 0;
        border: none;
        font-size: 11pt;
        color: black;
    }
    .receipt-label {
        font-weight: bold;
        width: 140px;
    }

    /* Receipt Detail Table (Jenis Bahan, Grade, Berat, Harga) */
    .receipt-detail-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 20px;
    }
    .receipt-detail-table th,
    .receipt-detail-table td {
        border: 1px solid black;
        padding: 8px 10px;
        font-size: 10pt;
        color: black;
        text-align: left;
    }
    .receipt-detail-table th {
        background: #f0f0f0 !important;
        font-weight: bold;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
    }

    /* Catatan */
    .receipt-notes {
        margin-bottom: 24px;
        font-size: 10pt;
        padding: 8px;
        border: 1px dashed #999;
    }

    /* 3 Kolom Tanda Tangan */
    .receipt-signatures {
        display: flex;
        justify-content: space-between;
        margin-top: 48px;
    }
    .signature-box {
        text-align: center;
        width: 30%;
        font-size: 10pt;
    }
    .signature-line {
        border-bottom: 1px solid black;
        height: 60px;
        margin: 8px 0;
    }

    /* Footer (timestamp) */
    .receipt-footer {
        margin-top: 32px;
        font-size: 8pt;
        color: #666 !important;
        text-align: right;
    }
}
```

### Task 4 (Opsional): TIDAK perlu ubah `printUtils.ts`

File `printUtils.ts` **sudah lengkap dan benar**. Fungsi `printElement(elementId, title)` yang kita pakai:
1. Set `document.title` untuk judul di print dialog
2. Add class `is-printing` ke `<body>` — CSS kita gunakan ini untuk hide main content
3. Add class `print-visible` ke element target
4. Call `window.print()`
5. Cleanup saat print dialog ditutup via `afterprint` event

**Jangan ubah file ini.**

---

## File yang Perlu Dimodifikasi

| # | File | Aksi | Detail |
|---|------|------|--------|
| 1 | `frontend/src/pages/production/RawMaterialReceipt.tsx` | **EDIT** | Import `printElement`, tambah state + handler, tambah tombol Print per row, tambah printable receipt JSX |
| 2 | `frontend/src/index.css` | **EDIT** | Tambah CSS `.print-receipt` dan print-only styles di akhir file |

**Backend TIDAK perlu diubah.**

---

## Urutan Pengerjaan

1. Baca `RawMaterialReceipt.tsx` seluruhnya — pahami structure dan cari posisi yang tepat
2. Tambah import `printElement` (Task 1A)
3. Tambah state `printingBatch` (Task 1B)
4. Tambah fungsi `handlePrint` (Task 1C)
5. Cari kolom Actions di tabel, tambah tombol Print (Task 1D)
6. Tambah printable receipt JSX di akhir component (Task 2)
7. Tambah CSS print styles di akhir `index.css` (Task 3)
8. Build & verify: `cd frontend && npm run build`

---

## Verification

1. ✅ Buka `/production/raw-materials`
2. ✅ Pastikan ada data batch di tabel "Recent Received Batches"
3. ✅ Lihat tombol Print baru (icon printer warna biru) di kolom Actions setiap row
4. ✅ Klik tombol Print di salah satu row
5. ✅ Browser print dialog muncul
6. ✅ Print preview menunjukkan dokumen tanda terima dengan:
   - Header: "PT. Pangan Masa Depan" + "Tanda Terima Penerimaan Bahan Baku"
   - Info: No. Batch, No. PO, Tanggal, Supplier
   - Tabel: Jenis Bahan, Grade, Kadar Air, Berat, Harga/Kg, Total
   - Catatan (jika ada)
   - 3 kolom tanda tangan: Pengirim, Penerima, Mengetahui
   - Footer: timestamp cetak
7. ✅ Sidebar, header, form entry, semua buttons tersembunyi di print preview
8. ✅ Klik Cancel di print dialog → halaman kembali normal (tidak stuck)
9. ✅ `npm run build` — no TypeScript errors

---

## Catatan Penting

- **Jangan ubah `printUtils.ts`** — sudah benar, gunakan `printElement()` apa adanya
- **`.print-receipt` di-hide di layar** (`display: none`) — hanya muncul di `@media print`
- **`body.is-printing`** class ditambahkan oleh `printElement()` — CSS selector ini dipakai untuk hide main content
- **`formatDate` dan `formatNumber`** sudah diimport di RawMaterialReceipt.tsx — gunakan untuk format angka/tanggal
- **Dark mode aman** — print styles force `background: white` dan `color: black`
- **`setTimeout(100)`** di `handlePrint` — penting agar React punya waktu render printable element ke DOM sebelum `window.print()` dipanggil
