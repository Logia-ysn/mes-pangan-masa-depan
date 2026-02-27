# Analisa Modul Produksi — ERP Pangan Masa Depan
### Tanggal: 26 Februari 2026 | Versi: v2.26.0

---

## 1. RINGKASAN KONDISI SAAT INI

Modul produksi sudah memiliki fondasi yang kuat dengan 12 halaman frontend, workflow approval worksheet 5 tahap (DRAFT → SUBMITTED → COMPLETED/REJECTED → CANCELLED), kalkulasi HPP otomatis, batch numbering, dan audit trail. Secara arsitektur backend, `WorksheetService` sudah menggunakan transactional operations yang atomik — ini sangat baik untuk integritas data.

Namun ada beberapa **gap kritis** yang perlu ditutup agar sistem ini benar-benar reliable dan mudah dioperasikan oleh user di lapangan (operator pabrik, supervisor, manager).

---

## 2. TEMUAN & GAP ANALYSIS

### 🔴 KRITIS — Harus Segera Diperbaiki

#### 2.1 Rendemen Monitor Tidak Ada di Sidebar
**Masalah:** Halaman `/production/rendemen` sudah ada di routing (`App.tsx` line 117) tetapi **tidak terdaftar di Sidebar** (`Sidebar.tsx`). User tidak bisa mengakses halaman ini lewat navigasi normal.

**Dampak:** Fitur monitor rendemen yang sudah jadi tidak bisa digunakan.

**Solusi:** Tambahkan item `{ label: 'Monitor Rendemen', to: '/production/rendemen' }` di children modul "Produksi" pada Sidebar.

---

#### 2.2 DryingLog & QCResult Tanpa Service Layer
**Masalah:** `T_createDryingLog.ts` dan `T_createQCResult.ts` langsung mengakses Prisma tanpa melalui service layer. Tidak ada:
- Validasi bisnis (misal: `final_weight` > `initial_weight` seharusnya error)
- Kalkulasi otomatis (shrinkage seharusnya dihitung server-side, bukan dipercaya dari frontend)
- Audit trail (kedua operasi ini tidak dicatat di AuditLog)
- Pengecekan duplikasi batch code

**Dampak:** Data bisa corrupt, tidak ada jejak audit, kalkulasi bisa salah.

**Solusi:** Buat `DryingLogService` dan `QCResultService` yang:
- Validasi input (weight, moisture range, dll)
- Hitung shrinkage_kg dan shrinkage_pct di server
- Catat ke AuditLog
- Cek duplikasi batch code per tanggal

---

#### 2.3 Tidak Ada Edit & Delete untuk DryingLog dan QCResult
**Masalah:** API hanya punya `create` dan `getAll/getById`. Tidak ada endpoint `update` dan `delete`.

**Dampak:** Jika operator salah input data pengeringan atau QC, tidak bisa diperbaiki. Ini sangat mengganggu operasional harian.

**Solusi:** Tambahkan endpoint update dan delete (dengan soft-delete atau status-based) + audit trail.

---

#### 2.4 Validasi Stok Saat Approve Worksheet Kurang Ketat
**Masalah:** Di `approveWorksheet()`, stok input di-OUT-kan tanpa pengecekan apakah stok tersedia cukup. Jika antara waktu submit dan approve ada worksheet lain yang sudah menghabiskan stok, bisa terjadi **stok negatif**.

**Dampak:** Integritas data stok rusak, stok bisa bernilai negatif.

**Solusi:** Tambahkan validasi di `approveWorksheet`:
```typescript
// Sebelum stock OUT
const currentStock = await tx.stock.findUnique({ where: { id: batch.id_stock } });
if (Number(currentStock.quantity) < Number(batch.quantity)) {
  throw new BusinessRuleError(
    `Stok ${batch.Stock.ProductType.name} tidak cukup. Tersedia: ${currentStock.quantity}, Dibutuhkan: ${batch.quantity}`
  );
}
```

---

### 🟡 PENTING — Sangat Membantu Operasional

#### 2.5 Tidak Ada Hubungan DryingLog → Worksheet
**Masalah:** Drying Log dan Worksheet tidak terhubung secara data. Proses pengeringan (GKP → GKG) seharusnya menjadi input untuk worksheet produksi berikutnya, tapi sekarang operator harus input manual.

**Dampak:** Tidak ada traceability lengkap dari gabah basah → gabah kering → beras.

**Rekomendasi:** 
- Tambahkan `id_drying_log` optional di `Worksheet` atau `WorksheetInputBatch`
- Auto-link saat batch code cocok
- Tampilkan riwayat pengeringan di detail worksheet

---

#### 2.6 QC Result Tidak Terhubung ke Stock Release
**Masalah:** QC beras hanya menyimpan data. Tidak ada mekanisme yang menghubungkan hasil QC dengan pelepasan stok dari quarantine ke sellable.

**Dampak:** Tidak ada enforcement bahwa produk harus lolos QC sebelum bisa dijual. Stok bisa terjual meskipun belum QC.

**Rekomendasi:**
- Tambahkan field `qc_status` (PENDING_QC, PASSED, FAILED) di model `Stock` atau `StockMovement`
- Saat QC pass → update stok menjadi sellable
- Saat QC fail → tandai stok sebagai reject/rework
- Block penjualan untuk stok yang belum QC pass

---

#### 2.7 Tidak Ada Date Range Filter di Daftar Worksheet
**Masalah:** Halaman `Worksheets.tsx` hanya memiliki filter factory dan status. Tidak ada filter tanggal.

**Dampak:** Untuk pabrik dengan volume tinggi, user harus scroll/paging untuk menemukan worksheet tanggal tertentu.

**Solusi:** Tambahkan date picker range filter (dari-sampai) di toolbar, kirim sebagai `start_date` dan `end_date` ke API.

---

#### 2.8 Tidak Ada Print/PDF Worksheet
**Masalah:** Worksheet detail bisa dilihat di browser tapi **tidak bisa dicetak** sebagai dokumen resmi. Padahal Material Receipt dan Invoice sudah punya PDF.

**Dampak:** Supervisor tidak punya dokumen fisik untuk arsip atau tanda tangan basah.

**Rekomendasi:** Buat PDF worksheet dengan:
- Header perusahaan + logo
- Detail input batch, output, side products
- Kalkulasi HPP
- Area tanda tangan (Operator, Supervisor, Manager)
- Workflow timeline (submit/approve/reject timestamps)

---

#### 2.9 Tidak Ada Notifikasi Real-time untuk Workflow
**Masalah:** Model `Notification` sudah ada di schema, tapi tidak digunakan untuk workflow produksi. Saat operator submit worksheet, supervisor tidak mendapat notifikasi.

**Dampak:** Supervisor harus terus-menerus cek halaman worksheet untuk melihat yang menunggu approval.

**Rekomendasi:**
- Trigger notifikasi saat: worksheet submitted, approved, rejected
- Trigger notifikasi saat: stok rendah, QC failed, maintenance overdue
- Tampilkan badge count di sidebar/header

---

#### 2.10 OEE Belum Dihitung Secara Proper
**Masalah:** Halaman OEE saat ini hanya menampilkan data dasar (mesin aktif, total produksi, avg output/shift). **Tidak ada kalkulasi OEE sesungguhnya** (Availability × Performance × Quality).

**Dampak:** OEE adalah metrik paling penting di manufaktur tapi nilainya tidak tersedia.

**Rekomendasi:** Implementasi kalkulasi OEE yang benar:
```
Availability = (Planned Time - Downtime) / Planned Time
Performance  = (Actual Output / Ideal Output) per mesin
Quality      = (Good Output / Total Output) — bisa dari QC pass rate
OEE          = Availability × Performance × Quality
```
- Tampilkan OEE per mesin, per shift, dan tren harian/mingguan
- Set target OEE dan alert jika di bawah threshold

---

### 🟢 NICE TO HAVE — Meningkatkan User Experience

#### 2.11 Production Planning / Scheduling
**Status:** Belum ada sama sekali.

**Deskripsi:** Saat ini produksi bersifat reaktif — operator buat worksheet setelah selesai produksi. Tidak ada perencanaan ke depan.

**Rekomendasi:** Fase berikutnya bisa menambahkan:
- Production Order (rencana produksi harian/mingguan)
- Target output per shift
- Material requirement check (apakah stok bahan baku cukup?)
- Dashboard: planned vs actual

---

#### 2.12 Bulk Operations
**Masalah:** Tidak ada operasi massal. Supervisor yang perlu approve 10 worksheet harus buka satu per satu.

**Rekomendasi:**
- Bulk approve/reject worksheet dari halaman list
- Checkbox multi-select + action button
- Konfirmasi dialog yang menampilkan summary

---

#### 2.13 Dashboard Produksi Shift Aktif
**Masalah:** Tidak ada tampilan real-time untuk shift yang sedang berjalan.

**Rekomendasi:** Widget di dashboard yang menampilkan:
- Shift yang sedang aktif
- Mesin yang sedang berjalan
- Total input/output hari ini (running)
- Perbandingan dengan target harian

---

#### 2.14 Worksheet Template / Quick Entry
**Masalah:** `WorksheetForm.tsx` memiliki 1420 baris — form yang kompleks. Untuk operator yang mengisi form serupa setiap hari, ini bisa lambat.

**Rekomendasi:**
- Fitur "Duplikat dari Worksheet Sebelumnya" — copy mesin, operator, product type, side products
- Template per factory/shift yang bisa di-preset
- Autocomplete batch code dari drying log terakhir

---

#### 2.15 Mobile Quick Actions
**Masalah:** Meskipun sudah mobile-responsive (v2.17.0), workflow actions (submit, approve) memerlukan masuk ke detail page.

**Rekomendasi:** Swipe actions atau long-press menu di list view untuk quick approve/reject tanpa harus buka detail page. Ini kritis untuk supervisor yang kerja di lantai pabrik dengan HP.

---

## 3. PRIORITAS IMPLEMENTASI

| Prioritas | Item | Effort | Impact |
|-----------|------|--------|--------|
| **P0** | 2.1 Fix Rendemen di Sidebar | 5 menit | Tinggi |
| **P0** | 2.4 Validasi stok saat approve | 30 menit | Kritis |
| **P1** | 2.2 Service layer DryingLog & QC | 2-3 jam | Tinggi |
| **P1** | 2.3 Edit/Delete DryingLog & QC | 2 jam | Tinggi |
| **P1** | 2.7 Date range filter worksheet | 1 jam | Medium |
| **P1** | 2.8 PDF worksheet | 3-4 jam | Tinggi |
| **P2** | 2.5 Link DryingLog ↔ Worksheet | 3 jam | Medium |
| **P2** | 2.6 QC → Stock release flow | 4-5 jam | Tinggi |
| **P2** | 2.9 Notifikasi workflow | 3-4 jam | Tinggi |
| **P2** | 2.10 Kalkulasi OEE proper | 4 jam | Medium |
| **P3** | 2.12 Bulk operations | 3 jam | Medium |
| **P3** | 2.14 Quick entry/template | 4 jam | Medium |
| **P3** | 2.11 Production planning | 2-3 hari | Rendah (fase lanjut) |
| **P3** | 2.13 Dashboard shift aktif | 3-4 jam | Rendah |
| **P3** | 2.15 Mobile quick actions | 2-3 jam | Rendah |

---

## 4. CATATAN TEKNIS

### Yang Sudah Bagus ✅
- **Transactional operations** di WorksheetService — semua stock movement atomik
- **Workflow status machine** yang ketat (DRAFT → SUBMITTED → dst)
- **Audit trail** yang sudah terintegrasi di worksheet lifecycle  
- **Batch numbering system** yang otomatis dan terstandarisasi
- **HPP calculation** server-side yang memperhitungkan raw material + production cost - side product revenue
- **Role-based access** untuk setiap action (submit hanya creator, approve hanya supervisor+)
- **Stock reversal** saat cancel worksheet yang sudah completed

### Yang Perlu Perhatian ⚠️
- File `.DS_Store` ter-commit ke repo (tambahkan ke `.gitignore`)
- `backend.log` ter-commit (7688 baris) — seharusnya di `.gitignore`
- Beberapa test file di root (`test-api.js`, `test-qc.ts`, dll) — pindah ke folder `tests/`
- `refactor.py` (312 baris) di root — sebaiknya di `scripts/`

---

*Dokumen ini dibuat berdasarkan analisa kode sumber repository per 26 Februari 2026.*
