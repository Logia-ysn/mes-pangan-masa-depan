# Rekomendasi Restrukturisasi Modul & Sub-Modul
## ERP Pangan Masa Depan

**Tanggal:** 25 Februari 2026  
**Berdasarkan:** Analisis repository GitHub `Logia-ysn/erp-pangan-masa-depan`

---

## A. Kondisi Saat Ini

### Struktur Sidebar Existing

```
📊 Dashboard
🏭 Produksi
    ├── Worksheet
    ├── Penerimaan Bahan
    ├── Stok & Inventory
    ├── Mesin
    ├── Maintenance
    └── OEE Monitor
💰 Penjualan
    ├── Pelanggan
    └── Invoice
🛒 Pembelian
    └── Purchase Order
📈 Laporan
    ├── Laporan Produksi
    ├── Laporan Penjualan
    ├── HPP (COGM)
    ├── Laporan Stok
    └── Tren Kualitas
🔧 Admin Panel
    ├── Manajemen User
    └── Log Audit
⚙️ Pengaturan
```

### Masalah yang Ditemukan

1. **Modul Produksi overloaded** — Mesin, Maintenance, OEE, QC, Inventory semua dijadikan satu di bawah "Produksi". Ini membuat navigasi bingung dan tidak scalable.

2. **Inventory bukan sub-modul Produksi** — Inventory seharusnya modul mandiri karena digunakan lintas modul (produksi, penjualan, pembelian).

3. **Quality Control tersembunyi** — QCGabah ada di database dan ada page-nya, tapi tidak muncul di sidebar. Padahal QC adalah fitur unggulan (ML-powered).

4. **Database model yang belum punya UI:**
   - `Employee` + `Attendance` → Tidak ada halaman HR
   - `DailyExpense` + `ExpenseCategory` → Tidak ada halaman pengeluaran
   - `Notification` → Model ada, tapi tidak ada notification center
   - `GoodsReceipt` → Ada di DB, tapi tidak punya halaman terpisah (tersembunyi di dalam PO detail)

5. **Sub-modul Penjualan tidak lengkap** — Payment sudah ada di DB tapi tidak ada halaman khusus pembayaran/AR tracking.

6. **Pembelian terlalu minim** — Hanya 1 sub-modul (Purchase Order). Supplier management ada di Settings padahal logikanya di bawah Pembelian.

---

## B. Rekomendasi Susunan Modul yang Benar

Berikut susunan yang direkomendasikan, mengikuti **alur bisnis penggilingan padi** dari hulu ke hilir:

```
📊 Dashboard
🛒 Pembelian (Procurement)
    ├── 📦 Purchase Order
    ├── 📥 Penerimaan Barang (Goods Receipt) ← BARU (pisahkan dari PO detail)
    └── 👥 Supplier ← PINDAH dari Settings
📥 Penerimaan Bahan Baku
    ├── 📋 Daftar Penerimaan ← PINDAH dari Produksi
    ├── 🔬 QC Bahan Baku (ML Grain Analysis) ← BARU (pisahkan)
    └── ⚖️ Pengeringan (Drying Log) ← BARU
🏭 Produksi
    ├── 📝 Worksheet (Lembar Kerja Giling)
    └── 📊 Rendemen Monitor ← BARU
📦 Inventory
    ├── 📊 Stok Real-time ← PINDAH dari Produksi
    ├── 🔄 Stock Movement (Riwayat)
    ├── 🔀 Stock Transfer (Antar Pabrik) ← BARU (plan sudah ada)
    └── 📋 Stock Opname (Adjustment) ← BARU
🔬 Quality Control
    ├── 🌾 QC Gabah (ML Analysis) ← PINDAH (jadikan modul sendiri)
    ├── 🍚 QC Produk Jadi ← BARU
    ├── ⚙️ Kalibrasi Parameter
    └── 📈 Tren Kualitas ← PINDAH dari Laporan
💰 Penjualan (Sales)
    ├── 👥 Pelanggan
    ├── 📄 Invoice
    ├── 💳 Pembayaran ← BARU (page terpisah, data sudah ada di DB)
    └── 🚚 Surat Jalan (Delivery Order) ← BARU
🔧 Mesin & Maintenance
    ├── 🏗️ Daftar Mesin ← PINDAH dari Produksi
    ├── 🔧 Maintenance ← PINDAH dari Produksi
    └── 📊 OEE Monitor ← PINDAH dari Produksi
💸 Keuangan Operasional
    ├── 📒 Pengeluaran Harian (Daily Expense) ← BARU (model sudah ada di DB)
    ├── 💰 HPP / COGM ← PINDAH dari Laporan
    └── 📊 Ringkasan Keuangan ← BARU
📈 Laporan
    ├── 📊 Laporan Produksi
    ├── 📊 Laporan Penjualan
    ├── 📊 Laporan Pembelian ← BARU
    ├── 📊 Laporan Stok
    └── 📊 Laporan Keuangan ← BARU
👤 Admin Panel
    ├── 👥 Manajemen User
    ├── 👨‍💼 Data Karyawan ← BARU (model Employee sudah ada)
    ├── 📋 Absensi ← BARU (model Attendance sudah ada)
    └── 📜 Log Audit
⚙️ Pengaturan
    ├── 🏭 Factory
    ├── 🍚 Product Type & Material Config
    ├── 🌾 Varietas Padi
    ├── 📊 Quality Parameter
    └── 🔢 Batch Numbering Config
```

---

## C. Detail Sub-Modul Baru yang Direkomendasikan

### 1. 📥 Penerimaan Barang / Goods Receipt (Terpisah)

**Status:** Model DB sudah ada (`GoodsReceipt`, `GoodsReceiptItem`), tapi UI hanya bisa diakses dari dalam PurchaseOrderDetail.

**Rekomendasi:** Buat halaman tersendiri `/purchasing/goods-receipts` yang menampilkan semua penerimaan barang dengan filter tanggal, supplier, dan status PO.

**Kenapa penting:** Operator gudang yang menerima barang biasanya bukan orang yang sama yang membuat PO. Mereka butuh akses langsung tanpa harus buka PO dulu.


### 2. ⚖️ Pengeringan / Drying Log

**Status:** Belum ada model maupun UI.

**Rekomendasi:** Tambahkan model `DryingLog` dan halaman untuk mencatat:
- Batch gabah (dari lot penerimaan)
- Berat awal (GKP)
- Berat akhir (GKG)
- Kadar air awal & akhir
- Metode pengeringan (jemur / dryer)
- Durasi pengeringan
- Susut pengeringan (otomatis hitung)

**Kenapa penting:** Pengeringan menyebabkan susut 8-15% — ini berpengaruh besar ke HPP. Saat ini susut ini tidak tercatat di manapun.

**Skema DB yang disarankan:**
```prisma
model DryingLog {
  id                Int       @id @default(autoincrement())
  id_factory        Int
  id_user           Int
  batch_code        String    @db.VarChar(50)
  drying_date       DateTime  @db.Date
  method            DryingMethod @default(SUN_DRY)
  initial_weight    Decimal   @db.Decimal(15, 2)
  final_weight      Decimal   @db.Decimal(15, 2)
  initial_moisture  Decimal   @db.Decimal(5, 2)
  final_moisture    Decimal   @db.Decimal(5, 2)
  duration_hours    Decimal   @db.Decimal(5, 2)
  shrinkage_kg      Decimal?  @db.Decimal(15, 2)  // auto-calculated
  shrinkage_pct     Decimal?  @db.Decimal(5, 2)   // auto-calculated
  notes             String?
  created_at        DateTime  @default(now())
}

enum DryingMethod {
  SUN_DRY
  MECHANICAL_DRYER
  MIXED
}
```


### 3. 📊 Rendemen Monitor

**Status:** Rendemen dihitung di Worksheet, tapi tidak ada dashboard khusus.

**Rekomendasi:** Buat halaman `/production/rendemen` yang menampilkan:
- Grafik tren rendemen harian/mingguan/bulanan
- Perbandingan rendemen per varietas gabah
- Perbandingan rendemen per supplier gabah
- Alert jika rendemen turun di bawah target
- Rata-rata rendemen per mesin

**Kenapa penting:** Rendemen adalah KPI #1 penggilingan padi. Kalau rendemen turun, bisa jadi indikasi masalah di mesin, kualitas gabah, atau operator.


### 4. 🔀 Stock Transfer (Antar Pabrik)

**Status:** Ada file `STOCK-TRANSFER-PLAN.md` dan field `from_factory_id`, `to_factory_id`, `transfer_id` di StockMovement, tapi belum ada halaman UI.

**Rekomendasi:** Buat halaman `/inventory/transfers` untuk:
- Buat transfer request (dari factory A ke factory B)
- Approve transfer (oleh supervisor/manager)
- Konfirmasi penerimaan di factory tujuan
- Riwayat transfer

**Kenapa penting:** Dengan multi-factory (PMD-1 & PMD-2), transfer stok antar pabrik pasti terjadi dan perlu tercatat.


### 5. 📋 Stock Opname / Adjustment

**Status:** StockMovement sudah punya type `ADJUSTMENT`, tapi belum ada UI khusus.

**Rekomendasi:** Buat halaman `/inventory/stock-opname` untuk:
- Pilih warehouse/factory → load semua stok
- Input qty aktual hasil hitung fisik
- Sistem otomatis hitung selisih (surplus/shortage)
- Generate adjustment movement otomatis
- Approval oleh manager sebelum adjustment dieksekusi
- Riwayat stock opname

**Kenapa penting:** Untuk industri pangan, stock opname wajib dilakukan berkala karena susut alami, hama, dan kelembaban.


### 6. 🍚 QC Produk Jadi

**Status:** Belum ada. QC saat ini hanya untuk gabah (bahan baku).

**Rekomendasi:** Buat fitur QC untuk beras output:
- Kadar air beras (target ≤14% sesuai SNI)
- Persentase broken/patah → menentukan grade (premium/medium)
- Derajat sosoh (whiteness)
- Benda asing
- Link ke batch worksheet

**Kenapa penting:** Kualitas beras output menentukan harga jual dan kepuasan pelanggan.


### 7. 💳 Halaman Pembayaran (Payment)

**Status:** Model `Payment` sudah ada dan fungsional, tapi pembayaran hanya bisa diakses dari dalam InvoiceDetail.

**Rekomendasi:** Buat halaman `/sales/payments` yang menampilkan:
- Daftar semua pembayaran masuk
- Filter by customer, metode pembayaran, periode
- Summary: total piutang, total sudah dibayar, total outstanding
- Aging report (piutang 30/60/90 hari)

**Kenapa penting:** Bagian keuangan/kasir perlu melihat semua pembayaran sekaligus tanpa harus buka invoice satu per satu.


### 8. 🚚 Surat Jalan (Delivery Order)

**Status:** Belum ada model maupun UI.

**Rekomendasi:** Tambah model `DeliveryOrder`:
- Link ke Invoice
- Nomor surat jalan
- Tanggal kirim, tanggal terima
- Detail item yang dikirim (bisa partial delivery)
- Nama sopir, nomor kendaraan
- Status: PENDING → IN_TRANSIT → DELIVERED
- Cetak surat jalan (PDF)

**Kenapa penting:** Invoice dan pengiriman sering tidak bersamaan. Surat jalan juga diperlukan untuk bukti serah terima barang.


### 9. 📒 Pengeluaran Harian (Daily Expense)

**Status:** Model `DailyExpense` dan `ExpenseCategory` sudah ada di DB, tapi belum ada halaman UI.

**Rekomendasi:** Buat halaman `/finance/expenses` untuk:
- Input pengeluaran harian (BBM, makan karyawan, transportasi, dll)
- Kategorisasi pengeluaran
- Upload bukti/kwitansi
- Summary pengeluaran per hari/minggu/bulan
- Perbandingan antar periode

**Kenapa penting:** Model DB sudah siap, tinggal buat UI-nya. Data ini juga akan memperkaya perhitungan HPP.


### 10. 👨‍💼 Data Karyawan & Absensi

**Status:** Model `Employee` dan `Attendance` sudah ada di DB lengkap dengan field NIK, gaji, status kepegawaian, dll. Tapi belum ada halaman UI.

**Rekomendasi:**
- `/admin/employees` — CRUD data karyawan, filter per factory, status aktif/nonaktif
- `/admin/attendance` — Rekap absensi, input manual, summary kehadiran per bulan

**Kenapa penting:** Model DB sudah lengkap dan siap digunakan. Meskipun HRD dan Keuangan di-scope keluar, data karyawan dasar tetap dibutuhkan untuk tracking siapa yang mengoperasikan mesin, siapa yang membuat worksheet, dll.


### 11. 🔔 Notification Center

**Status:** Model `Notification` sudah ada dengan type `LOW_STOCK`, `OVERDUE_INVOICE`, `OVERDUE_MAINTENANCE`, dan `SYSTEM`.

**Rekomendasi:** Tambahkan:
- Bell icon di header dengan badge count unread
- Dropdown/panel notifikasi
- Halaman `/notifications` untuk riwayat lengkap
- Mark as read, mark all as read
- Auto-generate notifikasi ketika:
  - Stok di bawah minimum
  - Invoice jatuh tempo
  - Jadwal maintenance terlewat
  - Rendemen turun signifikan

**Kenapa penting:** Sistem notifikasi proaktif akan sangat membantu operasional sehari-hari.

---

## D. Ringkasan Prioritas Pengembangan

| Prioritas | Sub-Modul Baru | Effort | Alasan |
|-----------|---------------|--------|--------|
| 🔴 Tinggi | Pengeluaran Harian (Daily Expense) | Rendah | DB sudah ada, tinggal UI |
| 🔴 Tinggi | Halaman Pembayaran (Payment) | Rendah | DB sudah ada, tinggal UI |
| 🔴 Tinggi | Data Karyawan | Rendah | DB sudah ada, tinggal UI |
| 🔴 Tinggi | Goods Receipt (terpisah) | Rendah | DB sudah ada, pisahkan dari PO |
| 🔴 Tinggi | Notification Center | Rendah | DB sudah ada, butuh UI + trigger |
| 🟡 Sedang | Stock Transfer | Sedang | Field DB ada, butuh flow lengkap |
| 🟡 Sedang | Stock Opname | Sedang | Butuh model + UI baru |
| 🟡 Sedang | Drying Log (Pengeringan) | Sedang | Butuh model + UI baru |
| 🟡 Sedang | Rendemen Monitor | Sedang | Data ada di worksheet, butuh dashboard |
| 🟡 Sedang | QC Produk Jadi | Sedang | Butuh model + UI baru |
| 🟢 Rendah | Surat Jalan | Sedang | Butuh model + UI + PDF |
| 🟢 Rendah | Absensi | Rendah | DB sudah ada, tinggal UI |
| 🟢 Rendah | Laporan Pembelian & Keuangan | Sedang | Butuh aggregation query |

**Quick Wins (effort rendah, impact tinggi):** 5 sub-modul prioritas 🔴 bisa dikerjakan duluan karena model database-nya sudah ada — tinggal buat halaman frontend dan API endpoint.

---

## E. Perubahan Navigasi yang Direkomendasikan

Restrukturisasi sidebar dari **6 modul** menjadi **10 modul** yang lebih terorganisir:

| # | Modul | Sub-Modul | Catatan |
|---|-------|-----------|---------|
| 1 | Dashboard | — | Tetap |
| 2 | Pembelian | PO, Goods Receipt, Supplier | Supplier pindah dari Settings |
| 3 | Penerimaan Bahan | Daftar Penerimaan, QC Bahan, Drying Log | Pisah dari Produksi |
| 4 | Produksi | Worksheet, Rendemen Monitor | Lebih fokus |
| 5 | Inventory | Stok, Movement, Transfer, Opname | Modul mandiri |
| 6 | Quality Control | QC Gabah, QC Produk Jadi, Kalibrasi, Tren | Modul mandiri |
| 7 | Penjualan | Pelanggan, Invoice, Pembayaran, Surat Jalan | Lebih lengkap |
| 8 | Mesin & Maintenance | Mesin, Maintenance, OEE | Pisah dari Produksi |
| 9 | Keuangan | Expense, HPP, Ringkasan | Modul baru |
| 10 | Laporan | Produksi, Penjualan, Pembelian, Stok, Keuangan | Konsolidasi |
| 11 | Admin | User, Karyawan, Absensi, Audit Log | Diperkaya |
| 12 | Pengaturan | Factory, Product Type, Varietas, Config | Tetap |

---

*Dokumen ini dibuat berdasarkan analisis kode sumber, database schema (Prisma), dan struktur navigasi frontend dari repository ERP Pangan Masa Depan.*
