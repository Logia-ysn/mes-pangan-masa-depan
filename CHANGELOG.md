# Changelog

## [2.13.0] - 2026-02-15

### Infrastruktur & Keamanan
- **Auto-Migration Deployment**: Sistem sekarang otomatis menjalankan migrasi database Prisma saat *startup* di Railway untuk mencegah error skema.
- **Enhanced CORS Policy**: Dukungan untuk beberapa origin sekaligus, memungkinkan koneksi aman baik dari URL produksi maupun URL preview Vercel.
- **Permission Refactor**: Mengubah syarat akses fitur pemeliharaan (Dummy Generator, Reset) dari `SUPERUSER` ke `ADMIN` untuk mempermudah operasional pengujian.

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
