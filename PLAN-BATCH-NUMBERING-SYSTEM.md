# Plan: Implementasi System Batch Numbering Otomatis

> **Tanggal**: 16 Februari 2026
> **Referensi**: `System Batch Numbering.png` — diagram spesifikasi batch numbering

---

## 1. KONTEKS & LATAR BELAKANG

### Problem
Saat ini batch_code di-generate secara ad-hoc:
- **Dummy data** pakai format `BATCH-PMD1-{date}-{shift}` (tidak sesuai spesifikasi)
- **Worksheet form** pakai format `{FACTORY}-{YYYYMMDD}-{RAND4}` (tidak sesuai)
- **Side product** pakai format `SP-{factoryCode}-{date}-{wsId}-{code}` (tidak sesuai)
- **Tidak ada auto-generate** berdasarkan setting parameter yang sudah didefinisikan

### Tujuan
Menerapkan **sistem batch numbering otomatis** sesuai spesifikasi diagram:
- Kode batch ter-standarisasi dan konsisten
- Auto-generate berdasarkan parameter (Pabrik, Jenis, Varietas, Level, Tanggal, Nomor Urut)
- Reset nomor urut per hari
- Traceability batch input → batch output di worksheet

---

## 2. SPESIFIKASI BATCH NUMBERING (dari Diagram)

### 2.1 Setting Parameter — Batch Code Material

| Parameter     | Nilai           | Code  |
|---------------|-----------------|-------|
| **Factory**   | PMD 1           | P1    |
|               | PMD 2           | P2    |
| **Jenis**     | Padi            | PD    |
|               | Pecah Kulit     | PK    |
|               | Glosor          | GLS   |
|               | Beras           | BRS   |
| **Varietas**  | IR              | IR    |
|               | Muncul          | MCL   |
|               | Kebo            | KB    |
|               | Pandan Wangi    | PW    |
|               | Malaysia Race   | MR    |
|               | Ketan           | KTN   |
| **Level**     | Medium          | M     |
|               | Medium Super    | MS    |
|               | Premium         | P     |
|               | Premium Super   | PS    |

### 2.2 Format Batch Bahan Baku (Raw Material)
```
{Pabrik}-{Jenis}-{Varietas}-{DDMMYY}-{NomorUrut3digit}
```
**Contoh**: `P1-PD-IR-160226-001`
→ Padi IR, Masuk tanggal 16 February 2026, Batch ke-1

**Aturan**:
- Jika masuk 2, 3 dst di hari yang sama → nomor urut naik: `P1-PD-IR-160226-002`, `P1-PD-IR-160226-003`
- Jika beda hari → nomor urut reset dari 001: `P1-PD-IR-170226-001`

### 2.3 Format Batch Finish Good (Beras Jadi)
```
{Pabrik}-{Jenis}-{Varietas}-{Level}-{DDMMYY}-{NomorUrut3digit}
```
**Contoh**: `P1-BRS-IR-M-160226-001`

### 2.4 Aturan Sistem Worksheet
- Setiap proses harus menampilkan **batch input yang dipakai** + **HPP** + **qty** di form kerja
- Contoh: Proses 10 Ton beras butuh 2 batch padi:
  - **Batch Input**:
    - `P1-PD-IR-160226-001`, HPP 12.500, 5 Ton
    - `P1-PD-IR-160226-002`, HPP 14.500, 5 Ton
  - **Batch Output (Akhir)**:
    - `P1-BRS-IR-M-160226-001`, HPP 14.500, 5 Ton

### 2.5 Side Product Batch
Side products (Bekatul, Broken, Menir, Sekam, Reject) juga perlu batch code. Format yang disarankan:
```
{Pabrik}-{SideProductCode}-{Varietas}-{DDMMYY}-{NomorUrut3digit}
```
Contoh: `P1-DDK-IR-160226-001` (Dedak/Bekatul dari varietas IR)

---

## 3. ARSITEKTUR SAAT INI (Yang Perlu Dipahami)

### 3.1 Database Schema (Prisma)
| Model | Field | Keterangan |
|-------|-------|------------|
| `StockMovement` | `batch_code VARCHAR(50)` | Batch saat penerimaan bahan baku |
| `Worksheet` | `batch_code VARCHAR(50)` | Batch output produksi |
| `WorksheetInputBatch` | `batch_code VARCHAR(50)` | Batch input yang digunakan |
| `WorksheetSideProduct` | `batch_code VARCHAR(50)` | Batch side product |
| `QCGabah` | `batch_id VARCHAR(50)` | Batch ID untuk QC gabah |

### 3.2 Tabel Master Data yang Sudah Ada
- `Factory` — `code: 'PMD-1' | 'PMD-2'`
- `ProductType` — `code`, `category` (RAW_MATERIAL, INTERMEDIATE, FINISHED_RICE, SIDE_PRODUCT)
- `RiceVariety` — `code` (IR64, CIHERANG, dll)
- `RiceLevel` — `code` (MEDIUM, PREMIUM, dll)
- `ProductType.id_variety` → `RiceVariety`
- `ProductType.id_rice_level` → `RiceLevel`

### 3.3 File Kunci
- **Backend**: `src/services/worksheet.service.ts` — batch_code saat create worksheet
- **Backend**: `src/services/stock.service.ts` — batch_code saat transfer
- **Backend**: `src/services/dummy.service.ts` — batch_code dummy data
- **Backend**: `src/dto/worksheet.dto.ts` — DTO dengan batch_code
- **Frontend**: Form worksheet (batch input selection, batch output display)

---

## 4. RENCANA IMPLEMENTASI

### Phase 1: Batch Numbering Service (Backend)

#### Task 1.1 — Buat tabel `BatchCodeMapping` untuk mapping parameter → kode
```prisma
model BatchCodeMapping {
  id         Int      @id @default(autoincrement())
  param_type String   @db.VarChar(30)  // 'FACTORY' | 'JENIS' | 'VARIETAS' | 'LEVEL'
  param_key  String   @db.VarChar(50)  // misalnya 'PMD-1', 'IR64', 'MEDIUM'
  batch_code String   @db.VarChar(10)  // misalnya 'P1', 'IR', 'M'
  is_active  Boolean  @default(true)
  created_at DateTime @default(now())

  @@unique([param_type, param_key])
}
```

#### Task 1.2 — Buat tabel `BatchSequence` untuk nomor urut per hari
```prisma
model BatchSequence {
  id             Int      @id @default(autoincrement())
  sequence_key   String   @db.VarChar(100) // e.g. "P1-PD-IR-160226"
  sequence_date  DateTime @db.Date
  last_number    Int      @default(0)
  updated_at     DateTime @updatedAt

  @@unique([sequence_key, sequence_date])
}
```

#### Task 1.3 — Buat `src/services/batch-numbering.service.ts`
```typescript
export class BatchNumberingService {
  /**
   * Generate batch code untuk Bahan Baku
   * Format: {Pabrik}-{Jenis}-{Varietas}-{DDMMYY}-{NomorUrut}
   */
  static async generateRawMaterialBatch(
    factoryCode: string,     // 'PMD-1'
    productTypeId: number,   // ProductType.id (yang punya variety)
    date: Date               // Tanggal masuk
  ): Promise<string>

  /**
   * Generate batch code untuk Finish Good (Beras)
   * Format: {Pabrik}-{Jenis}-{Varietas}-{Level}-{DDMMYY}-{NomorUrut}
   */
  static async generateFinishedGoodBatch(
    factoryCode: string,
    productTypeId: number,   // ProductType.id (yang punya variety + level)
    date: Date
  ): Promise<string>

  /**
   * Generate batch code untuk Side Product
   * Format: {Pabrik}-{SideCode}-{Varietas}-{DDMMYY}-{NomorUrut}
   */
  static async generateSideProductBatch(
    factoryCode: string,
    sideProductCode: string, // 'DDK', 'MNR', 'SKM', dll
    varietyCode: string,     // Dari input variety
    date: Date
  ): Promise<string>

  // Internal: increment & get next sequence number
  private static async getNextSequence(
    sequenceKey: string,
    date: Date
  ): Promise<number>

  // Internal: map factory code → batch code (PMD-1 → P1)
  private static async getFactoryBatchCode(factoryCode: string): Promise<string>

  // Internal: resolve ProductType → jenis code, varietas code, level code
  private static async resolveProductCodes(productTypeId: number): Promise<{
    jenisCode: string;
    varietasCode: string;
    levelCode?: string;
  }>

  // Internal: format date → DDMMYY
  private static formatDate(date: Date): string
}
```

**Logika `resolveProductCodes`**:
- Ambil `ProductType` include `RiceVariety` dan `RiceLevel`
- Map `ProductType.category`:
  - `RAW_MATERIAL` + kode mengandung 'GKP'/'GKG' → Jenis = `PD` (Padi)
  - `INTERMEDIATE` + kode mengandung 'PK' → Jenis = `PK`
  - `INTERMEDIATE` + kode mengandung 'GLO' → Jenis = `GLS`
  - `FINISHED_RICE` → Jenis = `BRS`
  - `SIDE_PRODUCT` → map per kode (DDK, MNR, SKM, dll)
- Map `RiceVariety.code`:
  - `IR64` → `IR`, `CIHERANG` → bisa ditambah mapping nanti, `MUNCUL` → `MCL`, dll
- Map `RiceLevel.code`:
  - `MEDIUM` → `M`, `MEDIUM_SUPER` → `MS`, `PREMIUM` → `P`, `PREMIUM_SUPER` → `PS`

#### Task 1.4 — Seed data `BatchCodeMapping`
Insert mapping awal saat migration:
```sql
-- Factory
INSERT INTO "BatchCodeMapping" (param_type, param_key, batch_code) VALUES
('FACTORY', 'PMD-1', 'P1'),
('FACTORY', 'PMD-2', 'P2');

-- Jenis
INSERT INTO "BatchCodeMapping" (param_type, param_key, batch_code) VALUES
('JENIS', 'RAW_MATERIAL', 'PD'),
('JENIS', 'INTERMEDIATE_PK', 'PK'),
('JENIS', 'INTERMEDIATE_GLS', 'GLS'),
('JENIS', 'FINISHED_RICE', 'BRS');

-- Varietas
INSERT INTO "BatchCodeMapping" (param_type, param_key, batch_code) VALUES
('VARIETAS', 'IR64', 'IR'),
('VARIETAS', 'MUNCUL', 'MCL'),
('VARIETAS', 'KEBO', 'KB'),
('VARIETAS', 'PANDAN_WANGI', 'PW'),
('VARIETAS', 'MALAYSIA_RACE', 'MR'),
('VARIETAS', 'KETAN', 'KTN');

-- Level
INSERT INTO "BatchCodeMapping" (param_type, param_key, batch_code) VALUES
('LEVEL', 'MEDIUM', 'M'),
('LEVEL', 'MEDIUM_SUPER', 'MS'),
('LEVEL', 'PREMIUM', 'P'),
('LEVEL', 'PREMIUM_SUPER', 'PS');
```

### Phase 2: Integrasi ke Modul yang Ada

#### Task 2.1 — Integrasi ke Goods Receipt (Penerimaan Bahan Baku)
- Saat `GoodsReceipt` diproses → auto-generate batch code via `generateRawMaterialBatch()`
- Simpan di `StockMovement.batch_code`
- Replace logic yang sekarang (jika ada manual input)

#### Task 2.2 — Integrasi ke Worksheet (Produksi)
- Saat worksheet di-create:
  - **Batch Output**: auto-generate via `generateFinishedGoodBatch()` → simpan di `Worksheet.batch_code`
  - **Batch Side Product**: auto-generate via `generateSideProductBatch()` → simpan di `WorksheetSideProduct.batch_code`
  - **Batch Input**: tetap reference dari batch yang sudah ada di `WorksheetInputBatch.batch_code`
- Update `worksheet.service.ts` create & update logic

#### Task 2.3 — Integrasi ke Stock Transfer
- Saat transfer antar pabrik → batch_code ikut material yang ditransfer (tidak generate baru)
- Pastikan `stock.service.ts` meneruskan batch_code asli

#### Task 2.4 — Update Dummy Service
- Update `dummy.service.ts` agar menggunakan `BatchNumberingService` untuk generate batch codes
- Replace format lama `BATCH-PMD1-*` dan `BATCH-PMD2-*`

### Phase 3: Frontend — Tampilan Batch di Form Worksheet

#### Task 3.1 — Tampilkan batch code di form worksheet
- Batch output auto-generated (read-only, ditampilkan setelah submit)
- Batch input: tampilkan list batch yang dipilih + HPP + qty
- Side product batch: auto-generated per side product

#### Task 3.2 — Settings Page: Batch Code Mapping
- Halaman admin untuk CRUD `BatchCodeMapping`
- Agar parameter batch bisa ditambah tanpa deploy ulang (misalnya varietas baru)

### Phase 4: Migration & Data Existing

#### Task 4.1 — Prisma Migration
```bash
npx prisma migrate dev --name add_batch_numbering_system
```

#### Task 4.2 — Seed Script
- Jalankan seed untuk `BatchCodeMapping` default values
- Optional: migrate existing batch codes ke format baru (atau biarkan data lama)

---

## 5. URUTAN EKSEKUSI

```
Phase 1.1 → 1.2 → 1.4 (Schema + Seed)   ← Prisma migrate
Phase 1.3 (BatchNumberingService)          ← Core logic
Phase 2.1 (Goods Receipt integration)      ← Bahan baku masuk
Phase 2.2 (Worksheet integration)          ← Produksi
Phase 2.3 (Transfer integration)           ← Transfer
Phase 2.4 (Dummy data update)              ← Testing
Phase 3.1 (Frontend form display)          ← UI
Phase 3.2 (Settings page)                  ← Admin config
Phase 4.1-4.2 (Migration + Seed)           ← Deployment
```

---

## 6. TESTING CHECKLIST

- [ ] Generate batch bahan baku: `P1-PD-IR-160226-001` format benar
- [ ] Nomor urut naik di hari sama: `-002`, `-003`
- [ ] Nomor urut reset di hari baru: `-001`
- [ ] Generate batch finish good: `P1-BRS-IR-M-160226-001` format benar
- [ ] Generate batch side product: `P1-DDK-IR-160226-001` format benar
- [ ] Worksheet menampilkan batch input + HPP + qty
- [ ] Worksheet auto-generate batch output
- [ ] Transfer meneruskan batch_code asli
- [ ] Concurrent access: 2 receipt di waktu sama → sequence tetap unik (race condition handling)
- [ ] Dummy data menggunakan format baru

---

## 7. CATATAN PENTING

1. **Race Condition**: `getNextSequence()` harus atomic — gunakan Prisma `$transaction` dengan `upsert` + increment
2. **Backward Compatibility**: Data lama dengan format batch berbeda tetap valid, tidak perlu di-migrate
3. **Extensibility**: Mapping disimpan di DB (`BatchCodeMapping`) sehingga varietas/level baru bisa ditambah tanpa code change
4. **Side Products**: Varietas di side product diambil dari varietas input material worksheet-nya
