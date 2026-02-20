# Rencana Eksekusi Pengembangan v2.20: PWA, Audit Log, & Quality Trending

Dokumen ini merinci langkah-alih teknis untuk mengeksekusi tiga prioritas utama dari Audit v2.19, dengan fokus pada infrastruktur **Offline-First (PWA)**, **Akuntabilitas (Audit Log)**, dan **Wawasan Kualitas (Quality Trending)**.

---

## 1. Quality Trending Dashboard (Dashboard Tren Kualitas)
**Tujuan**: Visualisasi parameter QC (Kadar Air, Hampa, Broken) untuk mendeteksi anomali supplier dan performa mesin.

### Langkah Eksekusi:
- [ ] **Backend (API Enhancement)**:
    - Membuat endpoint `GET /api/reports/quality-trends` yang mengagregasi data dari `StockMovement` (Raw Material) dan `Worksheet` (Finish Goods).
    - Menambahkan filter berdasarkan: Range Tanggal, Supplier ID, dan Jenis Produk.
- [ ] **Frontend (UI/UX)**:
    - Implementasi Chart menggunakan `recharts` (Line Chart & Area Chart).
    - Grid Dashboard baru di menu Laporan Produksi.
    - Metrik SPC (Statistical Process Control): Menampilkan nilai rata-rata, Min/Max, dan Standar Deviasi kualitas.

---

## 2. Audit Log System (Sistem Jejak Audit)
**Tujuan**: Rekam jejak digital untuk setiap perubahan data sensitif (Stok, Harga, Transaksi).

### Langkah Eksekusi:
- [ ] **Database (Prisma Schema)**:
    ```prisma
    model AuditLog {
      id        Int      @id @default(autoincrement())
      userId    Int
      action    String   // CREATE, UPDATE, DELETE
      tableName String
      recordId  Int
      oldValue  Json?
      newValue  Json?
      ipAddress String?
      timestamp DateTime @default(now())
      user      User     @relation(fields: [userId], references: [id])
    }
    ```
- [ ] **Backend (Middleware/Interceptor)**:
    - Membuat `AuditService` untuk menangkap perubahan state sebelum disimpan ke DB.
    - Integrasi Audit Log pada modul kritis: Stock Movements, Invoices, dan User Management.
- [ ] **Frontend (Admin Interface)**:
    - Menu baru "Log Sistem" hanya untuk Role ADMIN.
    - Fitur filter berdasarkan User, Tanggal, dan Tabel.

---

## 3. PWA & Offline Mode (Transformasi Aplikasi Progresif)
**Tujuan**: Menjamin aplikasi tetap bisa melakukan input data dasar meskipun koneksi internet di pabrik/gudang tidak stabil.

### Langkah Eksekusi:
- [ ] **Setup PWA (Vite Configuration)**:
    - Install `vite-plugin-pwa`.
    - Konfigurasi `manifest.json` (icons, theme color, display standalone).
    - Setup Service Worker untuk caching aset statis (HTML, JS, CSS, Fonts).
- [ ] **Infrastruktur Offline-First**:
    - **Local Caching**: Menggunakan `TanStack Query` (React Query) dengan `persistQueryClient` untuk menyimpan data tabel di cache lokal.
    - **Offline Queue**: Implementasi `IndexedDB` (menggunakan library `Dexie.js`) untuk menyimpan transaksi yang dilakukan saat offline.
- [ ] **Sync Mechanism**:
    - Pendeteksian status koneksi (`navigator.onLine`).
    - Banner "Mode Offline" saat koneksi terputus.
    - Background Sync: Otomatis mengirim data dari IndexedDB ke Server saat terdeteksi koneksi kembali.

---

## Jadwal Implementasi (Next Sprint)
1. **Minggu 1**: Audit Log System & Quality Trending (Backend & Database).
2. **Minggu 2**: Frontend Dashboard Quality & Admin Log UI.
3. **Minggu 3**: Implementasi PWA Core & Offline Caching.
4. **Minggu 4**: Offline Sync Testing & Deployment v2.20.

---
**Status**: 🛠️ *Menunggu Persetujuan Eksekusi*
