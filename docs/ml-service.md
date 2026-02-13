# ML Service — Grain Quality Analysis (v2.0.0)

Dokumentasi teknis lengkap tentang bagaimana ML Service menganalisis kualitas gabah menggunakan computer vision.

---

## Daftar Isi

1. [Gambaran Umum](#gambaran-umum)
2. [Arsitektur & Struktur File](#arsitektur--struktur-file)
3. [Pipeline Analisis](#pipeline-analisis)
4. [Deteksi Warna (HSV)](#deteksi-warna-hsv)
5. [Sistem Grading](#sistem-grading)
6. [API Endpoints](#api-endpoints)
7. [Kalibrasi](#kalibrasi)
8. [Integrasi dengan Backend](#integrasi-dengan-backend)
9. [Deployment](#deployment)

---

## Gambaran Umum

ML Service adalah microservice FastAPI yang menganalisis foto gabah (beras) untuk menentukan kualitas berdasarkan distribusi warna. Service ini:

- Menerima gambar (base64 atau file upload)
- Mendeteksi 5 kategori warna: **hijau**, **kuning**, **merah**, **chalky** (kapur), dan **normal**
- Menentukan grade kualitas (**KW 1**, **KW 2**, **KW 3**) berdasarkan persentase hijau
- Mengembalikan hasil dalam format JSON

**Teknologi**: Python 3.9, FastAPI, OpenCV, NumPy, Pydantic

---

## Arsitektur & Struktur File

```
ml-service/
  app/
    main.py                    # Entry point FastAPI, CORS, router mounting
    config.py                  # Settings (env vars + defaults via pydantic-settings)
    routers/
      health.py                # GET /, GET /health
      analyze.py               # POST /analyze, POST /analyze-base64
      analyze_detailed.py      # POST /analyze-detailed
      calibration.py           # GET/PUT /calibration, /calibration/grading, /calibration/reset
    models/
      calibration.py           # CalibrationProfile, ColorRange
      grading.py               # GradingRule, GradingConfig
      requests.py              # Request body models
      responses.py             # Response models
    services/
      image_processor.py       # Decode, resize, konversi HSV, foreground mask
      color_detector.py        # Multi-color HSV detection engine
      grading_service.py       # Persentase warna → grade + level
      calibration_store.py     # In-memory state untuk kalibrasi & grading
  Dockerfile
  requirements.txt
```

### Alur Data

```
Request (base64/file)
  → image_processor.decode_base64()    # Strip data URI, decode base64
  → image_processor.preprocess()       # Resize, BGR→HSV, buat foreground mask
  → color_detector.detect_colors()     # Hitung persentase tiap warna
  → grading_service.determine_grade()  # Tentukan KW grade dari % hijau
  → Response JSON
```

---

## Pipeline Analisis

### Step 1: Decode & Resize

**File**: `services/image_processor.py`

1. **Decode base64**: Strip prefix `data:image/...;base64,` jika ada, lalu decode ke bytes
2. **Decode image**: `cv2.imdecode()` mengubah bytes menjadi array BGR (Blue-Green-Red)
3. **Resize**: Jika lebar > 800px, scale down proporsional. Ini menjaga kecepatan processing konsisten tanpa mengorbankan akurasi signifikan

### Step 2: Konversi HSV & Foreground Mask

Masih di `image_processor.py`:

1. **BGR → HSV**: OpenCV mengkonversi gambar ke ruang warna HSV (Hue-Saturation-Value)
   - **Hue (H)**: 0-179 di OpenCV (bukan 0-360). Menentukan jenis warna
   - **Saturation (S)**: 0-255. Seberapa "kuat" warnanya
   - **Value (V)**: 0-255. Seberapa terang

2. **Foreground Mask**: Membuat binary mask untuk memisahkan gabah dari background
   - Exclude pixel sangat terang (V > 240) → biasanya background putih
   - Exclude pixel sangat gelap (V < 15) → biasanya bayangan/background hitam
   - Hasilnya: mask dimana 255 = gabah, 0 = background
   - `valid_count` = total pixel gabah (dipakai sebagai denominator untuk persentase)

### Step 3: Deteksi Warna Multi-Color

**File**: `services/color_detector.py`

Setiap pixel gabah diklasifikasikan ke tepat satu kategori warna menggunakan **priority order** untuk mencegah double-counting:

```
Prioritas: Green > Yellow > Red > Chalky > Normal
```

Proses:
1. Mulai dengan `remaining` = seluruh foreground mask
2. **Green**: Cari pixel yang cocok dengan range HSV hijau di dalam `remaining`. Pixel yang match di-remove dari `remaining`
3. **Yellow**: Cari di sisa `remaining`. Remove yang match.
4. **Red**: Gabungkan dua range HSV (red_low + red_high) karena merah ada di kedua ujung spectrum hue. Remove yang match.
5. **Chalky**: Pixel dengan saturasi rendah dan value tinggi (pucat/kapur). Remove yang match.
6. **Normal**: Semua pixel gabah yang tersisa

Setiap kategori dihitung sebagai:
```
persentase = (pixel_kategori / valid_count) × 100
```

**Kenapa priority order?** Karena range HSV bisa overlap. Misalnya, pixel di batas hijau-kuning bisa match kedua range. Dengan priority, setiap pixel hanya dihitung sekali.

### Step 4: Grading

**File**: `services/grading_service.py`

Grade ditentukan **hanya dari `green_percentage`** (persentase hijau), karena gabah hijau = gabah mentah = indikator utama kualitas.

Rules di-sort ascending by `max_green`, lalu first match wins:

| Grade | Level | Kondisi | Status |
|-------|-------|---------|--------|
| KW 1 | 1 | green < 3% | OK |
| KW 1 | 2 | green < 5% | OK |
| KW 1 | 3 | green < 10% | OK |
| KW 2 | 1 | green < 15% | OK |
| KW 2 | 2 | green < 20% | OK |
| KW 3 | 1 | green < 100% | WARNING |

Contoh: green = 7% → match "KW 1 Level 3" (rule pertama dimana 7 < max_green)

---

## Deteksi Warna (HSV)

### Range HSV Default

Semua range mengikuti OpenCV convention: H(0-179), S(0-255), V(0-255).

| Warna | Hue Min | Hue Max | Sat Min | Sat Max | Val Min | Val Max |
|-------|---------|---------|---------|---------|---------|---------|
| **Green** | 25 | 95 | 25 | 255 | 40 | 255 |
| **Yellow** | 10 | 25 | 40 | 255 | 40 | 255 |
| **Red (low)** | 0 | 10 | 50 | 255 | 40 | 255 |
| **Red (high)** | 170 | 179 | 50 | 255 | 40 | 255 |
| **Chalky** | 0 | 179 | 0 | 40 | 180 | 255 |

### Kenapa Red Punya 2 Range?

Di ruang warna HSV, merah ada di **kedua ujung** spectrum hue:
- Hue 0-10: merah murni → oranye kemerahan
- Hue 170-179: magenta → merah murni

Ini karena hue adalah lingkaran (0° = 360°), dan merah tepat di titik wrap-around. Jadi kita OR-kan kedua mask.

### Kenapa Chalky Tidak Pakai Hue Spesifik?

Chalky/kapur bukan tentang jenis warna tertentu, tapi tentang **kurangnya saturasi** pada pixel yang terang. Gabah chalky terlihat "pucat" — hampir putih tapi belum cukup putih untuk jadi background. Maka: S rendah (< 40) + V tinggi (> 180), hue diabaikan (0-179 = semua).

### Sumber Default Value

- Green & Yellow: dari `seed-calib-params.ts` (database calibration seeds)
- Red & Chalky: ditambahkan di v2.0.0 untuk melengkapi analisis
- Semua bisa di-override via `PUT /calibration` atau per-request di `/analyze-detailed`

---

## Sistem Grading

### Logika

```python
# Rules sorted by max_green ascending
for rule in sorted_rules:
    if green_pct < rule.max_green:
        return rule.grade, rule.level, status
```

- **KW 1** (Kualitas Wahid / Premium): gabah hijau sedikit, kualitas terbaik
- **KW 2** (Medium): gabah hijau sedang
- **KW 3** (Low): gabah hijau banyak (>= 20%), butuh perhatian

### Status

- **OK**: KW 1 atau KW 2 — kualitas bisa diterima
- **WARNING**: KW 3 — kualitas rendah, perlu review

### Level

Level menunjukkan seberapa "baik" di dalam grade yang sama:
- Level 1 = terbaik dalam grade tersebut
- Level 3 = batas bawah grade tersebut

---

## API Endpoints

### `GET /` — Root
```json
{"status": "ML Service Running", "version": "2.0.0"}
```

### `GET /health` — Health Check
```json
{"status": "healthy"}
```

### `POST /analyze` — File Upload Analysis
- **Content-Type**: `multipart/form-data`
- **Body**: `file` (image file)
- Response sama dengan `/analyze-base64`

### `POST /analyze-base64` — Base64 Analysis (Backward Compatible)

Endpoint utama yang dipanggil oleh backend (`T_analyzeGrain.ts`).

**Request**:
```json
{
  "image_base64": "iVBORw0KGgo...",
  "supplier": "PT Tani Makmur",
  "lot": "LOT-2026-001"
}
```

**Response**:
```json
{
  "green_percentage": 7.23,
  "grade": "KW 1",
  "status": "OK",
  "level": 3,
  "supplier": "PT Tani Makmur",
  "lot": "LOT-2026-001",
  "yellow_percentage": 12.45,
  "red_percentage": 2.10,
  "chalky_percentage": 5.33,
  "normal_percentage": 72.89
}
```

Field `yellow_percentage`, `red_percentage`, `chalky_percentage`, `normal_percentage` adalah field baru (optional). Backend lama yang hanya membaca `green_percentage`, `grade`, `status`, `level` tidak terpengaruh.

### `POST /analyze-detailed` — Full Analysis

Endpoint baru dengan hasil lengkap dan support override kalibrasi per-request.

**Request**:
```json
{
  "image_base64": "iVBORw0KGgo...",
  "supplier": "PT Tani Makmur",
  "lot": "LOT-2026-001",
  "calibration": {
    "green": {"h_min": 30, "h_max": 90, "s_min": 30, "s_max": 255, "v_min": 40, "v_max": 255},
    "yellow": {"h_min": 10, "h_max": 25, "s_min": 40, "s_max": 255, "v_min": 40, "v_max": 255},
    "red_low": {"h_min": 0, "h_max": 10, "s_min": 50, "s_max": 255, "v_min": 40, "v_max": 255},
    "red_high": {"h_min": 170, "h_max": 179, "s_min": 50, "s_max": 255, "v_min": 40, "v_max": 255},
    "chalky": {"h_min": 0, "h_max": 179, "s_min": 0, "s_max": 40, "v_min": 180, "v_max": 255}
  },
  "grading_rules": [
    {"grade": "KW 1", "level": 1, "max_green": 3.0},
    {"grade": "KW 1", "level": 2, "max_green": 5.0}
  ]
}
```

Field `calibration` dan `grading_rules` opsional. Jika tidak dikirim, pakai konfigurasi server saat ini.

**Response**:
```json
{
  "colors": {
    "green_percentage": 7.23,
    "yellow_percentage": 12.45,
    "red_percentage": 2.10,
    "chalky_percentage": 5.33,
    "normal_percentage": 72.89
  },
  "grade": "KW 1",
  "status": "OK",
  "level": 3,
  "supplier": "PT Tani Makmur",
  "lot": "LOT-2026-001",
  "calibration_used": { ... },
  "grading_rules_used": [ ... ],
  "processing_time_ms": 45.23
}
```

### `GET /calibration` — Lihat Konfigurasi Saat Ini
```json
{
  "profile": { "green": {...}, "yellow": {...}, ... },
  "grading": { "rules": [...] }
}
```

### `PUT /calibration` — Update HSV Ranges
Body: object `CalibrationProfile` lengkap (green, yellow, red_low, red_high, chalky)

### `PUT /calibration/grading` — Update Grading Rules
```json
{
  "rules": [
    {"grade": "KW 1", "level": 1, "max_green": 2.0},
    {"grade": "KW 1", "level": 2, "max_green": 4.0},
    ...
  ]
}
```

### `POST /calibration/reset` — Reset ke Default

---

## Kalibrasi

### In-Memory State

Kalibrasi disimpan di memory (singleton `calibration_store`). Artinya:
- Perubahan via `PUT /calibration` berlaku langsung untuk request berikutnya
- **Reset saat service restart** — kembali ke default dari `config.py`

### Environment Variable Override

Semua default value bisa di-override via environment variable dengan prefix `ML_`:

```env
ML_GREEN_H_MIN=30
ML_GREEN_H_MAX=90
ML_BG_WHITE_THRESHOLD=230
```

### Tips Kalibrasi

1. **Jika terlalu banyak pixel terdeteksi hijau**: Naikkan `s_min` green (misal 25 → 40) untuk hanya menangkap hijau yang lebih "kuat"
2. **Jika gabah kuning terdeteksi sebagai hijau**: Turunkan `h_max` green (misal 95 → 85) atau naikkan `h_min` yellow
3. **Gunakan `/analyze-detailed`** dengan override kalibrasi untuk eksperimen tanpa mengubah konfigurasi server

---

## Integrasi dengan Backend

### Alur End-to-End

```
Frontend (QCGabah.tsx)
  → capture foto gabah, convert ke base64
  → POST /api/analyze-grain { image_base64, supplier, lot }

Backend (T_analyzeGrain.ts)
  → POST {ML_SERVICE_URL}/analyze-base64 { image_base64, supplier, lot }

ML Service
  → analisis gambar
  → return { green_percentage, grade, status, level, supplier, lot, ... }

Backend
  → simpan ke database (RawMaterialQualityAnalysis)
  → return entity ke frontend

Frontend
  → tampilkan hasil (grade, status, green_percentage)
```

### Kontrak Response yang Dipakai Backend

`T_analyzeGrain.ts` hanya membaca:
- `green_percentage` (number)
- `grade` (string: "KW 1", "KW 2", "KW 3")
- `level` (number: 1, 2, 3)
- `status` (string: "OK", "WARNING")

Field baru (`yellow_percentage`, dll) diabaikan oleh backend lama — **tidak perlu update backend atau frontend**.

### Database Schema

Tabel `RawMaterialQualityAnalysis` sudah memiliki kolom:
- `green_percentage`
- `yellow_percentage` (siap digunakan saat backend di-update)
- `red_percentage` (siap digunakan saat backend di-update)

---

## Deployment

### Docker

```bash
cd ml-service
docker build -t ml-service .
docker run -p 8000:8000 ml-service
```

### Local Development

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Environment Variables

| Variable | Default | Keterangan |
|----------|---------|------------|
| `ML_APP_TITLE` | QC Gabah ML Service | Nama service |
| `ML_APP_VERSION` | 2.0.0 | Versi |
| `ML_MAX_IMAGE_WIDTH` | 800 | Max width resize |
| `ML_GREEN_H_MIN` | 25 | Green hue minimum |
| `ML_GREEN_H_MAX` | 95 | Green hue maximum |
| `ML_BG_WHITE_THRESHOLD` | 240 | Threshold background putih |
| `ML_BG_DARK_THRESHOLD` | 15 | Threshold background gelap |
| ... | ... | Semua HSV params bisa di-override |

### Health Check

```bash
curl http://localhost:8000/health
# {"status": "healthy"}
```
