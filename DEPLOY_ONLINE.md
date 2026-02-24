# Panduan Deployment Online (v2.23.0)

Aplikasi ini siap di-deploy ke **Railway** (Backend & Database) dan **Vercel** (Frontend).

## 1. Persiapan Database (Railway)
1. Buat Project baru di Railway.
2. Tambahkan layanan **PostgreSQL**.
3. Railway akan otomatis memberikan `DATABASE_URL`.

## 2. Persiapan ML Service (Railway)
1. Di project yang sama, pilih **Add Service** -> **GitHub Repo**.
2. Pilih repo `erp-pangan-masa-depan`.
3. Di tab **Settings**, set **Root Directory** ke `ml-service`.
4. Railway akan mendeteksi `Dockerfile` dan deploy secara otomatis di port 8000.
5. Catat URL publik ML Service ini (misal: `https://ml-service-production.up.railway.app`).

## 3. Persiapan Backend API (Railway)
1. Pilih **Add Service** -> **GitHub Repo** lagi.
2. Pilih repo yang sama.
3. Di tab **Settings**, biarkan **Root Directory** kosong (root).
4. Tambahkan **Variables**:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (Hubungkan ke layanan Postgres tadi).
   - `JWT_SECRET`: (Buat string acak, misal: `erp-pangan-sangat-rahasia-2026`).
   - `FRONTEND_URL`: URL dari Vercel (contoh: `https://pangan-masa-depan.vercel.app`).
   - `ML_SERVICE_URL`: URL dari ML Service tadi.
   - `NODE_ENV`: `production`.
   - `PORT`: `3005` (Atau biarkan Railway menentukan).
5. Railway akan menjalankan `npm run build` dan `npm start`.
6. **Catatan v2.23.0**: Pastikan migrasi database berjalan (`npx prisma migrate deploy`) karena ada model baru `MaterialReceipt` dan field `quarantine_quantity` pada `Stock`.

## 4. Persiapan Frontend (Vercel)
1. Buka dashboard Vercel, pilih **Add New Project**.
2. Hubungkan repo GitHub.
3. Atur konfigurasi berikut:
   - **Root Directory**: `frontend`.
   - **Framework Preset**: Vite.
4. Tambahkan **Environment Variables**:
   - `VITE_API_URL`: URL backend Railway tadi (contoh: `https://backend-production.up.railway.app`).
5. Klik **Deploy**.

## 5. Inisialisasi Database
Setelah backend dan database online, Anda perlu menjalankan migrasi dan seeding:
1. Di terminal lokal Anda (yang terhubung ke database cloud via tunnel atau ganti `DATABASE_URL` di `.env` lokal sementara):
   ```bash
   npx prisma migrate deploy
   npm run seed-admin
   ```
   *Atau gunakan tab **Terminal** di dashboard Railway jika tersedia.*

## 6. Update Deployment (v2.23.0)
Untuk update aplikasi yang sudah berjalan ke v2.23.0:

### Backend (Railway)
1. Push perubahan ke branch `main` — Railway akan auto-deploy.
2. Pastikan migrasi database otomatis berjalan (sudah termasuk di `npm start`).
3. Verifikasi tabel `MaterialReceipt` dan kolom `quarantine_quantity` sudah dibuat.

### Frontend (Vercel)
1. Push perubahan ke branch `main` — Vercel akan auto-deploy.
2. Verifikasi halaman Penerimaan Bahan Baku menampilkan filter status dan tombol approval.

### Checklist Pasca-Deploy
- [ ] Login berhasil dengan superuser
- [ ] Dashboard menampilkan statistik
- [ ] Halaman Penerimaan Bahan Baku menampilkan filter status (Menunggu/Disetujui/Lunas)
- [ ] Fitur approval dan pembayaran berfungsi
- [ ] PDF Invoice menampilkan watermark status
- [ ] PDF Kwitansi Penerimaan dapat di-generate

---

**PENTING**: Pastikan `FRONTEND_URL` di Backend Railway sama persis dengan domain yang diberikan Vercel untuk menghindari masalah CORS.
