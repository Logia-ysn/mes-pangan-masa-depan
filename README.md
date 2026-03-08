# MES Pangan Masa Depan

> **Modern Manufacturing Execution System (MES) with AI-Powered Quality Analysis for the Rice Mill Industry**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.x-2D3748.svg)](https://www.prisma.io/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## Deskripsi

**MES Pangan Masa Depan** adalah sistem Manufacturing Execution System (MES) yang berfokus secara eksklusif pada eksekusi produksi (shop-floor) di industri penggilingan padi modern. Sistem ini mengintegrasikan **Machine Learning** untuk analisis kualitas gabah secara otomatis melalui computer vision.

**Scope Aplikasi**: Penerimaan Bahan Baku, Produksi (Work Order, Penjadwalan, Silsilah Batch, Shift Handover), Inventory, Kualitas (QC & NCR), dan Peralatan.
Pembelian, Penjualan, Keuangan, dan HRD dikelola oleh perangkat lunak ERP terpisah (di luar scope MES).

---

## Modul

| Modul | Status | Deskripsi |
|-------|--------|-----------|
| **Core Production** | Selesai | Worksheet, Stok, Mesin, Maintenance, OEE |
| **Quality Control** | Selesai | ML Grain Analysis, Kalibrasi HSV, Grading (v2.22.0) |
| **Dashboard** | Selesai | KPI, Grafik Produksi, Machine Summary, Inventory Snapshot |
| **Penerimaan Bahan Baku** | Selesai | Raw Material Receipt + QC Integration |
| **Penjualan (Legacy)** | Hide/Del | Modul ERP yang telah dikeluarkan dari scope antarmuka MES. |
| **Pembelian (Legacy)** | Hide/Del | Modul ERP yang telah dikeluarkan dari scope antarmuka MES. |
| **Transformasi MES (v2.29.0)** | Selesai | Batch Genealogy, Production Scheduling, NCR, Shift Handover |
| **Authentication** | Selesai | Login, Register, Role-based Access (5 level) |
| **Multi-Factory** | Selesai | Support PMD-1 & PMD-2 |
| **Mobile UX (v2.17.0)** | Selesai | Horizontal scroll factory selector, typography scaling |
| **Settings** | Selesai | Supplier, Product Type, Quality Config |

---

## Tech Stack

### Backend
| Technology | Description |
|------------|-------------|
| **Node.js 18+** | JavaScript runtime |
| **TypeScript 5.9** | Type-safe JavaScript |
| **Express.js** | Web framework |
| **Prisma 6** | ORM untuk PostgreSQL |
| **PostgreSQL** | Database |
| **NAIV Framework** | Auto-generate Express routes dari type definitions |
| **PDFKit** | Generate invoice PDF |

### Frontend
| Technology | Description |
|------------|-------------|
| **React 18** | UI Library |
| **Vite** | Build tool & dev server |
| **Vanilla CSS** | Custom styling (glassmorphism) |
| **Recharts** | Data visualization |
| **Material Symbols** | Icon library |

### Machine Learning Service
| Technology | Description |
|------------|-------------|
| **Python 3.9+** | ML runtime |
| **FastAPI** | ML API server |
| **OpenCV** | Computer vision |
| **NumPy** | Numerical computing |

### Infrastructure
| Technology | Description |
|------------|-------------|
| **Docker** | Containerization (backend, frontend, ML) |
| **Docker Compose** | Multi-container orchestration |
| **Nginx** | Frontend reverse proxy |

---

## Project Structure

```
erp-pangan-masa-depan/
├── prisma/
│   ├── schema.prisma            # Database schema (41 models, 12 enums)
│   └── migrations/              # Prisma migrations
├── types/
│   ├── api/                     # 151 API type definitions (NAIV)
│   ├── model/                   # Database model types
│   └── schema/                  # Shared schemas (Auth, Pagination, etc.)
├── implementation/              # 151 API handler implementations
├── src/
│   ├── modules/                 # Modular service architecture (v2.27.0)
│   │   └── production/worksheet/
│   │       ├── worksheet.constants.ts    # Shared constants
│   │       ├── worksheet.types.ts        # Centralized DTOs & types
│   │       ├── hpp/                      # HPP Calculator service
│   │       ├── stock/                    # Stock Movement service
│   │       └── workflow/                 # Workflow State Machine service
│   ├── repositories/            # 29 data access repositories
│   ├── services/                # 18 business logic services
│   ├── dto/                     # Data Transfer Objects
│   ├── utils/                   # apiWrapper, errors, response
│   ├── libs/                    # Prisma client instance
│   └── ml/                      # Python ML script (legacy)
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── auth/            # Login
│       │   ├── dashboard/       # Dashboard
│       │   ├── production/      # Worksheets, Stocks, Machines, Maintenance, OEE, QC
│       │   ├── sales/           # Customers, Invoices, Payments, Delivery Orders
│       │   ├── purchasing/      # PurchaseOrders, Suppliers, GoodsReceipts
│       │   ├── inventory/       # Stocks, Transfers, StockOpname
│       │   ├── finance/         # Expenses
│       │   ├── reports/         # Production, Sales, COGM, Stock, Quality
│       │   └── admin/           # Users, AuditLogs, Employees, Factories
│       ├── features/            # Feature modules (v2.27.0)
│       │   └── production/worksheet/
│       │       ├── types/       # Shared type definitions
│       │       ├── config/      # Shared UI config
│       │       └── hooks/       # Extracted custom hooks
│       ├── components/          # Layout, Dashboard, Production, UI components
│       ├── contexts/            # Auth, Theme, Toast, Layout contexts
│       ├── services/            # API client (axios)
│       └── utils/               # Format, export, print, logger utilities
├── ml-service/
│   └── app/
│       ├── main.py              # FastAPI entry point
│       ├── routers/             # health, analyze, calibration
│       ├── models/              # grading, requests, responses
│       └── services/            # image_processor, color_detector, grading_service
├── design/                      # NAIV API design files (.naiv)
├── docker-compose.yml
├── Dockerfile                   # Backend
├── frontend/Dockerfile          # Frontend + Nginx
└── ml-service/Dockerfile        # ML service
```

---

## Quick Start

### Prerequisites
- **Node.js 18+**
- **PostgreSQL**
- **Python 3.9+** (untuk ML service)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Logia-ysn/erp-pangan-masa-depan.git
cd erp-pangan-masa-depan

# 2. Install backend dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env (lihat bagian Configuration)

# 4. Run database migrations
npx prisma migrate deploy

# 5. Generate Prisma client
npx prisma generate

# 6. Install frontend dependencies
cd frontend && npm install && cd ..

# 7. (Optional) Setup ML service
cd ml-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cd ..
```

### Development

```bash
# Backend (http://localhost:3000)
npm run dev

# Frontend (http://localhost:5173)
cd frontend && npm run dev

# ML Service (http://localhost:8000)
cd ml-service && uvicorn app.main:app --reload
```

### Docker

```bash
docker-compose up --build
```

---

## Configuration

### Environment Variables

```env
# Database (Prisma)
DATABASE_URL=postgresql://user:password@localhost:5432/erp_pangan

# Server
PORT=3000
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

# ML Service
ML_SERVICE_URL=http://localhost:8000
PYTHON_PATH=python3
```

---

## Architecture

### Backend Pattern

```
NAIV Type Definition (types/api/) → Auto-generated Express Route
                                         ↓
                            Implementation (implementation/)
                                         ↓
                              apiWrapper + requireAuth
                                         ↓
                               Service (business logic)
                                         ↓
                            Repository (data access / Prisma)
```

### Authentication & Authorization

Authentication menggunakan httpOnly cookie dengan JWT. Role hierarchy (dari rendah ke tinggi):

```
OPERATOR → SUPERVISOR → MANAGER → ADMIN → SUPERUSER
```

Setiap endpoint memerlukan minimum role tertentu. User dengan role lebih tinggi otomatis memiliki akses ke endpoint role di bawahnya.

### Stock Flow

**Penjualan (Invoice)**:
```
Create Invoice → stockService.removeStock('SALE') per item
Delete Invoice → stockService.addStock('SALE_REVERSAL') per item
```

**Pembelian (Purchase Order)**:
```
Create PO (DRAFT) → No stock change
Approve PO → APPROVED
Receive Goods → stockService.addStock('GOODS_RECEIPT') per item
  → Update received_quantity → Auto-update PO status (PARTIAL_RECEIVED / RECEIVED)
Delete Goods Receipt → stockService.removeStock('GOODS_RECEIPT_REVERSAL')
Cancel PO → Reverse all stock, set CANCELLED
```

---

## Modul Detail

### Penjualan (Sales)

- **Customer Management**: CRUD data customer
- **Invoice**: Buat invoice dengan items, auto stock deduction, tax/discount
- **Payment**: Catat pembayaran per invoice, tracking sisa tagihan
- **PDF Export**: Generate invoice PDF (header, items table, summary, payments, notes)

### Pembelian (Purchasing)

- **Purchase Order**: Buat PO ke supplier, workflow DRAFT → APPROVED → RECEIVED
- **Goods Receipt**: Terima barang per PO (partial/full), auto stock IN
- **Stock Integration**: Stok otomatis bertambah saat goods receipt, reversal saat cancel/delete

### Produksi (Production)

- **Worksheet**: Lembar kerja produksi harian (input bahan baku, output product)
- **Process Tracking**: Drying, Husking, Polishing, Packing
- **HPP Calculation**: Hitung Harga Pokok Produksi otomatis
- **Side Products**: Tracking Bekatul, Sekam, Menir

### Quality Control

- **ML Grain Analysis**: Upload foto gabah, analisis warna otomatis (HSV segmentation)
- **Dynamic Calibration**: Konfigurasi threshold warna via database
- **Grading System**: Penilaian berbasis poin (1-30), 9 grade (KW 1:1 - KW 3:3)

### Inventory

- **Real-time Stock**: Monitor stok bahan baku dan produk jadi
- **Stock Movement**: Riwayat lengkap (IN/OUT) dengan reference type
- **Multi-Product**: GKP, GKG, PK, Glosor, Beras berbagai grade

### Maintenance

- **Machine Management**: Data mesin per factory
- **Maintenance Scheduling**: Penjadwalan dan tracking maintenance
- **OEE Monitoring**: Overall Equipment Effectiveness per mesin

---

## API Overview

Total **151 API endpoints** yang di-generate oleh NAIV framework:

| Domain | Endpoints | Contoh |
|--------|-----------|--------|
| Auth | 4 | login, register, changePassword, seedSuperuser |
| Dashboard | 4 | stats, executive, productionSummary, dailyExpenses |
| Production | 30+ | worksheet, outputProduct, dryingLog, qcResult |
| Inventory | 15+ | stock, stockMovement, stockOpname |
| Quality | 5 | analyzeGrain, qualityParameter, submitAnalysis |
| Sales | 20+ | customer, invoice, payment, deliveryOrder |
| Purchasing | 15+ | purchaseOrder, goodsReceipt, approve, cancel |
| Settings | 20+ | supplier, productType, factory, machine, employee |
| User | 6 | CRUD + role management, attendance |

---

## Available Scripts

### Backend

```bash
npm run dev              # Build & start server
npm run build            # Build TypeScript
npm run start            # Start built server
npm run codegen          # Generate API types dari NAIV design
npx prisma migrate dev   # Create & apply migration
npx prisma generate      # Generate Prisma client
npx prisma studio        # Open Prisma Studio (DB GUI)
```

### Frontend

```bash
cd frontend
npm run dev              # Start dev server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build
```

---

## Seed Data

```bash
# Create superuser
curl -X POST http://localhost:3000/seed-superuser \
  -H "Content-Type: application/json" \
  -d '{"secretKey": "P4ng4nM4s4D3p4nJ4y4!"}'
```

| Role | Email | Password |
|------|-------|----------|
| Superuser | root@pangan.com | root123 |

---

## Documentation

- [CHANGELOG.md](CHANGELOG.md) - Riwayat perubahan versi
- [DEVLOG.md](DEVLOG.md) - Catatan teknis pengembangan
- [INSTRUCTION.md](INSTRUCTION.md) - Panduan pengembangan dengan NAIV framework
- [LOCAL_SETUP.md](LOCAL_SETUP.md) - Setup lokal
- [DEPLOY_ONLINE.md](DEPLOY_ONLINE.md) - Deployment guide
- [design/](design/) - NAIV API design files

---

## Team

| Role | Name |
|------|------|
| **Lead Developer** | Yayang Setya Nugroho |
| **AI Assistant** | Claude by Anthropic |

---

## License

MIT License - lihat [LICENSE](LICENSE) untuk detail.

---

<p align="center">
  <strong>PT Pangan Masa Depan &copy; 2026</strong>
</p>
