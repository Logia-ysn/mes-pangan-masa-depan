# Plan: Pembaruan Sistem Visual Analysis — Deteksi Padi Rusak & Busuk

## Status Saat Ini

### Arsitektur
```
Frontend (React) → Backend (Express) → ML Service (FastAPI + OpenCV)
```

### Cara Kerja Sekarang
- Sistem menggunakan **HSV color thresholding** (bukan neural network)
- Pixel gambar diklasifikasi ke 5 kategori: **Green, Yellow, Red, Chalky, Normal**
- **Hanya `green_percentage` yang dipakai untuk grading** → KW 1/2/3
- Yellow, Red, Chalky, Normal dihitung tapi **diabaikan** dalam penentuan grade
- Asumsi: semakin hijau = semakin mentah = kualitas rendah

### Masalah
1. **Grading hanya berdasarkan hijau vs non-hijau** — tidak mencerminkan kondisi lapangan
2. **Padi rusak (coklat/gelap) tidak terdeteksi** — tercampur ke kategori "Normal"
3. **Padi busuk (hitam/sangat gelap) tidak terdeteksi** — sebagian terbuang oleh dark mask (< 15 grayscale), sebagian masuk "Normal"
4. Akurasi rendah karena hanya fokus ke satu dimensi warna

---

## Konsep Baru: Yellow vs Non-Yellow (Sederhana)

### Prinsip Dasar
Padi gabah berkualitas baik berwarna **kuning keemasan**. Segala warna selain kuning adalah indikasi masalah:

```
┌─────────────────────────────────────────────────┐
│              TOTAL GRAIN PIXELS                  │
│                                                  │
│  ┌──────────────┐  ┌────────────────────────┐   │
│  │   KUNING ✓   │  │    NON-KUNING ✗        │   │
│  │  (Baik/Good)  │  │                        │   │
│  │              │  │  ┌──────┐ ┌──────────┐  │   │
│  │  Kuning muda │  │  │Hijau │ │  Rusak   │  │   │
│  │  Kuning emas │  │  │(mentah)│ │(coklat)  │  │   │
│  │  Kuning tua  │  │  └──────┘ └──────────┘  │   │
│  │              │  │  ┌──────┐ ┌──────────┐  │   │
│  │              │  │  │Merah │ │  Busuk   │  │   │
│  │              │  │  │      │ │(hitam)   │  │   │
│  │              │  │  └──────┘ └──────────┘  │   │
│  │              │  │  ┌──────────────────┐   │   │
│  │              │  │  │  Chalky (pucat)  │   │   │
│  │              │  │  └──────────────────┘   │   │
│  └──────────────┘  └────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Kategori Warna Baru (7 kategori)

| Kategori | Warna Visual | HSV Range (Estimasi) | Keterangan |
|----------|-------------|----------------------|------------|
| **Kuning (Good)** | Kuning emas | H: 15-35, S: 50-255, V: 100-255 | Padi matang sempurna |
| **Hijau (Mentah)** | Hijau muda-tua | H: 36-95, S: 25-255, V: 40-255 | Belum matang |
| **Rusak** | Coklat gelap | H: 5-20, S: 30-200, V: 30-120 | Kerusakan fisik, jamur awal |
| **Busuk** | Hitam/coklat sangat gelap | H: 0-179, S: 0-255, V: 15-50 | Busuk, tidak layak |
| **Merah** | Merah/oranye | H: 0-10 & 170-179, S: 50-255, V: 40-255 | Varietas merah / over-dry |
| **Chalky** | Putih pucat | H: 0-179, S: 0-40, V: 180-255 | Kapur/chalk |
| **Lainnya** | — | Sisa | Tidak terklasifikasi |

### Formula Grading Baru

```
yellow_pct      = pixel kuning / total grain pixels × 100
defect_pct      = (rusak + busuk) / total grain pixels × 100
green_pct       = pixel hijau / total grain pixels × 100
non_yellow_pct  = 100 - yellow_pct
```

**Dua faktor penentu grade:**

| Grade | Yellow Min (%) | Defect Max (%) | Green Max (%) | Status |
|-------|---------------|----------------|---------------|--------|
| KW 1 Lv.1 | ≥ 95 | ≤ 1 | ≤ 2 | OK |
| KW 1 Lv.2 | ≥ 90 | ≤ 2 | ≤ 5 | OK |
| KW 1 Lv.3 | ≥ 85 | ≤ 3 | ≤ 8 | OK |
| KW 2 Lv.1 | ≥ 75 | ≤ 5 | ≤ 15 | OK |
| KW 2 Lv.2 | ≥ 65 | ≤ 8 | ≤ 20 | OK |
| KW 2 Lv.3 | ≥ 55 | ≤ 10 | ≤ 25 | WARNING |
| KW 3 Lv.1 | < 55 | ≤ 15 | any | WARNING |
| KW 3 Lv.2 | any | ≤ 25 | any | WARNING |
| REJECT | any | > 25 | any | REJECTED |

> **Logika**: Grade = worst-case dari ketiga kondisi. Jika yellow ≥ 90% tapi defect 6% → turun ke KW 2.

---

## Perubahan yang Dibutuhkan

### 1. ML Service (Python/FastAPI)

#### a. `app/config.py` — Tambah HSV range untuk Rusak & Busuk

```python
# Tambah default range baru
DAMAGED_H_MIN=5    DAMAGED_H_MAX=20
DAMAGED_S_MIN=30   DAMAGED_S_MAX=200
DAMAGED_V_MIN=30   DAMAGED_V_MAX=120

ROTTEN_H_MIN=0     ROTTEN_H_MAX=179
ROTTEN_S_MIN=0     ROTTEN_S_MAX=255
ROTTEN_V_MIN=15    ROTTEN_V_MAX=50
```

#### b. `app/services/color_detector.py` — Tambah deteksi Rusak & Busuk

Ubah priority order menjadi:
```
Busuk > Rusak > Hijau > Kuning > Merah > Chalky > Normal
```

Alasan urutan:
- **Busuk duluan** karena range V rendah bisa overlap dengan warna lain
- **Rusak** sebelum kuning karena coklat gelap bisa salah masuk kuning

Tambah dua mask baru dalam loop deteksi:
```python
# Busuk (very dark grains)
rotten_mask = cv2.inRange(hsv, rotten_lower, rotten_upper) & remaining
rotten_count = cv2.countNonZero(rotten_mask)
remaining = remaining & ~rotten_mask

# Rusak (brown/dark damaged grains)
damaged_mask = cv2.inRange(hsv, damaged_lower, damaged_upper) & remaining
damaged_count = cv2.countNonZero(damaged_mask)
remaining = remaining & ~damaged_mask
```

#### c. `app/services/grading_service.py` — Ubah logika grading

Dari: hanya cek `green_percentage`
Ke: cek `yellow_pct`, `defect_pct` (rusak+busuk), dan `green_pct`

```python
def determine_grade(self, color_result: dict) -> GradeResult:
    yellow_pct = color_result["yellow_percentage"]
    defect_pct = color_result["damaged_percentage"] + color_result["rotten_percentage"]
    green_pct = color_result["green_percentage"]

    # Evaluasi setiap rule, ambil worst-case
    for rule in sorted_rules:
        if (yellow_pct >= rule.min_yellow
            and defect_pct <= rule.max_defect
            and green_pct <= rule.max_green):
            return GradeResult(grade=rule.grade, level=rule.level, ...)

    return GradeResult(grade="REJECT", ...)
```

#### d. `app/models/` — Update response & calibration models

**`responses.py`** — Tambah field:
```python
class ColorBreakdown(BaseModel):
    green_percentage: float
    yellow_percentage: float
    red_percentage: float
    chalky_percentage: float
    damaged_percentage: float    # BARU
    rotten_percentage: float     # BARU
    normal_percentage: float
    defect_percentage: float     # BARU (damaged + rotten)
```

**`calibration.py`** — Tambah `damaged` dan `rotten` di `CalibrationProfile`

**`grading.py`** — Update `GradingRule` dengan `min_yellow`, `max_defect`, `max_green`

#### e. `app/services/image_processor.py` — Turunkan dark threshold

Ubah `dark_threshold` dari **15** ke **10** agar padi busuk (V: 15-50) tidak terbuang oleh background mask.

#### f. `app/routers/` — Endpoint tetap sama, response bertambah field

Tidak perlu endpoint baru. Endpoint existing (`/analyze-base64`, `/analyze-detailed`) akan return data lebih lengkap.

---

### 2. Backend (Node.js/Express)

#### a. `types/api/T_analyzeGrain.ts` — Update type definitions

Tambah field `damaged_percentage`, `rotten_percentage`, `defect_percentage` di response type.

#### b. `implementation/T_analyzeGrain.ts` — Teruskan field baru

Pastikan field baru dari ML service di-pass ke response dan disimpan ke DB.

#### c. `src/services/quality-analysis.service.ts` — Update grade calculation

Tambah `defect_percentage` sebagai parameter dalam kalkulasi grade di sisi backend (untuk `RawMaterialQualityAnalysis`).

---

### 3. Database (Prisma)

#### a. Migration — Tambah kolom baru

```prisma
model QCGabah {
  // ... existing fields ...
  damaged_percentage  Float?    // BARU
  rotten_percentage   Float?    // BARU
  defect_percentage   Float?    // BARU (damaged + rotten)
}

model RawMaterialQualityAnalysis {
  // ... existing fields ...
  damaged_percentage  Float?    // BARU
  rotten_percentage   Float?    // BARU
  defect_percentage   Float?    // BARU
}
```

Nullable (`Float?`) untuk backward compatibility dengan data lama.

---

### 4. Frontend (React/TypeScript)

#### a. `QCGabah.tsx` — Tampilkan breakdown lengkap

Dari hanya menampilkan "Green %" → tampilkan stacked bar chart:

```
Analisis Warna:
┌────────────────────────────────────────────┐
│ ████████████████ ██ █ █                    │
│ Kuning: 82%  Hijau: 8%  Rusak: 5%  ...    │
└────────────────────────────────────────────┘
Defect Total: 7%    Status: KW 2 Lv.1
```

#### b. `QualityAnalysisModal.tsx` — Update color analysis section

- Tampilkan `defect_percentage` dan breakdown (rusak vs busuk)
- Warning badge jika defect > threshold
- Update point calculation jika perlu

#### c. `QualityConfig.tsx` — Tambah konfigurasi threshold baru

Tambah input untuk:
- HSV range untuk "Rusak" dan "Busuk"
- Grading rule yang mengacu ke `min_yellow`, `max_defect`, `max_green`

#### d. `QualityTrends.tsx` — Tambah tren defect

Tambah line chart untuk `defect_percentage` trend over time.

---

## Urutan Implementasi

```
Phase 1: ML Service (core detection)
  ├─ 1.1 Update config.py — tambah HSV range
  ├─ 1.2 Update models/ — tambah field baru
  ├─ 1.3 Update color_detector.py — tambah Rusak & Busuk detection
  ├─ 1.4 Update grading_service.py — logika grading baru
  ├─ 1.5 Update image_processor.py — turunkan dark threshold
  └─ 1.6 Test dengan sample images

Phase 2: Database & Backend
  ├─ 2.1 Prisma migration — tambah kolom
  ├─ 2.2 Update types & implementation
  └─ 2.3 Update quality-analysis service

Phase 3: Frontend
  ├─ 3.1 Update QCGabah page — full breakdown
  ├─ 3.2 Update QualityAnalysisModal — defect display
  ├─ 3.3 Update QualityConfig — threshold settings
  └─ 3.4 Update QualityTrends — defect trends

Phase 4: Kalibrasi & Testing
  ├─ 4.1 Kumpulkan sample foto padi rusak & busuk
  ├─ 4.2 Fine-tune HSV range dengan foto real
  ├─ 4.3 A/B test: grading lama vs baru
  └─ 4.4 User acceptance testing
```

---

## Catatan Penting

1. **HSV range untuk Rusak & Busuk perlu di-tune** dengan foto asli dari lapangan — nilai di atas adalah estimasi awal
2. **Backward compatible** — data lama tetap valid (kolom baru nullable)
3. **Dark threshold harus diturunkan** dari 15 → 10 agar padi busuk tidak dibuang sebagai background
4. **Urutan prioritas deteksi sangat penting** — Busuk > Rusak > Hijau > Kuning untuk menghindari misclassification
5. **Grading sekarang multi-dimensional** — bukan hanya satu parameter tapi kombinasi yellow%, defect%, dan green%
