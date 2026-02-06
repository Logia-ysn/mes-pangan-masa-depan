# Changelog

Semua perubahan penting pada proyek ERP Pangan Masa Depan akan didokumentasikan dalam file ini.

Format ini berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
