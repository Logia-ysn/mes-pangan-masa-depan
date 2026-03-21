# 🏠 Guide Setup - ERP Pangan Masa Depan

Pilih mode yang paling sesuai dengan kebutuhan Anda saat ini.

---

## 🛠️ Opsi A: Mode Hybrid (Sangat Direkomendasikan untuk Development)
Gunakan ini jika Anda sedang aktif menulis kode (coding) agar mendapatkan fitur *Hot Reload*.

### 1. Persiapan
- Pastikan Node.js >= 18 dan Docker sudah terinstal.
- Copy `.env.example` menjadi `.env`.

### 2. Jalankan Infrastruktur (Docker)
Jalankan Database dan ML Service di background:
```bash
npm run docker:services
```

### 3. Jalankan Aplikasi (NPM)
Jalankan Frontend dan Backend di terminal lokal:
```bash
# Terminal 1: Backend
npm install
npx prisma generate
npm run dev

# Terminal 2: Frontend
cd frontend
npm install
npm run dev
```
**Akses:** [http://localhost:5173](http://localhost:5173) (Frontend Dev)

---

## 🐳 Opsi B: Mode Full Docker (Simulasi Produksi/GitHub)
Gunakan ini jika Anda ingin menjalankan seluruh sistem tanpa perlu mengurus Node/NPM di laptop. Ini juga cara tercepat untuk mencoba aplikasi.

### 1. Jalankan Semuanya
Cukup satu perintah:
```bash
npm run docker:full
```

### 2. Selesai!
Docker akan melakukan build frontend, backend, dan menyiapkan database secara otomatis.
**Akses:** [http://localhost:3010](http://localhost:3010)

---

## 📝 Catatan Penting
- **Database GUI**: Untuk melihat isi database, jalankan `npm run prisma:studio`.
- **Produksi**: Saat di server produksi, Anda hanya perlu melakukan `git pull` lalu jalankan perintah di **Opsi B**.
