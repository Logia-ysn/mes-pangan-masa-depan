---
description: Workflow untuk deploy perubahan dari local ke production (Railway & Vercel)
---

# Development & Deployment Workflow

Workflow ini memastikan sinkronisasi antara development lokal dan aplikasi live di Railway (backend) & Vercel (frontend).

## Prinsip Utama
1. **Local First** - Semua perubahan harus ditest di lokal terlebih dahulu
2. **Git Push = Auto Deploy** - Push ke GitHub akan trigger auto-deploy ke Railway dan Vercel
3. **Single Source of Truth** - GitHub adalah sumber kebenaran untuk kode

## Langkah-langkah

### 1. Development Lokal
// turbo
```bash
# Start backend (port 3005)
cd /Users/yay/Project/erp-pangan-masa-depan
npm run dev
```

// turbo
```bash
# Start frontend (port 3006)
cd /Users/yay/Project/erp-pangan-masa-depan/frontend
npm run dev
```

### 2. Test di Browser
- Backend: http://localhost:3005
- Frontend: http://localhost:3006

### 3. Commit & Push ke GitHub
```bash
cd /Users/yay/Project/erp-pangan-masa-depan
git add .
git commit -m "feat/fix/chore: deskripsi perubahan"
git push origin main
```

### 4. Auto-Deploy
Setelah push ke GitHub:
- **Railway** akan otomatis build dan deploy backend
- **Vercel** akan otomatis build dan deploy frontend

### 5. Verifikasi Production
- Backend Railway: https://erp-pangan-masa-depan-production.up.railway.app
- Frontend Vercel: https://erp-pangan-masa-depan.vercel.app

## Environment Variables

### Lokal (.env)
```
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_local_password
DB_NAME=pangan_masa_depan
JWT_SECRET=your-local-jwt-secret
```

### Railway (Production)
Sudah dikonfigurasi di Railway Dashboard dengan kredensial database Railway

### Vercel (Production)
```
VITE_API_URL=https://erp-pangan-masa-depan-production.up.railway.app
```

## Tips
- **PENTING**: Selalu jalankan `npm run build` di folder `frontend` sebelum push. Ini akan mendeteksi error TypeScript atau *unused imports* (linting) yang bisa menyebabkan build di Vercel/Railway gagal.
- Update `CHANGELOG.md` setiap ada perubahan signifikan (gunakan `/changelog`).
- Pastikan versi di `package.json` dan `CHANGELOG.md` sinkron sebelum deployment major.
- Jangan commit file `.env` ke repository.
