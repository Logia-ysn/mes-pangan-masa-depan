# 🌾 ERP Pangan Masa Depan

> **Modern ERP Manufacturing System with AI-Powered Quality Analysis for Rice Mill Industry**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![TypeORM](https://img.shields.io/badge/TypeORM-0.3-orange.svg)](https://typeorm.io/)
[![Python](https://img.shields.io/badge/Python-3.9+-yellow.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📋 Deskripsi

**ERP Pangan Masa Depan** adalah sistem Enterprise Resource Planning (ERP) generasi terbaru yang dirancang khusus untuk industri penggilingan padi modern. Sistem ini mengintegrasikan **Machine Learning** untuk analisis kualitas gabah secara otomatis, menjadikannya solusi unik di industri ini.

Dengan arsitektur **Layered Architecture** yang bersih dan modular, sistem ini mudah dikembangkan, di-maintain, dan di-deploy baik secara lokal maupun cloud.

### 🎯 Visi
Memberdayakan industri penggilingan padi dengan teknologi modern untuk meningkatkan efisiensi, akurasi, dan profitabilitas.

---

## ✨ Fitur Utama

### 🤖 AI-Powered Quality Analysis
- **Color Grading**: Analisis warna gabah otomatis menggunakan Computer Vision (OpenCV + HSV Segmentation)
- **Dynamic Calibration**: Konfigurasi ambang batas warna (Hue, Saturation, Value) melalui database
- **Point-Based Grading System**: Sistem penilaian kualitas berbasis poin (1-30) dengan 9 tingkat grade (KW 1:1 hingga KW 3:3)
- **Real-time Analysis**: Upload foto gabah dan dapatkan hasil analisis dalam hitungan detik

### 🏭 Production Management
- **Worksheet Management**: Kelola lembar kerja produksi harian dengan tracking input/output
- **Multi-Factory Support**: Dukungan untuk PMD 1 & PMD 2 dengan output product berbeda
- **Process Steps Tracking**: Monitoring proses Drying, Husking, Polishing, dan Packing
- **HPP Calculation**: Hitung Harga Pokok Produksi secara otomatis
- **Side Product Tracking**: Kelola produk samping (Bekatul, Sekam, Menir)

### 📦 Inventory & Stock Management
- **Real-time Stock Tracking**: Monitor stok bahan baku dan produk jadi
- **Batch Management**: Tracking batch dari penerimaan hingga produksi
- **Stock Movement History**: Riwayat lengkap pergerakan stok
- **Multi-Product Type**: Dukungan GKP, GKG, PK, Glosor, Beras berbagai grade

### 💰 Finance Management
- **Daily Expenses**: Pencatatan pengeluaran harian
- **COGM Analysis**: Analisis Cost of Goods Manufactured
- **Expense Categories**: Kategorisasi pengeluaran terstruktur

### 👥 HRD Management
- **Attendance Tracking**: Pencatatan kehadiran karyawan
- **Employee Database**: Manajemen data karyawan lengkap
- **Demographics Report**: Laporan demografi karyawan

### 📊 Sales & Customer Management
- **Invoice Management**: Pembuatan dan manajemen faktur
- **Customer Database**: Database pelanggan terintegrasi
- **Payment Tracking**: Tracking pembayaran

### 🔧 Advanced Features
- **OEE Monitoring**: Overall Equipment Effectiveness tracking
- **Machine Maintenance**: Penjadwalan dan tracking maintenance mesin
- **Export & Print**: Export data ke CSV dan cetak laporan
- **Dark/Light Theme**: UI modern dengan dukungan tema gelap/terang

---

## 🏗️ Tech Stack

### Backend
| Technology | Description |
|------------|-------------|
| **Node.js** | JavaScript runtime |
| **TypeScript** | Type-safe JavaScript |
| **Express.js** | Web framework |
| **TypeORM** | ORM untuk database |
| **MySQL/PostgreSQL** | Database |
| **JWT** | Authentication |
| **NAIV Framework** | API design & codegen |

### Frontend
| Technology | Description |
|------------|-------------|
| **React 18** | UI Library |
| **Vite** | Build tool & dev server |
| **Vanilla CSS** | Custom styling dengan glassmorphism |
| **Recharts** | Data visualization |
| **Material Symbols** | Icon library |

### Machine Learning Service
| Technology | Description |
|------------|-------------|
| **Python 3.9+** | ML runtime |
| **OpenCV** | Computer vision |
| **NumPy** | Numerical computing |
| **FastAPI** (optional) | ML API server |

---

## 📁 Project Structure

```
erp-pangan-masa-depan/
├── 📁 design/                 # NAIV API design files (.naiv)
├── 📁 types/                  # Generated TypeScript types
│   ├── api/                  # API type definitions
│   └── model/                # Database model types
├── 📁 implementation/         # API handler implementations
├── 📁 src/
│   ├── services/             # Business logic layer
│   ├── repositories/         # Data access layer
│   ├── dto/                  # Data Transfer Objects
│   ├── utils/                # Utilities & helpers
│   └── ml/                   # ML Python scripts
├── 📁 frontend/               # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable components
│   │   ├── pages/            # Page components
│   │   ├── contexts/         # React contexts
│   │   ├── services/         # API services
│   │   └── utils/            # Frontend utilities
│   └── public/               # Static assets
├── 📁 ml-service/             # Machine Learning service
│   └── app/                  # FastAPI ML application
├── 📁 migration/              # Database migrations
├── 📄 data-source.ts          # TypeORM configuration
├── 📄 index.ts                # Server entry point
├── 📄 package.json            # Node.js dependencies
└── 📄 CHANGELOG.md            # Version history
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+**
- **npm** atau **yarn**
- **Python 3.9+** (untuk ML service)
- **MySQL** atau **PostgreSQL**
- **Git**

### Installation

```bash
# 1. Clone repository
git clone https://github.com/Logia-ysn/erp-pangan-masa-depan.git

# 2. Masuk ke direktori project
cd erp-pangan-masa-depan

# 3. Install backend dependencies
npm install

# 4. Setup environment
cp .env.example .env
# Edit .env dengan database credentials Anda

# 5. Run database migrations
npm run migrate

# 6. Install frontend dependencies
cd frontend
npm install
cd ..

# 7. (Optional) Setup ML service
cd ml-service
python -m venv venv
source venv/bin/activate  # atau venv\Scripts\activate di Windows
pip install -r requirements.txt
cd ..

# 8. Run development server
npm run dev
```

Backend akan berjalan di `http://localhost:3000`

### Frontend Development

```bash
cd frontend
npm run dev
```

Frontend akan berjalan di `http://localhost:5173`

---

## 🔧 Configuration

### Environment Variables

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=erp_pangan

# Server Configuration
PORT=3000
JWT_SECRET=your_jwt_secret

# Python Path (untuk ML service)
PYTHON_PATH=python3
```

### Quality Parameter Configuration

Parameter kualitas dan kalibrasi warna dikonfigurasi melalui tabel `QualityParameter`:

| Parameter Type | Example Name | Description |
|----------------|--------------|-------------|
| Grading Rules | `Moisture`, `Density`, `GreenPercentage` | Aturan grading berdasarkan range nilai |
| Calibration | `Calib_Green_Hue`, `Calib_Yellow_Sat` | Ambang batas HSV untuk deteksi warna |

---

## 🧪 ML Quality Analysis

### Cara Kerja

1. **Upload Gambar**: User mengupload foto sampel gabah
2. **Preprocessing**: Gambar di-crop dan dinormalisasi
3. **HSV Segmentation**: Deteksi area hijau (padi muda) dan kuning (padi matang)
4. **Percentage Calculation**: Hitung persentase masing-masing warna
5. **Grading**: Tentukan grade berdasarkan persentase hijau

### Grading Point System

| Grade | Level | Points |
|-------|-------|--------|
| KW 1 | 1 | 10 |
| KW 1 | 2 | 9 |
| KW 1 | 3 | 8 |
| KW 2 | 1 | 7 |
| KW 2 | 2 | 6 |
| KW 2 | 3 | 5 |
| KW 3 | 1 | 4 |
| KW 3 | 2 | 3 |
| KW 3 | 3 | 2 |
| REJECT | - | 1 |

Total Score = Points(Moisture) + Points(Density) + Points(Color)

---

## 📝 Available Scripts

### Backend

```bash
npm run dev          # Build & start server
npm run build        # Build TypeScript
npm run start        # Start built server
npm run codegen      # Generate API types from design
npm run migrate      # Run database migrations
npm run generate-migration migration/<name>  # Create new migration
```

### Frontend

```bash
cd frontend
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

## 🔐 Authentication

### Demo Accounts

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Operator | operator | operator123 |

### API Authentication

Semua endpoint (kecuali `/auth/login`) memerlukan JWT token di header:

```
Authorization: Bearer <token>
```

---

## 🎨 Screenshots

### Dashboard
<p align="center">
  <em>Dashboard dengan statistik real-time dan quick actions</em>
</p>

### Quality Analysis
<p align="center">
  <em>Modal analisis kualitas dengan ML-powered color grading</em>
</p>

### Production Module
<p align="center">
  <em>Manajemen worksheet produksi dengan HPP calculation</em>
</p>

---

## 📚 Documentation

- [CHANGELOG.md](CHANGELOG.md) - Riwayat perubahan versi
- [INSTRUCTION.md](INSTRUCTION.md) - Panduan pengembangan dengan NAIV framework
- [design/](design/) - API design files

---

## 🤝 Contributing

Kontribusi sangat dihargai! Untuk berkontribusi:

1. Fork repository ini
2. Buat branch baru (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

---

## 📄 License

Proyek ini dilisensikan di bawah **MIT License** - lihat file [LICENSE](LICENSE) untuk detail.

---

## 👥 Team

| Role | Name |
|------|------|
| **Lead Developer** | Yayang Setya Nugroho |
| **AI Assistant** | Claude by Anthropic |

---

## 📞 Support

- **Email**: support@panganmasadepan.com
- **Issues**: [GitHub Issues](https://github.com/Logia-ysn/erp-pangan-masa-depan/issues)

---

## 🙏 Acknowledgments

- [NAIV Framework](https://naiv.dev) - API Design & Codegen
- [TypeORM](https://typeorm.io) - Database ORM
- [React](https://reactjs.org) - UI Library
- [OpenCV](https://opencv.org) - Computer Vision
- [Recharts](https://recharts.org) - Data Visualization

---

<p align="center">
  Made with ❤️ for Indonesian Rice Mill Industry
</p>

<p align="center">
  <strong>PT Pangan Masa Depan © 2026</strong>
</p>
