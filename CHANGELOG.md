# Changelog

## [2.27.0] - 2026-03-02

### Refactored
- **Refaktorisasi Worksheet Service (5 Fase)** — Dekomposisi *God Service* 952 baris menjadi arsitektur modular terstruktur:
  - **Phase 1 — Foundation**: Shared constants (`worksheet.constants.ts`), centralized backend types (`worksheet.types.ts`), frontend types (`worksheet.types.ts`), dan UI config (`worksheet.config.ts`).
  - **Phase 2 — Backend Decomposition**: Ekstraksi 3 service fokus dari `worksheet.service.ts`:
    - `hpp-calculator.service.ts` (45 baris) — Kalkulasi HPP & rendemen
    - `worksheet-stock.service.ts` (241 baris) — Stock IN/OUT movements & reversals
    - `worksheet-workflow.service.ts` (253 baris) — State machine Submit/Approve/Reject/Cancel
  - **Phase 3 — Backend Quality**: Penggantian `any` types → `Prisma.WorksheetUncheckedCreateInput` / `UncheckedUpdateInput`, nullable JSON → `Prisma.JsonNull`.
  - **Phase 4 — Frontend Decomposition**: Ekstraksi custom hooks (`useHPPCalculation`, `useInputBatches`, `useSideProducts`) dan eliminasi 132 baris interface/config duplikat dari `Worksheets.tsx` dan `WorksheetForm.tsx`.
  - **Phase 5 — Cleanup**: Penghapusan 311 baris deprecated methods, konsolidasi DTOs/constants ke shared modules dengan re-export backward-compatible.

### Diubah
- **worksheet.service.ts**: 952 → 403 baris (reduksi 57.7%)
- **WorksheetForm.tsx**: 1,420 → 1,341 baris (-79 baris inline types/config)
- **Worksheets.tsx**: 436 → 383 baris (-53 baris inline types/config)
- **Zero Breaking Changes** — Semua public API tetap identik, hanya internal restructuring.

## [2.26.0] - 2026-02-26

### Ditambahkan
- **Fase 4: Restrukturisasi Database & Modul Baru** — Menyelesaikan migrasi database Prisma secara keseluruhan untuk modul Production, Inventory, dan Sales.
- **Delivery Order (Surat Jalan)** — Penambahan modul DO dengan tabel baru `DeliveryOrder` & `DeliveryOrderItem`, relasi mendalam ke Invoice, serta form cetak surat jalan di frontend (`/sales/delivery-orders`).
- **QC Produk Jadi (QC Beras)** — Modul otomatisasi evaluasi kualitas beras pasca-produksi (`/production/qc-results`) yang mencakup pemantauan moisture, milling degree, broken percentage, dan visual grade.
- **Drying Log (Log Penjemuran)** — Pemantauan efisiensi pengeringan gabah (`/production/drying-logs`), lengkap dengan kalkulasi penyusutan otomatis berdasarkan berat gabah basah awal dan gabah kering.
- **Financial Summary Dashboard** — Dasbor ringkasan performa finansial real-time (Revenue, Expense, Gross Profit) pada tampilan eksekutif beranda aplikasi. Menggabungkan arus kas operasional, penjualan, dan pembelian bahan secara dinamis.

## [2.25.0] - 2026-02-25

### Ditambahkan
- **Restrukturisasi Sidebar** — Navigasi direorganisasi dari 6 modul menjadi 11 modul mengikuti alur bisnis hulu ke hilir: Pembelian → Penerimaan Bahan → Produksi → Inventory → Penjualan → Keuangan → Mesin & Maintenance → Laporan → Admin Panel.
- **Halaman Rendemen Monitor** (`/production/rendemen`) — Dashboard visualisasi tren rendemen gabah ke beras per pabrik dengan grafik dan indikator performa produksi versus target.
- **Halaman Absensi Karyawan** (`/admin/attendance`) — Tabel presensi harian dengan badge status (Hadir, Absen, Sakit, Izin, Terlambat) dan form input cepat untuk menambah data absensi baru.
- **Halaman Riwayat Transfer Stok** (`/inventory/transfers`) — Tampilan daftar riwayat pergerakan stok (transfer) antar lokasi pabrik atau gudang.
- **Halaman Pembayaran** (`/sales/payments`) — Riwayat pembayaran masuk dengan filter metode, summary cards (total, cash/transfer), dan tabel berpaginasi.
- **Halaman Data Karyawan** (`/admin/employees`) — Manajemen data personel dengan filter pencarian, pabrik, dan status (aktif/nonaktif).
- **Halaman Penerimaan Barang** (`/purchasing/goods-receipts`) — Daftar goods receipt terpisah dari detail PO dengan ringkasan dan paginasi.
- **Halaman Pengeluaran Harian** (`/finance/expenses`) — Pencatatan biaya operasional harian dengan summary cards dan tabel berkategori.
- **Modul Keuangan** — Modul sidebar baru untuk fitur keuangan (Pengeluaran Harian).
- **API Baru Terkait Karyawan & Absensi** — Endpoint `GET /attendances` dan `POST /attendances` dengan repository baru.
- **API DailyExpense** — Backend endpoint baru `GET /daily-expenses` dengan repository, filter pabrik, dan range tanggal.

### Diubah
- **Navigasi QC Bahan Baku** — QC Gabah yang sebelumnya tersembunyi kini tampil di sidebar di bawah modul Penerimaan Bahan.
- **Route Legacy** — Semua route lama (`/production/stocks`, `/production/machines`, dll.) otomatis redirect ke route baru.
- **Pembelian diperluas** — Modul Pembelian sekarang mencakup Purchase Order, Penerimaan Barang, dan Supplier.

## [2.24.0] - 2026-02-23

### Ditambahkan
- **Integrasi Audit Log Worksheet** — Setiap langkah workflow worksheet (`Submit`, `Approve`, `Reject`, `Cancel`) kini dicatat secara detail dalam Audit Log, termasuk data HPP dan alasan penolakan.
- **Audit Log Penerimaan Bahan Baku** — Pelacakan otomatis untuk pembuatan, persetujuan, dan pembayaran kwitansi bahan baku guna menjamin integritas data keuangan dan stok.
- **Pencatatan CRUD Worksheet** — Operasi pembuatan, pembaruan, dan penghapusan worksheet sekarang memiliki rekam jejak yang dapat diaudit oleh administrator.
- **Auto-Logging Material Receipt Operations** — Integrasi Audit Log pada `MaterialReceiptService` untuk seluruh aksi status (`WAITING_APPROVAL`, `APPROVED`, `PAID`).

### Diubah
- **Optimasi UI Workflow Worksheet** — Perbaikan layout pada dropdown filter status dan tombol aksi untuk mencegah elemen terpotong pada resolusi tertentu.
- **Peningkatan Visual Worksheet Detail** — Penambahan banner status yang lebih informatif dan detail eksekutor (Submitter/Approver) untuk transparansi alur kerja.

### Diperbaiki
- **Text Cut-off Bug** — Memperbaiki masalah visual pada status filter di halaman daftar worksheet dengan penyesuaian padding dan ukuran font yang lebih ergonomis.

## [2.23.0] - 2026-02-23

### Ditambahkan
- **Model MaterialReceipt** — Tabel database baru khusus untuk penerimaan bahan baku, menggantikan pendekatan sebelumnya yang hanya bergantung pada `StockMovement`. Mencakup relasi lengkap ke `Supplier`, `Factory`, `ProductType`, dan `User`.
- **Alur Persetujuan 3 Tahap** — Implementasi siklus status `WAITING_APPROVAL → APPROVED → PAID` dengan pelacakan timestamp (`approved_at`, `paid_at`) dan kontrol akses berbasis role.
- **PaymentModal** — Komponen modal baru untuk mencatat pembayaran dengan pilihan metode (Cash/Transfer/Giro) dan referensi pembayaran.
- **Nomor Kwitansi Otomatis** — Sistem penomoran kwitansi otomatis (`RCV-YYMMDD-SEQ`) untuk dokumentasi formal.
- **Quarantine Stock** — Penambahan field `quarantine_quantity` pada model `Stock` untuk pelacakan material yang masuk sebelum lolos QC.
- **Watermark PDF Invoice** — Stamp watermark berbasis status (DRAFT/SENT/PAID/PARTIAL/CANCEL) pada laporan PDF invoice, termasuk teks diagonal dan badge pojok halaman.
- **PDF Penerimaan Material** — PDF profesional halaman penuh untuk kwitansi penerimaan bahan baku dengan kop surat, hasil analisis kualitas, dan kolom tanda tangan.

### Diubah
- **Filter Status UI** — Penambahan filter status penerimaan (Semua/Menunggu/Disetujui/Lunas) pada halaman Penerimaan Bahan Baku.
- **Analisis Visual (Global Only)** — `GreenPercentage` sekarang selalu menggunakan parameter global tanpa bergantung pada pemilihan varietas padi.
- **Cleanup Kode Densitas** — Penghapusan komentar konversi densitas yang verbose dan standarisasi ke `g/ml` dengan presisi 3 desimal.
- **Dummy Generator** — Diperbarui untuk mendukung model `MaterialReceipt` baru.

## [2.22.0] - 2026-02-22

### Ditambahkan
- **Parameter Kualitas Spesifik IR 64** — Implementasi tabel acuan densitas khusus untuk varietas IR 64 (0.58 - 1.00 g/ml).
- **Fallback Parameter Global** — Sistem otomatis menggunakan parameter General jika varietas padi tidak dipilih atau tidak memiliki parameter spesifik.

### Diubah
- **Standarisasi Unit Densitas (g/ml)** — Mengubah unit perhitungan dari g/L ke g/ml (0.6 - 1.0) pada frontend, backend, dan database.
- **Logika Analisis Visual (Global Only)** — Menetapkan pengecekan "Green Percentage" selalu merujuk pada parameter Global tanpa bergantung pada varietas padi.
- **Presisi PDF & UI** — Peningkatan presisi angka densitas menjadi 3 desimal (contoh: 0.860) pada modal input dan laporan PDF.
- **Relasi Database QA** — Optimasi `calculateGrade` untuk menangani prioritas `Variety Specific > Global`.

## [2.21.0] - 2026-02-18

### Diubah
- **Refaktor Tren Kualitas (SPC)** — Pembaruan UI Dasbor Kualitas dengan estetika premium, perbaikan layout grafik (Recharts), dan penambahan loading state menggunakan `LogoLoader`.
- **Redesain Print-Out Penerimaan Padi** — Tata letak tanda terima yang lebih profesional dengan Kop Surat, logo perusahaan di sisi kiri, dan struktur informasi dua kolom.
- **Optimasi Logo Loader** — Penggunaan logo transparan (tanpa box putih) untuk tampilan loading yang lebih halus dan terintegrasi dengan tema aplikasi.

## [2.20.0] - 2026-02-17

### Ditambahkan
- **Unified Audit Log System** — Implementasi sistem jejak audit terpusat untuk mencatat setiap aktivitas pengguna dan perubahan data sensitif.
- **Audit Dashboard** — Antarmuka premium di Admin Panel untuk memantau log aktivitas dengan fitur filter, paginasi, dan detail JSON perbandingan data (*Before vs After*).
- **Auto-Logging Services** — Integrasi otomatis Audit Log pada `StockService`, `AuthService`, dan `InvoiceService`.
- **Infrastruktur PWA (Pondasi)** — Persiapan awal untuk mendukung mode offline dan instalasi aplikasi pada perangkat mobile/desktop.

### Diubah
- **Database Schema Upgrade** — Penambahan model `AuditLog` dengan index performa tinggi pada timestamp dan table name.
- **Frontend Dependencies** — Integrasi `date-fns` dan `lucide-react` untuk visualisasi data yang lebih profesional.

## [2.19.1] - 2026-02-16

### Ditambahkan
- **Upload Surat Jalan & Tanda Terima** — Fitur unggah file dokumen fisik pada saat penerimaan bahan baku untuk meningkatkan akuntabilitas data.
- **Penyimpanan Dokumen Terkategori** — Folder otomatis untuk `surat-jalan` dan `tanda-terima` di server backend.

### Diperbaiki
- **Konektivitas Vercel-Railway** — Konfigurasi CORS yang lebih fleksibel untuk mendukung domain Vercel dan perbaikan deteksi URL API pada mode production.
- **Startup Port Railway** — Penanganan port eksplisit (`process.env.PORT`) untuk menjamin backend aktif di lingkungan cloud.

## [2.19.0] - 2026-02-16

### Ditambahkan
- **Sistem Penomoran Batch Otomatis** — Kode batch terstandarisasi untuk semua produk (bahan baku, barang jadi, produk sampingan)
- **BatchNumberingService** — Service baru untuk generate kode batch dengan format: `{Pabrik}{Jenis}{Varietas}{Level}-{YYMMDD}-{Seq}`
- **Database Schema** — Model `BatchCodeMapping` dan `BatchSequence` untuk mapping parameter dan tracking sequence harian
- **Auto-Seed** — Mapping kode batch otomatis di-seed saat server pertama kali start

### Diubah
- **Penerimaan Barang** — Otomatis generate kode batch saat menerima bahan baku melalui PO
- **Worksheet Produksi** — Otomatis generate kode batch untuk output utama dan produk sampingan
- **Stock Movement** — Setiap pergerakan stok sekarang mencatat `batch_code` untuk audit trail lengkap
- **Dummy Generator** — Menggunakan sistem batch numbering baru (bukan format hardcode)
- **Hard Reset** — Termasuk pembersihan tabel `BatchSequence` dan `BatchCodeMapping`

## [2.18.0] - 2026-02-16

### Ditambahkan
- **Sistem Klasifikasi Material Baru**: Implementasi master data `RiceVariety`, `RiceLevel`, dan `RiceBrand` untuk standarisasi penamaan produk (SKU).
- **Automated SKU Generator**: Fitur pembuatan SKU otomatis yang menggabungkan level, varietas, dan merk secara sistematis.
- **Factory-Product Linking**: Otomatisasi pendaftaran produk ke pabrik (`FactoryMaterialConfig`) saat pembuatan SKU guna mempermudah alur produksi.
- **Master Data Seeding**: Penambahan kategori proses produksi (Drying, Hulling, Whitening, etc.) ke database untuk pelacakan alur kerja yang lebih detail.

### Diubah
- **Redesain Premium SKU Selector**: Pembaruan antarmuka seleksi produk dengan estetika premium (1.5px border, solid backgrounds, dan hover animations).
- **Enhanced Dummy Generator**: Generator batch data kini mendukung sistem klasifikasi baru dan menghasilkan alur produksi multi-varietas (IR64, Ciherang).
- **Hard Reset Logic**: Pembaruan sistem reset total guna menangani dependensi tabel baru dan menjamin integritas data (Foreign Key constraints).

### Diperbaiki
- **SKU Creation Error**: Perbaikan error 500 saat membuat SKU baru akibat ketidaksesuaian nama field antara frontend dan backend.
- **Constraint Violation on Reset**: Memperbaiki kegagalan fitur Hard Reset saat menghapus data dengan relasi kompleks.

## [2.17.1] - 2026-02-16

### Diperbaiki
- **Mobile Navigation Stability**: Perbaikan isu *blur* pada sidebar mobile melalui optimasi `z-index` (9999) dan penataan ulang urutan render DOM di `Layout.tsx`.
- **Sidebar Legibility**: Menggunakan latar belakang putih solid pada mobile guna menjamin keterbacaan menu navigasi saat *overlay* aktif.

## [2.17.0] - 2026-02-15

### Ditambahkan
- **Mobile-Responsive Architecture**: Implementasi pola *horizontal scroll* pada penyeleksi pabrik (Factory Selector) di seluruh aplikasi (10+ halaman) untuk navigasi mobile yang lebih bersih tanpa tumpang tindih.
- **Typography Scaling**: Sistem penskalaan otomatis (Dynamic Sizing) untuk judul (h1-h3) guna mengoptimalkan keterbacaan dan estetika pada perangkat layar kecil.

### Diubah
- **Dashboard Mobile Optimization**: Penyesuaian padding kartu dan tata letak grid dashboard agar lebih fungsional dan premium di perangkat mobile.
- **Header Mobile Behavior**: Menyembunyikan elemen sekunder (pencarian, sub-judul) pada resolusi tertentu untuk mencegah penumpukan elemen di header.

### Diperbaiki
- **Penerimaan Bahan Baku (Full Fields)**: Melengkapi field Nomor Telepon, Kontak Person, dan Kode pada fitur tambah cepat Supplier, Kategori, dan Varietas.
- **Production Build Integrity**: Membersihkan variabel tidak terpakai dan unused imports untuk menjamin kelancaran build Vercel/Railway.

## [2.16.0] - 2026-02-15

### Ditambahkan
- **Fitur Quick Add Lengkap**: Menambahkan field Kontak Person, Telepon, dan Deskripsi pada modal tambah cepat Supplier, Kategori, dan Varietas di modul Penerimaan Bahan Baku agar sinkron dengan menu Pengaturan.

### Diubah
- **Responsive Full-Width Layout**: Mengoptimasi `.main-container` dan `.page-content` di `index.css` untuk tampilan layar penuh yang lebih luas dan responsif (menghapus batasan lebar 1600px).
- **Finalisasi Sentralisasi Header**: Menghapus duplikasi komponen Header lokal di 11+ halaman (Settings, InvoiceDetail, PurchaseOrderDetail, dll) untuk menggunakan Header global yang dikelola secara terpusat di `Layout.tsx`.

### Diperbaiki
- **Bug Code Duplication**: Memperbaiki issue duplikasi `return` dan error linting pada `Users.tsx` dan `RawMaterialReceipt.tsx`.
- **UI Overflow Fix**: Memperbaiki masalah teks overlap pada sidebar dan konten utama saat resolusi layar menengah.

## [2.15.5] - 2026-02-15

### Diubah
- **Refaktor Global UI & UX**: Melakukan standarisasi tampilan pada halaman utama (Worksheets, Stocks, Customers, Machines, Maintenance, Invoices, Purchase Orders, Raw Material Receipt, QC Gabah).
- **Implementasi Server-Side Pagination**: Menambahkan fitur paginasi sisi server pada seluruh tabel data utama untuk mengoptimasi performa saat menangani dataset besar.
- **Sentralisasi Header**: Menghapus deklarasi header lokal di setiap halaman dan menggunakan komponen `Header` global yang dikelola melalui `Layout` dan `routeUtils`.
- **Standardisasi Format Data**: Mengintegrasikan `formatUtils` di seluruh aplikasi untuk konsistensi penulisan mata uang (Rupiah), tanggal, dan angka.
- **Integrasi useFactory Hook**: Menggunakan hook `useFactory` untuk manajemen seleksi pabrik yang konsisten di seluruh modul produksi dan purchasing.
- **Peningkatan Visual & Feedback**: Implementasi sistem toast notifikasi (`useToast`) yang lebih konsisten dan perbaikan layout grid/modal untuk pengalaman pengguna yang lebih premium.


## [2.15.0] - 2026-02-15


### Keamanan & Integritas Data (Audit Fixes)
- **Transactional Stock Operations**: Melakukan refaktor pada `StockService` untuk mendukung *pass-through transactions*. Semua operasi stok di `InvoiceService` dan `PurchaseOrderService` sekarang berjalan dalam satu paket transaksi database yang atomik, mencegah ketidaksiapan stok jika terjadi error di tengah proses.
- **ID Normalization**: Menormalisasi input ID dari request path menjadi tipe data `Number` pada modul Customer dan Supplier untuk mencegah error *type mismatch* pada repositori.
- **Improved Filter Mapping**: Memperbaiki logika filter `is_active` pada list Customer dan Supplier agar mengenali nilai boolean dari parameter query string dengan benar.
- **Advanced Validation Layer**: Menambahkan layer validasi data di endpoint pembuatan Invoice dan Purchase Order untuk memastikan data yang dikirim lengkap sebelum diproses oleh service.

### Optimasi Kode & UX
- **Unified Dashboard Service**: Menggabungkan pengambilan statistik karyawan ke dalam `DashboardService` untuk mengurangi request redundant dan menyederhanakan alur data dashboard.
- **Frontend useFactory Hook**: Implementasi custom hook `useFactory` untuk sentralisasi manajemen seleksi pabrik, persistensi pilihan di `localStorage`, dan optimasi performa dashboard.
- **Error Handling Architecture**: Menambahkan kelas `InternalServerError` standar dan memperkuat penanganan error pada level repositori.

## [2.14.0] - 2026-02-15

### Keamanan & Integritas Data
- **Data Type Migration**: Mengubah tipe data `id_machines` dan `id_operators` di tabel `Worksheet` dari String menjadi **Json** native PostgreSQL. Ini memungkinkan query yang lebih efisien dan terstruktur untuk pelacakan penggunaan mesin dan personel.
- **Race Condition Protection**: Menambahkan suffix random (3 karakter) pada pembuatan nomor **Purchase Order (PO)** dan **Goods Receipt (GR)**. Hal ini mencegah kegagalan transaksi (*unique constraint violation*) jika terdapat pembuatan dokumen di detik yang sama oleh beberapa user.
- **Service Optimization**: Menghapus redundant `JSON.stringify` pada logic pemetaan Worksheet karena sekarang menggunakan tipe data Json native Prisma.
- **Quick Operator Creation Fix**: Backend sekarang otomatis menghasilkan `employee_code` jika tidak diisi, memungkinkan penambahan operator baru secara instan melalui modal di form Worksheet tanpa error validasi database.
- **Bug Fix**: Menambahkan log error yang lebih deskriptif pada fallback update stok produksi jika tipe produk tidak ditemukan.

## [2.12.0] - 2026-02-15

### Ditambahkan
- **Multi-Selection Mesin & Operator**: Memungkinkan pemilihan lebih dari satu mesin dan satu operator pada Worksheet Produksi.
- **UI/UX Baru Worksheet**: Mengganti dropdown tradisional dengan tombol badge interaktif untuk pemilihan Mesin dan Operator yang lebih cepat.
- **Skema Database Baru**: Penambahan kolom `id_machines` dan `id_operators` pada tabel `Worksheet` (JSON storage).
- **Detail View Enhanced**: Menampilkan seluruh daftar mesin dan personel yang terlibat dalam satu shift produksi sebagai daftar badge yang rapi.

### Diperbaiki
- **API Data Resolution**: Sinkronisasi penarikan data karyawan dan mesin pada halaman detail agar ID numerik berubah menjadi nama yang terbaca.
- **Backward Compatibility**: Memastikan data worksheet lama tetap muncul dengan benar meskipun belum memiliki data multi-selection.

### Backup
- **Full System Backup**: Melakukan backup database dan source code lengkap (v2.12.0) sebelum penutupan sesi tugas ini.

## [2.11.0] - 2026-02-15

### Ditambahkan
- **Fitur Biaya Lain-lain (Overhead)**: Menambahkan input biaya tambahan (bongkar, angkut, dll) pada form Penerimaan Bahan Baku.
- **Kalkulasi Otomatis Landed Cost**: Sistem sekarang otomatis menghitung HPP Material berdasarkan harga beli + proporsi biaya lain-lain per kg saat memilih batch di Worksheet Produksi.
- **Sistem Backup Database**: Melakukan backup database berkala ke direktori `backups/` untuk keamanan data.

### Diperbaiki
- **UI Optimization**: Pembaruan grid layout pada form penerimaan untuk mengakomodasi field baru tanpa merusak estetika.
- **State Consistency**: Memastikan form reset dan edit data menangani field biaya lain secara konsisten untuk mencegah data korup.

## [2.10.0] - 2026-02-15

### Ditambahkan
- **Overhaul Sistem Pemilihan Batch Worksheet**: 
    - Menulis ulang `BatchSelectionModal` untuk pemilihan berbasis batch riil (Penerimaan Barang), bukan lagi stok agregat.
    - Otomatisasi harga bahan baku (HPP) yang diambil langsung dari data history penerimaan.
    - Penambahan fitur pencarian batch berdasarkan ID, Supplier, dan Nama Material.
- **Traceability Dummy Data**: Memperbarui generator dummy agar menghasilkan riwayat penerimaan barang (`RAW_MATERIAL_RECEIPT`) yang kompatibel dengan sistem pemilihan batch baru.

### Diperbaiki
- **Naming Convention Fix**: Memperbaiki masalah tampilan "Unknown" pada material dengan menyelaraskan interface frontend dengan skema Prisma PascalCase (`ProductType`, `Machine`, dll).
- **Edit Mode Worksheet**: Memastikan data worksheet lama tetap ter-load dengan benar menggunakan fallback naming (`otm_` vs Prisma).
- **Multi-Factory Dummy**: Memperbaiki issue dimana dummy purchasing data hanya muncul di satu pabrik. Sekarang kedua pabrik memiliki data dummy yang seimbang.

## [2.9.2] - 2026-02-15

### Diubah
- **Audit Penamaan Global**: Menyelesaikan standarisasi penamaan di seluruh level (Code, Database, Dokumentasi).
- **Pembersihan Database**: Menghapus data pabrik lama yang tidak terpakai dan melakukan migrasi data pada tabel `Worksheet` agar menggunakan prefix `PMD2` dan istilah yang konsisten.
- **Refaktor Dummy Service**: Mengganti variabel internal `pmdPusat` menjadi `pmd2` untuk memudahkan pemeliharaan kode ke depan.

## [2.9.1] - 2026-02-15

### Diubah
- **Pembersihan Istilah "Pusat"**: Mengubah nama "PMD 2 - Finishing" menjadi "PMD 2 - Finishing" untuk standardisasi penamaan pabrik yang lebih netral (PMD 1 & PMD 2).
- **Generator Data Dummy**: Memperbarui template dummy agar mengikuti penamaan pabrik terbaru secara otomatis.

## [2.9.0] - 2026-02-15

### Ditambahkan
- **Fitur Transfer Stok Antar Pabrik**: Memungkinkan pemindahan stok produk (seperti PK/Glosor) antar lokasi pabrik (misal: PMD 1 ke PMD 2) dengan validasi stok otomatis dan pencatatan riwayat transfer.
- **Riwayat Transfer**: Section baru di halaman Stocks untuk memantau aktivitas pemindahan stok beserta catatan pengguna.


## [2.8.1] - 2026-02-15

### Diperbaiki
- **Fix Invoice Detail Page**: Memperbaiki error 500 saat membuka detail invoice karena ketidakcocokan tipe data ID pada backend.
- **Reliable PDF Export**: Mengoptimasi pengiriman file PDF dari backend menggunakan buffer untuk mencegah kegagalan stream pada browser tertentu.

### Diubah
- **Direct Print Service**: Menghubungkan tombol cetak invoice langsung ke dialog print browser menggunakan metode hidden iframe, sehingga user tidak perlu lagi membuka file download secara manual.

## [2.8.0] - 2026-02-15

### Ditambahkan
- **Overhaul Dummy Data Generator**: Sistem generator baru yang mendukung multi-pabrik (PMD 1 & PMD 2) dengan alur produksi yang realistis.
- **Support Sales & Purchasing Dummy**: Menghasilkan data Customer, Supplier, Invoice, PO, dan Goods Receipt secara otomatis untuk pengujian alur bisnis lengkap.
- **Tagging System**: Semua data dummy kini ditandai dengan tag `[DUMMY]` sehingga dapat dihapus tanpa mengganggu data riil.
- **Hard Reset & Delete Dummy**: Fitur baru di Settings untuk menghapus hanya data dummy atau melakukan reset total sistem (Hard Reset) dengan konfirmasi ganda.

## [2.7.2] - 2026-02-15

### Diperbaiki
- **Fix Data Relation (Raw Material Receipt)**: Memperbaiki masalah data "Unknown" pada kolom lokasi dengan menarik relasi `Factory` secara mendalam dari repositori backend.
- **Improved Factory Display**: Kolom lokasi kini menampilkan nama pabrik asli (e.g. "PMD 1", "PMD 2") alih-alih ID atau "Unknown".
- **Fix Delete Permission**: Memungkinkan peran `OPERATOR` untuk menghapus data penerimaan (sebelumnya dibatasi hanya untuk `ADMIN`), sehingga user dapat memperbaiki kesalahan input sendiri.
- **Fix Factory Filter Bug**: Memperbaiki masalah di mana data tidak muncul saat filter pabrik tertentu diaktifkan (PMD 1/PMD 2) karena ketidakcocokan tipe data (string vs number) pada frontend.
- **Backend Sync**: Menambahkan log debugging dan melakukan *clean build* serta *restart* pada server backend untuk memastikan perubahan skema dan repositori diterapkan dengan benar.

## [2.7.1] - 2026-02-15

### Diperbaiki
- **Fix Factory ID Bug (Raw Material Receipt)**: Memperbaiki logika penyimpanan dimana batch bahan baku sebelumnya bisa tersimpan ke stock pabrik lain secara acak.
- **Improved Validation**: Data sekarang hanya bisa disimpan jika pabrik telah dipilih.

## [2.7.0] - 2026-02-15

### Ditambahkan
- **Print Receipt Feature**: Menambahkan fitur cetak struk penerimaan bahan baku (Thermal/A4) langsung dari browser.
- **Improved UI for Raw Materials**: Layout baru untuk form penerimaan bahan baku.
