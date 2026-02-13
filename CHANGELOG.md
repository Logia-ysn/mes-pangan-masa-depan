# Changelog

Semua perubahan penting pada proyek ERP Pangan Masa Depan akan didokumentasikan dalam file ini.

Format ini berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.3.0] - 2026-02-13

### Ditambahkan (Mobile Responsiveness & UI Modern)
- **Sistem Grid Responsif**: Implementasi helper classes (`.grid-4`, `.grid-3`, `.grid-2`, `.grid-2-1`) yang adaptif untuk berbagai ukuran layar.
- **Tabel Mobile-Friendly**: Penambahan fitur `hide-mobile` pada kolom tidak kritikal di modul Invoices, PO, Machines, Maintenance, Stocks, Worksheets, dan Customers.
- **UI Bottom Sheet**: Transformasi modal menjadi *bottom sheet* pada layar mobile untuk aksesibilitas jempol yang lebih baik.
- **Navigasi Drawer**: Optimasi sidebar sebagai drawer transisi halus pada perangkat mobile.
- **Touch-Optimized UX**: Peningkatan ukuran target sentuh (tombol, input) dan perbaikan spacing global untuk kenyamanan penggunaan di smartphone.
- **Optimasi Form Produksi**: Redesign tata letak form pada modul *Raw Material Receipt* dan *QC Gabah* agar tetap rapi di layar sempit.

## [2.2.1] - 2026-02-13

### Diperbaiki (Stabilitas Produksi & Integritas Data)
- **Integritas Stok (Worksheet Deletion)**: Implementasi rollback stok otomatis saat penghapusan Worksheet. Menghapus worksheet kini mengembalikan stok bahan baku (Input Batches) dan menarik kembali stok produk jadi yang dihasilkan.
- **Integritas Stok (Invoice Cancellation)**: Penambahan fitur pembatalan stok saat invoice diubah menjadi status `CANCELLED`. Barang penjualan dikembalikan ke stok gudang secara otomatis.
- **Audit Log Manual Stock**: Perbaikan handler `T_updateStock` agar wajib melalui `StockService`. Setiap pembaruan stok manual oleh supervisor kini tercatat dalam histori pergerakan stok sebagai `MANUAL_ADJUSTMENT` untuk kebutuhan audit.
- **Vercel Infrastructure Sync**: Sinkronisasi variabel lingkungan `VITE_API_URL` dengan suffix `-7abe` yang diperlukan untuk koneksi backend Railway yang stabil di lingkungan produksi.
- **Frontend Build Reliability**: Perbaikan kesalahan tipe (TypeScript errors) pada komponen Recharts di halaman laporan (`Production`, `Sales`, `COGM`, `Stock Report`) yang sebelumnya menghambat proses build di Vercel.
- **Production Performance (Rate Limiting)**: Peningkatan batas *Rate Limiting* global (100 -> 1000) dan auth (10 -> 50) untuk mengatasi error "Too many requests" pada dashboard produksi.
- **Vercel Deployment Optimization**: Pengaturan otomatis `Root Directory` ke folder `frontend` dan penetapan preset **Vite** untuk proses deploy yang lebih cepat dan bebas error.

## [2.2.0] - 2026-02-13

### Ditambahkan
- **Halaman Laporan Terpadu**: 4 halaman report baru dengan filter, KPI cards, chart, dan tabel data
  - **Laporan Produksi** (`/reports/production`): BarChart breakdown output (beras, menir, dedak, sekam), 4 KPI cards, export CSV + Excel
  - **Laporan Penjualan** (`/reports/sales`): PieChart revenue per customer, 4 KPI cards (invoice, revenue, paid, outstanding), export CSV + Excel
  - **HPP / COGM** (`/reports/cogm`): PieChart breakdown biaya produksi, 3 KPI cards (total biaya, output beras, HPP/kg), export CSV
  - **Laporan Stok** (`/reports/stock`): BarChart IN vs OUT per produk, 3 KPI cards (masuk, keluar, selisih), export CSV + Excel
- **Backend Report API**: Implementasi 2 endpoint yang sebelumnya hanya type-only
  - `GET /reports/sales-summary` — aggregasi invoice per customer dengan total paid/outstanding
  - `GET /reports/cogm` — aggregasi biaya produksi worksheet dengan breakdown kategori
- **Stock Report Endpoint**: Type + implementasi baru `GET /reports/stock-report` — aggregasi stock movements per tipe dan produk
- **Excel Export System**: 3 endpoint export Excel menggunakan library `exceljs`
  - `GET /reports/production-summary/excel` — data worksheet detail (shift, pabrik, semua output)
  - `GET /reports/sales-summary/excel` — daftar invoice dengan customer, nominal, status
  - `GET /reports/stock-report/excel` — daftar stock movements dengan produk, tipe, user
  - Service generic `excel.service.ts` dengan styled workbook (header hijau, zebra-striping, border)
- **Sistem Notifikasi**: Infrastruktur notifikasi persistent lengkap
  - Model database `Notification` dengan enum `Notification_type_enum` (LOW_STOCK, OVERDUE_INVOICE, OVERDUE_MAINTENANCE, SYSTEM) dan `Notification_severity_enum` (INFO, WARNING, CRITICAL)
  - Repository + Service untuk CRUD notifikasi dan pembuatan alert otomatis
  - 5 API endpoint: list notifikasi, hitung unread, tandai dibaca, tandai semua dibaca, cek & buat alert
  - Smart duplicate check — tidak membuat alert duplikat dalam 24 jam
  - Threshold otomatis: stok < 30% rata-rata → warning/critical, invoice overdue → warning/critical (>14 hari = critical), maintenance overdue → warning/critical (>7 hari = critical)
- **Header Notification UI**: Dropdown notifikasi di header dengan badge counter
  - Badge merah dengan jumlah unread (max 99+)
  - Dropdown panel dengan ikon per tipe (inventory, receipt_long, build), warna per severity
  - Timestamp relatif ("Baru saja", "5 menit lalu", "2 hari lalu")
  - Aksi: tandai dibaca per item, tandai semua dibaca
  - Auto-polling setiap 60 detik, auto-check alert pada mount
- **Navigasi**: Section "Laporan" baru di sidebar dengan ikon `assessment` dan 4 submenu
- **Frontend API**: `reportApi` (7 methods) dan `notificationApi` (5 methods) di `api.ts`

### Diubah
- **`Sidebar.tsx`**: Menambahkan section "Laporan" setelah "Pembelian"
- **`App.tsx`**: Menambahkan 4 lazy import dan route block `/reports/*`
- **`Header.tsx`**: Upgrade dari placeholder button menjadi full notification dropdown dengan state management
- **`index.ts`**: Menambahkan 3 direct Express route untuk Excel export (mengikuti pattern PDF invoice)
- **`prisma/schema.prisma`**: Menambahkan model `Notification` dan 2 enum baru, relasi pada `User`

---

## [2.1.0] - 2026-02-13

### Ditambahkan
- **Modul Penjualan (Sales Module)**: Implementasi ulang modul penjualan yang dihapus di v1.2.0
  - **Customer Management**: CRUD pelanggan dengan search, filter aktif/non-aktif
  - **Invoice Management**: Buat, edit, hapus invoice dengan otomatis potong stok finished goods
  - **Payment Management**: Catat pembayaran dengan auto-update status invoice (DRAFT → PARTIAL → PAID)
  - **Stock Integration**: Stok berkurang saat invoice dibuat, dikembalikan saat invoice dihapus
- **Backend**: 3 repository (`customer`, `invoice`, `payment`), 1 service (`invoice.service.ts`), 15 NAIV API endpoints
- **Frontend**: 3 halaman baru (`Customers.tsx`, `Invoices.tsx`, `InvoiceDetail.tsx`), sidebar "Penjualan"
- **Invoice Detail Page**: Tampilan detail invoice dengan tabel item, ringkasan pembayaran, progress bar, dan aksi CRUD

---

## [2.0.0] - 2026-02-13

### Ditambahkan
- **ML Service v2.0.0 — Multi-Color Grain Analysis**: Rewrite penuh `ml-service/` dari deteksi hijau saja menjadi analisis multi-warna lengkap
  - Deteksi 5 kategori warna: **Green**, **Yellow**, **Red**, **Chalky**, **Normal** menggunakan segmentasi HSV dengan priority order (mencegah double-counting pixel)
  - Red detection menggunakan dual HSV range (H:0-10 dan H:170-179) karena merah berada di kedua ujung spectrum hue
  - Chalky detection berdasarkan saturasi rendah (S<40) dan value tinggi (V>180)
- **Endpoint `POST /analyze-detailed`**: Endpoint baru yang mengembalikan:
  - Full `ColorBreakdown` (persentase semua 5 warna)
  - `calibration_used` — profil kalibrasi yang dipakai untuk analisis
  - `grading_rules_used` — aturan grading yang dipakai
  - `processing_time_ms` — waktu pemrosesan
  - Support override kalibrasi dan grading per-request
- **Calibration API**:
  - `GET /calibration` — lihat profil kalibrasi HSV dan aturan grading saat ini
  - `PUT /calibration` — update range HSV untuk semua warna (green, yellow, red_low, red_high, chalky)
  - `PUT /calibration/grading` — update aturan grading (KW1-KW3, level, threshold)
  - `POST /calibration/reset` — reset kalibrasi dan grading ke default
- **Konfigurasi via Environment Variable**: Semua HSV default dan threshold bisa di-override via env var dengan prefix `ML_` (contoh: `ML_GREEN_H_MIN=30`)
- **Grading 6-Tier dengan Level**: KW1 L1 (<3%), KW1 L2 (<5%), KW1 L3 (<10%), KW2 L1 (<15%), KW2 L2 (<20%), KW3 L1 (>=20%) — menggantikan grading 3-tier hardcoded sebelumnya
- **Dokumentasi**: `docs/ml-service.md` — dokumentasi teknis lengkap pipeline analisis, HSV ranges, API endpoints, kalibrasi, dan integrasi

### Diubah
- **Arsitektur ML Service**: Reorganisasi dari 3 file flat menjadi struktur modular:
  - `routers/` — health, analyze, analyze_detailed, calibration
  - `models/` — Pydantic models untuk request, response, calibration, grading
  - `services/` — image_processor, color_detector, grading_service, calibration_store
  - `config.py` — pydantic-settings dengan semua default HSV
- **`POST /analyze-base64`**: Response diperluas dengan field opsional baru (`yellow_percentage`, `red_percentage`, `chalky_percentage`, `normal_percentage`) — **backward compatible**, field lama (`green_percentage`, `grade`, `status`, `level`, `supplier`, `lot`) tidak berubah
- **Image Preprocessing**: Foreground mask sekarang exclude pixel gelap (V<15) selain pixel putih (V>240), mengurangi noise dari bayangan
- **Dependency**: `python-multipart` diupdate ke 0.0.20, `pydantic-settings` ditambahkan ke requirements.txt

### Dihapus
- **`app/features.py`** — Logika deteksi hijau lama (digantikan `services/color_detector.py`)
- **`app/predict.py`** — Grading hardcoded 3-tier (digantikan `services/grading_service.py` dengan rules dinamis)

---

## [1.2.0] - 2026-02-06

### Ditambahkan
- **Executive Dashboard**: Redesign dashboard untuk level eksekutif dengan manufacturing KPIs:
  - 8 KPI cards (OEE, Produksi, Rendemen, Downtime, Stok Gabah, Stok Beras, Maintenance, Target)
  - Production Overview dengan chart trend 7/30 hari dan target progress bar
  - Machine & OEE Panel dengan breakdown Availability/Performance/Quality
  - Inventory Snapshot dengan stock level bars dan low stock alerts
  - Maintenance Panel dengan jadwal upcoming dan overdue
- **API Endpoint**: `GET /dashboard/executive` untuk data dashboard eksekutif
- **Komponen Baru**: `KPICard`, `MachinePanel`, `InventoryPanel`, `MaintenancePanel`

### Diubah
- **Sidebar Navigation**: Mengubah desain navigasi sidebar menjadi *Flat Navigation*. Menghapus sistem collapsible/dropdown untuk akses module yang lebih cepat dan langsung.
- **Modul Fokus**: Menghapus modul **HRD**, **Finance**, dan **Sales** untuk memfokuskan aplikasi pada **Produksi** dan **Inventory/Stock**.
- **Database Config**: Mengaktifkan `synchronize: true` pada TypeORM untuk sinkronisasi schema database otomatis dengan perubahan kode.
- **Dashboard Service**: Extended dengan methods untuk OEE calculation, machine summary, inventory snapshot, dan maintenance aggregation.

### Dihapus
- Modul HRD (Employee Attendance, etc)
- Modul Finance (Daily Expenses, etc)
- Modul Sales (Invoices, Customers, etc)

## [1.1.0] - 2026-01-31

### Ditambahkan
- **Grading Point System**: Logika penilaian kualitas baru berbasis poin (1-30) dengan sistem nilai acuan (Reference Values). Menggantikan logika "Weakest Link" sebelumnya.
  - Poin diberikan berdasarkan kombinasi Grade dan Level (Contoh: KW 1:1 = 10 poin, KW 3:3 = 2 poin).
  - Total skor menentukan grade akhir berdasarkan kedekatan dengan nilai acuan.
- **Dynamic Color Calibration**: Fitur konfigurasi ambang batas warna (HSV) untuk analisis ML melalui tabel `QualityParameter` (`Calib_Green_Hue`, `Calib_Green_Sat`, dst).
- **Quality Score Display**: Menampilkan skor numerik hasil analisis pada modal Quality Analysis bersamaan dengan badge rating.
- **Worksheet Edit**: Fitur edit worksheet lengkap dengan input batch dan side products.
- **Side Product Display**: Menampilkan detail side products pada tabel list worksheet.
- **Backend Sync**: Logika sinkronisasi stok (reverse & re-apply) saat update worksheet.
- **Rice Color Analysis**: Fitur analisis otomatis kualitas warna padi (Padi Muda vs Tua) menggunakan pemrosesan gambar dan Python ML script.

### Diubah
- **Raw Material Receipt**: Menambahkan support update/edit data pada form penerimaan bahan baku (`PUT /stock-movements/:id`).
- **ML Integration**: Script Python (`analyze.py`) diperbarui untuk menerima konfigurasi dinamis (grading rules & calibration) via JSON payload.

### Diperbaiki
- **Edit Batch**: Memperbaiki fungsi tombol edit pada tabel "Recent Received Batches" yang sebelumnya tidak mengisi form.
- **Quality Parameter Delete**: Memperbaiki bug hapus parameter.
- **Backend Route**: Validasi endpoint DELETE `/quality-parameters/:id`.

### Database & Backend Fixes (24 Jan 2026)
- **Schema Update**: Menambahkan migrasi `FixWorksheetSchema` untuk kolom `id_machine` yang hilang pada tabel `Worksheet`.
- **Backend Fix**: Memperbaiki error tipe data `side_products` pada endpoint update worksheet.
- **Test Data**: Update fitur `reset-data` dan `seed-data` untuk mendukung `input_batches` dan `side_products` secara lengkap.

### Worksheet Edit & Side Product Enhancement (24 Jan 2026)
- **Edit Button**: Tombol edit pada tabel worksheet.
- **Handling Side Products**: Memperbaiki mapping data side products pada API update.
- **Frontend Refinement**: Perbaikan UI tabel dan form worksheet.

### Ditambahkan
- **Worksheet Details Page**: Halaman detail (`/production/worksheets/:id`) untuk melihat informasi worksheet secara lengkap dan menghitung rendemen.
- **Navigation Link**: Tombol "Lihat Detail" (icon mata) pada tabel Worksheets.
- **Redesigned Modules**: Modernisasi halaman Sales (Customers, Invoices) dan Finance (Expenses) dengan stats cards dan desain baru.
- **Inventory Chart**: Visualisasi distribusi stok pada halaman Stocks.

### Worksheet Detail & Stock Logic Refinement (22 Jan 2026)
- **Detailed View**: Menampilkan informasi lengkap pada halaman detail Worksheet:
  - Data Mesin dan Operator
  - Tabel Input Batches (Bahan baku, Qty, Harga, Total)
  - Analisis Biaya detail (HPP Total dan HPP/kg)
- **Data Integrity**: Memastikan data `id_machine` dan `input_batches` tersimpan dengan benar saat pembuatan worksheet.
- **Backend Optimization**: Eager loading relasi yang diperlukan (Machine, Input Batches, Output Product) pada repository untuk performa dan kelengkapan data.

### Machine Form Redesign & PMD 1/PMD 2 (22 Jan 2026)
- **Factory Renaming**: Factory "PMD Pusat" diubah menjadi "PMD 2" untuk konsistensi
- **New Machine Form Layout**: Form tambah mesin didesain ulang sesuai referensi:
  - Section 1: Informasi Umum & Teknis (Lokasi Pabrik toggle, Kode, Nama, Tipe, Serial Number, Tahun Manufaktur, Kapasitas, Status)
  - Section 2: Informasi Pembelian (Tanggal Pembelian, Vendor/Supplier, Harga Beli, Masa Garansi)
- **New Machine Fields**:
  - `serial_number` - Serial number mesin
  - `manufacture_year` - Tahun pembuatan
  - `purchase_date` - Tanggal pembelian
  - `vendor_id` - Relasi ke Supplier
  - `purchase_price` - Harga beli
  - `warranty_months` - Masa garansi dalam bulan
- **Factory Filter Toggle**: Toggle button untuk filter mesin berdasarkan pabrik (Semua/PMD 1/PMD 2)
- **Auto Code Generation**: Kode mesin otomatis di-generate saat tambah mesin baru
- **API Enhancement**: GET /machines sekarang include relasi factory dan vendor

### Worksheet Module Enhancement & HPP Calculation (22 Jan 2026)
- **New Database Tables**:
  - `ProcessCategory` - Kategorisasi proses mesin (Main/Secondary)
  - `OutputProduct` - Produk output per factory (PMD 1: PK, Glosor | PMD 2: Beras grades)
  - `WorksheetInputBatch` - Multiple input batches per worksheet
  - `WorksheetSideProduct` - Side products/waste tracking
- **Process Categories**: 6 main process (Drying, Husking, Stoner Polisher 1&2, Grading, Packing) + 2 secondary
- **Factory-Specific Output Products**:
  - PMD 1: Pecah Kulit, Glosor
  - PMD 2: Beras Medium, Medium Super, Premium, Premium Super, Custom
- **Redesigned Worksheet Form**:
  - Section 1: General Information (Date, Shift, Machine)
  - Section 2: Output Product & Multiple Process Steps (checkbox selection)
  - Section 3: Production Data with Batch Input Modal (select from stocks, multi-batch support)
  - Section 4: Personnel with Add Operator button
  - Section 5: Cost & HPP Calculation display
- **Side Products/Waste**:
  - PMD 1: Bekatul, Sekam (15% auto-calculation)
  - PMD 2: Bekatul, Broken, Reject, Menir Jitay, Menir Gula
- **HPP Calculation**: Production Cost + Raw Material Cost - Side Product Revenue
- **New API Endpoints**: GET/POST /process-categories, GET/POST /output-products

### Sistem Worksheet Multi-Pabrik (21 Jan 2026)
- **Factory Toggle**: Toggle button untuk pilih pabrik PMD 1 atau PMD Pusat
- **Process Step Selection**: Dropdown untuk memilih step proses (Drying, Husking, Stone Polishing)
- **Input Category**: Pilihan jenis input bahan (GKP, GKG, PK)
- **Production Cost**: Field untuk mencatat biaya produksi per batch
- **By-Product Tracking**: Tracking produk samping (Sekam, Dedak, Menir)
- **Stock Integration**: Output stok otomatis berdasarkan step proses:
  - Drying: GKP → GKG
  - Husking: GKG → PK + Sekam  
  - Stone Polishing: PK → Glosor + Bekatul
- **Available Stock Display**: Menampilkan stok tersedia per kategori di pabrik yang dipilih

### Layered Architecture Refactoring (22 Jan 2026)
- **4-Layer Architecture**: Refactoring backend untuk menggunakan arsitektur berlapis:
  - **Routing Layer**: `types/api/` - Definisi endpoint dan validasi (tetap menggunakan codegen)  
  - **Presentation Layer**: `implementation/` - Handler tipis, hanya parsing request dan call service
  - **Business Logic Layer**: `src/services/` - Semua logika bisnis dan kalkulasi
  - **Persistence Layer**: `src/repositories/` - Semua operasi database
- **New Repositories** (7 files):
  - `base.repository.ts` - Generic CRUD operations
  - `user.repository.ts` - User operations
  - `factory.repository.ts` - Factory operations
  - `stock.repository.ts` - Stock management
  - `stock-movement.repository.ts` - Stock movement tracking
  - `product-type.repository.ts` - Product type operations
  - `worksheet.repository.ts` - Worksheet operations with production stats
- **New Services** (5 files):
  - `auth.service.ts` - Login, register, token management
  - `user.service.ts` - User CRUD with validation
  - `stock.service.ts` - Stock updates and transfers
  - `worksheet.service.ts` - Production with auto stock updates
  - `dashboard.service.ts` - Statistics aggregation
- **DTOs** (3 files):
  - `auth.dto.ts`, `worksheet.dto.ts`, `stock.dto.ts`
- **Utils** (2 files):
  - `errors.ts` - Custom error classes (NotFoundError, ValidationError, etc.)
  - `response.ts` - Pagination helpers
- **Benefits**:
  - ✅ Separation of Concerns yang jelas
  - ✅ Lebih mudah untuk testing
  - ✅ Business logic yang reusable
  - ✅ Loose coupling antar layer

### Diubah
- **Numeric Handling**: Perbaikan konversi string-ke-number pada data API untuk mencegah crash pada halaman Worksheets dan Dashboard.
- **Backend**: Perbaikan logika pembuatan Worksheet (`T_createWorksheet`) untuk menangani relasi factory dan error handling.
- **Branding**: Update nama aplikasi menjadi "Pangan Masa Depan".

### Ditambahkan (Baru)
- **Production Steps UI**: Komponen visual progress bar pada halaman Worksheet Detail untuk melacak status produksi (Drying, Husking, Polishing, Packing).
- **Export to CSV**: Fitur export data ke format CSV pada halaman Worksheets, Invoices, Expenses, dan Attendances.
- **Print Utility**: Tombol cetak pada halaman Worksheet Detail dengan layout khusus cetak (menyembunyikan sidebar/navigasi).
- **Settings Page**: Halaman pengaturan (`/settings`) untuk developer/admin.
- **Data Management**: Fitur "Generate Data Dummy" (`/seed-data`) dan "Hapus Semua Data" (`/reset-data`) untuk keperluan testing.
- **Backend**: Endpoint API `T_seedData` dan `T_resetData` untuk manajemen data dummy secara massal.

### Integrasi Data Antar Modul (21 Jan 2026)
- **Worksheet → Stock Integration**: 
  - Saat worksheet produksi dibuat, stok gabah (GKP) otomatis berkurang
  - Stok produk jadi (Beras, Menir, Dedak, Sekam) otomatis bertambah
  - Setiap perubahan stok tercatat di StockMovement dengan reference_type 'WORKSHEET'
- **Invoice → Stock Integration**:
  - Saat item invoice (penjualan) dibuat, stok produk terkait otomatis berkurang
  - Tercatat di StockMovement dengan reference_type 'INVOICE'
- **Dashboard → Stock Integration**:
  - Dashboard stats sekarang menampilkan total_stock_quantity dan stock_summary
  - Stock summary mencakup product_code, product_name, quantity, dan unit
- **Stock API Enhancement**:
  - GET /stocks sekarang include relasi product_type dan factory
  - Default limit dinaikkan menjadi 100 untuk menampilkan lebih banyak data

### Konfigurasi Data di Pengaturan (21 Jan 2026)
- **Halaman Settings dengan Tabs**:
  - Tab "Manajemen Data" - Generate/Reset data dummy
  - Tab "Supplier" - CRUD Supplier (Tambah/Hapus)
  - Tab "Kategori Bahan" - CRUD Kategori bahan baku (Tambah/Hapus)
  - Tab "Jenis/Varietas" - CRUD Varietas bahan (Tambah/Hapus)
- **Backend Endpoints**:
  - `DELETE /raw-material-categories/:id` - Hapus kategori
  - `DELETE /raw-material-varieties/:id` - Hapus varietas
- **UI Features**:
  - Form inline untuk menambah data langsung di tabel
  - Badge counter jumlah data
  - Konfirmasi sebelum hapus

### Ditambahkan (19 Jan 2026)
- **Raw Material Receipt Submodule**: Submodul baru untuk penerimaan bahan baku (`/production/raw-materials`) dengan form entry batch.
  - Field: Batch ID (auto-generate), PO Number, Date Received, Supplier, Kategori, Jenis/Varietas, Quality Grade (KW 1/2/3), Moisture Content, Net Weight, Price per Kg, Notes
  - Tabel daftar batch penerimaan dengan filter dan search
  - Integrasi dengan Stock Movement API untuk update stok otomatis
- **Supplier Database & Management**: 
  - Tabel database `Supplier` dengan fields: code, name, contact_person, phone, email, address, is_active
  - CRUD API lengkap (`GET/POST/PUT/DELETE /suppliers`)
  - Dropdown supplier dinamis dari database (bukan mock data)
  - Fitur "Tambah Supplier Baru" langsung dari form penerimaan bahan dengan modal popup
- **Raw Material Category & Variety Database**:
  - Tabel `RawMaterialCategory` untuk kategori: Padi/Gabah, Pecah Kulit (PK), Glosor, Beras, Menir, Dedak
  - Tabel `RawMaterialVariety` untuk jenis/varietas: IR 64, IR 42, Ciherang, Mekongga, Kebo/Pera, Ketan, Rojo Lele, Pandan Wangi, Beras Merah, Beras Hitam
  - API endpoints (`GET/POST /raw-material-categories`, `GET/POST /raw-material-varieties`)
  - Dropdown kategori dan jenis dinamis dari database
  - **Fitur "Tambah Kategori Baru" dan "Tambah Varietas Baru" langsung dari form** dengan modal popup
  - Data seeding otomatis via "Generate Data Dummy"
- **File Upload Surat Jalan**: 
  - Fitur upload file surat jalan/tanda terima pada form penerimaan bahan
  - Support format: JPG, PNG, PDF (Max 5MB)
  - Preview nama file yang diupload dengan opsi hapus
- **UI Improvements**:
  - Input group dengan addon (%, Kg, Rp) yang lebih rapi
  - CSS classes `.input-group`, `.input-addon`, `.input-icon-wrapper` untuk form styling
  - Radio button Quality Grade dalam container yang lebih estetis
  - Modal sukses untuk feedback operasi (menggantikan alert browser)

### Diperbaiki (21 Jan 2026)
- **Error Handling Create Supplier/Kategori/Varietas**: Memperbaiki error 500 saat membuat data duplikat, sekarang menampilkan pesan error yang lebih jelas (misal: "Kode Supplier sudah digunakan")
- **Modal Background**: Memperbaiki background modal yang transparan menjadi solid sesuai tema
- **Reset Data**: Menambahkan penghapusan Supplier, RawMaterialCategory, RawMaterialVariety, ProductType, dan ExpenseCategory ke fitur reset data
- **Stock Movements API**: Memperbaiki error relasi pada endpoint stock-movements dengan nama property yang benar

### Diperbaiki
- **Login UI**: Memperbaiki masalah teks input yang menumpuk dengan ikon pada formulir login.
- **Sidebar**: Memperbaiki struktur navigasi bertingkat (nested navigation) dan state collapse/expand.
- **Settings Modal**: Modal konfirmasi dan sukses sekarang tidak hilang otomatis, user harus klik "OK" untuk menutup.
- **Reset Data API**: Memperbaiki error "Empty criteria" pada endpoint `/reset-data` dengan menggunakan `createQueryBuilder().delete()`.

---

## [1.0.0] - 2026-01-17

### Ditambahkan

#### 🔐 Modul Autentikasi
- Sistem login dengan JWT authentication
- Registrasi pengguna baru
- Fitur ganti password
- Endpoint `/auth/me` untuk mendapatkan data user yang sedang login

#### 📊 Dashboard
- Halaman overview dengan statistik real-time
- Widget ringkasan produksi, penjualan, dan keuangan
- Grafik interaktif dengan animasi smooth
- Dark/Light mode theme support
- **Data Visualization**: Added interactive `AreaChart` and `BarChart` using Recharts for visualizing Production trends and Financial performance.

#### 🏭 Modul Produksi
- **Worksheets**: CRUD lembar kerja produksi harian
- **Machines**: Manajemen data mesin produksi
- **Maintenances**: Pencatatan maintenance mesin
- **OEE (Overall Equipment Effectiveness)**: Monitoring efektivitas mesin
- **Stocks**: Manajemen stok bahan baku dan produk jadi
- **Stock Movements**: Pencatatan pergerakan stok
- **Scheduling**: New **Scheduling** page with Gantt Chart visualization for machine allocation and production timeline.
- **OEE Monitor**: New **OEE Monitor** page with gauge charts and performance metrics.

#### 💰 Modul Sales
- **Customers**: Manajemen data pelanggan
- **Invoices**: Pembuatan dan manajemen invoice
- **Invoice Items**: Detail item per invoice
- **Payments**: Pencatatan pembayaran

#### 💳 Modul Finance
- **Daily Expenses**: Pencatatan pengeluaran harian
- **Expense Categories**: Kategori pengeluaran
- **Expense Summary Report**: Laporan ringkasan pengeluaran

#### 👥 Modul HRD
- **Employees**: Manajemen data karyawan
- **Attendances**: Pencatatan kehadiran karyawan
- **Attendance Summary Report**: Laporan ringkasan kehadiran
- **Employee Demographics Report**: Laporan demografi karyawan

#### 📈 Laporan
- COGM (Cost of Goods Manufactured) Report
- Production Summary Report
- Sales Summary Report
- Expense Summary Report
- Attendance Summary Report
- Employee Demographics Report

#### 🎨 UI/UX
- Desain modern dengan glassmorphism cards
- Responsive layout untuk mobile dan desktop
- Animasi smooth dan micro-interactions
- Dark mode dan Light mode support
- Sidebar navigation dengan collapse/expand
- Header dengan user profile dan theme toggle

#### 🖨️ Export & Print
- Export invoice ke format cetak
- Export worksheet ke format cetak
- Export expense report ke format cetak
- Export attendance report ke format cetak

#### 🛠️ Infrastruktur
- Backend API dengan Node.js + Express
- Database dengan TypeORM
- Frontend dengan React + Vite
- Docker support untuk deployment
- Environment configuration dengan dotenv

---

## Template untuk Perubahan Baru

```markdown
## [X.X.X] - YYYY-MM-DD

### Ditambahkan
- Fitur baru yang ditambahkan

### Diubah
- Perubahan pada fitur yang sudah ada

### Diperbaiki
- Bug fixes

### Dihapus
- Fitur yang dihapus

### Keamanan
- Perbaikan keamanan

### Deprecated
- Fitur yang akan dihapus di versi mendatang
```

---

## Kategori Perubahan

- **Ditambahkan** untuk fitur baru
- **Diubah** untuk perubahan pada fitur yang sudah ada
- **Deprecated** untuk fitur yang akan segera dihapus
- **Dihapus** untuk fitur yang sudah dihapus
- **Diperbaiki** untuk bug fixes
- **Keamanan** untuk perbaikan kerentanan keamanan

---

[Unreleased]: https://github.com/your-org/erp-pangan-masa-depan/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/your-org/erp-pangan-masa-depan/releases/tag/v1.0.0
