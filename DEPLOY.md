# 🚀 Deployment Guide - ERP Pangan Masa Depan

## Architecture Overview

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│  Frontend       │─────▶│  Backend API    │─────▶│  Database       │
│  (Vercel)       │      │  (Railway)      │      │  (Supabase)     │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘
   React + Vite            Node.js + Express       PostgreSQL
   https://erp.vercel.app  https://api.railway.app 
```

---

## 1. Database Setup (Supabase)

### 1.1 Buat Project di Supabase
1. Buka https://supabase.com dan login/register
2. Create New Project
3. Catat credentials:
   - **Host**: `db.[project-ref].supabase.co`
   - **Port**: `5432`
   - **Database**: `postgres`
   - **User**: `postgres`
   - **Password**: (dari dashboard)

### 1.2 Run Migrations
```bash
# Set environment ke Supabase
export DB_TYPE=postgres
export DB_HOST=db.[project-ref].supabase.co
export DB_PORT=5432
export DB_USERNAME=postgres
export DB_PASSWORD=your_password
export DB_NAME=postgres

# Run migrations
npm run migrate
```

### 1.3 Seed Initial Data
```bash
# Seed superuser
curl -X POST https://your-api.railway.app/seed-superuser \
  -H "Content-Type: application/json" \
  -d '{"secretKey":"P4ng4nM4s4D3p4nJ4y4!"}'

# Seed demo data (optional)
curl -X POST https://your-api.railway.app/seed-data \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 2. Backend Deployment (Railway)

### 2.1 Persiapan
1. Buat akun di https://railway.app
2. Connect GitHub repository

### 2.2 Konfigurasi Railway
1. New Project → Deploy from GitHub
2. Select repository: `erp-pangan-masa-depan`
3. Set Root Directory: `/` (root)
4. Set Build Command: `npm install && npm run build`
5. Set Start Command: `npm start`

### 2.3 Environment Variables (Railway Dashboard)
```env
PORT=3000
DB_TYPE=postgres
DB_HOST=db.[project-ref].supabase.co
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_supabase_password
DB_NAME=postgres
JWT_SECRET=your-production-jwt-secret-min-32-chars
NODE_ENV=production
```

### 2.4 Custom Domain (Optional)
- Railway Dashboard → Settings → Domains
- Add custom domain: `api.panganmasadepan.com`

---

## 3. Frontend Deployment (Vercel)

### 3.1 Konfigurasi Vercel
1. Import project dari GitHub
2. Framework Preset: Vite
3. Root Directory: `frontend`
4. Build Command: `npm run build`
5. Output Directory: `dist`

### 3.2 Environment Variables (Vercel Dashboard)
```env
VITE_API_URL=https://your-api.railway.app
```

### 3.3 vercel.json (sudah dikonfigurasi)
```json
{
  "version": 2,
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "installCommand": "cd frontend && npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 4. Deployment Checklist

### Pre-deployment
- [ ] Database Supabase created
- [ ] Migrations run successfully
- [ ] Environment variables set di Railway
- [ ] Environment variables set di Vercel
- [ ] JWT_SECRET menggunakan strong secret (min 32 chars)

### Post-deployment
- [ ] Test login: POST `/auth/login`
- [ ] Test dashboard: GET `/dashboard/stats`
- [ ] Test frontend loads correctly
- [ ] Test API calls from frontend to backend
- [ ] Seed superuser account

---

## 5. Troubleshooting

### CORS Issues
Jika frontend tidak bisa call backend, tambahkan CORS config di `index.ts`:
```typescript
import cors from 'cors';
app.use(cors({
  origin: ['https://your-frontend.vercel.app', 'http://localhost:3001'],
  credentials: true
}));
```

### Database Connection Issues
- Pastikan IP Supabase tidak di-restrict
- Check connection string format
- Verify SSL mode: `?sslmode=require`

### Cold Start (Railway)
Railway free tier sleep after 5 min inactivity. Upgrade to paid atau gunakan:
- UptimeRobot untuk ping setiap 5 menit
- Railway Pro plan

---

## 6. Alternative: Full Vercel (Serverless)

⚠️ **Not Recommended** untuk app ini karena:
- 108 endpoints = banyak cold starts
- ML analysis bisa timeout (10s limit)
- TypeORM + serverless connection issues

Jika tetap mau full Vercel, perlu:
1. Convert Express ke Vercel Serverless Functions
2. Implement connection pooling (pgbouncer)
3. Split ML service ke separate worker

---

## Quick Commands

```bash
# Local development
npm run dev                    # Backend
cd frontend && npm run dev     # Frontend

# Production build
npm run build                  # Backend
cd frontend && npm run build   # Frontend

# Database
npm run migrate                # Run migrations
npm run typeorm migration:generate -- migration/NewMigration -d ./data-source.ts
```

---

## Support

- Repository: https://github.com/Logia-ysn/erp-pangan-masa-depan
- Issues: GitHub Issues
