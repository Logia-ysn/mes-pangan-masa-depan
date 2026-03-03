# 📋 Audit Refactoring Worksheet — Post-Refactor Review

> **Tanggal**: 2 Maret 2026
> **Repo**: Logia-ysn/erp-pangan-masa-depan
> **Scope**: Modul Produksi — Worksheet

---

## 📊 Ringkasan Perubahan

### File Baru (10 file, 1,104 lines)

| File | Lines | Fungsi | Status |
|------|-------|--------|--------|
| `worksheet.constants.ts` (backend) | 66 | PROCESS_STEPS, shift/status config, workflow transitions | ✅ Solid |
| `worksheet.types.ts` (backend) | 142 | DTOs, HPPResult, WorksheetWithRelations, StockMovementParams | ✅ Solid |
| `hpp-calculator.service.ts` | 45 | HPP + rendemen calculation | ✅ Clean |
| `worksheet-stock.service.ts` | 241 | Stock IN/OUT + reversal | ✅ Good |
| `worksheet-workflow.service.ts` | 253 | Submit/Approve/Reject/Cancel state machine | ✅ Good |
| `worksheet.config.ts` (frontend) | 54 | shiftConfig, statusConfig, STATUS_FILTERS | ✅ Solid |
| `worksheet.types.ts` (frontend) | 170 | All frontend interfaces consolidated | ✅ Solid |
| `useHPPCalculation.ts` | 40 | HPP computed values hook | ✅ Clean |
| `useInputBatches.ts` | 52 | Batch add/remove hook | ✅ Clean |
| `useSideProducts.ts` | 41 | Auto-calc side products hook | ✅ Clean |

### File Lama (6 file) — Perbandingan

| File | Sebelum | Sesudah | Δ | Catatan |
|------|---------|---------|---|---------|
| `worksheet.service.ts` | 949 | 403 | **-546** ✅ | Workflow didelegasi ke module baru |
| `WorksheetForm.tsx` | 1,419 | 1,341 | -78 | Types/config di-import dari module baru |
| `Worksheets.tsx` | 433 | 383 | -50 | Types/config di-import dari module baru |
| `WorksheetDetail.tsx` | 686 | 686 | 0 | Belum disentuh |
| `worksheet.repository.ts` | 194 | 194 | 0 | Belum disentuh |
| `worksheet.dto.ts` | 221 | 221 | 0 | Belum disentuh (superseded) |

---

## ✅ Yang Sudah Benar

### 1. Backend Decomposition — Phase 2 Berhasil

Workflow delegation pattern di `worksheet.service.ts` sekarang bersih:

```typescript
// BEFORE (inline 200+ lines per method)
async submitWorksheet(id, userId) { ... 50 lines ... }
async approveWorksheet(id, approverId) { ... 100+ lines ... }

// AFTER (1-line delegation)
async submitWorksheet(id, userId) { return worksheetWorkflowService.submit(id, userId); }
async approveWorksheet(id, approverId) { return worksheetWorkflowService.approve(id, approverId); }
```

**Skor: 9/10** — Service turun dari 949 → 403 lines. Concerns terpisah dengan jelas.

### 2. HPP Calculator — Clean Extraction

Murni pure function, tidak ada side effects, mudah di-unit test. `calculateRendemen` juga dipindahkan ke sini. Backend service sekarang hanya memanggil `hppCalculator.calculateRendemen()`.

**Skor: 10/10**

### 3. Shared Constants & Config — Single Source of Truth

`PROCESS_STEPS`, `SHIFT_CONFIG`, `STATUS_CONFIG`, `WORKFLOW_TRANSITIONS`, `DELETABLE_STATUSES` semua terpusat. Frontend config juga terpisah di `worksheet.config.ts`.

**Skor: 9/10** (lihat catatan duplikasi backend/frontend di bawah)

### 4. Frontend Types Consolidation

Semua interface (`Factory`, `Machine`, `Employee`, `Stock`, `Worksheet`, `InputBatch`, `SideProduct`, dsb) sudah dipindahkan ke satu file `worksheet.types.ts`. `WorksheetForm.tsx` dan `Worksheets.tsx` sudah meng-import dari sini.

**Skor: 9/10**

### 5. Backward Compatibility Terjaga

Re-export pattern di `worksheet.service.ts` memastikan semua implementation files tetap bekerja tanpa perubahan:
```typescript
export type { InputBatchDTO, SideProductDTO, CreateWorksheetDTO, UpdateWorksheetDTO };
export { PROCESS_STEPS } from '../modules/production/worksheet/worksheet.constants';
```

**Skor: 10/10** — Zero breaking changes.

---

## ⚠️ Yang Perlu Diperbaiki

### 🔴 Issue 1: Frontend Hooks Dibuat Tapi Tidak Dipakai

**Severity: HIGH** — 3 hooks sudah dibuat tapi belum di-wire ke `WorksheetForm.tsx`:

```
useHPPCalculation.ts  ← TIDAK dipakai di WorksheetForm.tsx
useInputBatches.ts    ← TIDAK dipakai di WorksheetForm.tsx  
useSideProducts.ts    ← TIDAK dipakai di WorksheetForm.tsx
```

`WorksheetForm.tsx` masih menggunakan inline `useMemo` untuk HPP calculation (line 68-77) dan inline logic untuk batch management. **Hooks saat ini adalah dead code.**

**Fix**: Wire hooks ke `WorksheetForm.tsx`, ganti inline `useMemo` hppCalc, inline batch add/remove, dan inline side product auto-calc.

---

### 🔴 Issue 2: WorksheetForm.tsx Masih 1,341 Lines

Target refactor adalah ~200 lines per file. Saat ini hanya turun 78 baris (dari 1,419 → 1,341). Hooks dan UI components belum di-split:

- Inline `useMemo` HPP calculation (line 68-77) — harusnya pakai `useHPPCalculation`
- Inline batch add/remove logic — harusnya pakai `useInputBatches`
- Inline side product auto-calc — harusnya pakai `useSideProducts`
- 500+ lines of JSX belum dipecah ke komponen:
  - `InputBatchSection.tsx`
  - `SideProductSection.tsx`
  - `HPPSummary.tsx`
  - `MachineSelector.tsx`
  - `OperatorSelector.tsx`

**Fix**: Gunakan hooks yang sudah dibuat + extract JSX sections ke komponen terpisah.

---

### 🟡 Issue 3: `any` Masih Tersebar (16 lokasi)

| File | Count | Lokasi |
|------|-------|--------|
| `worksheet-stock.service.ts` | 7 | `tx: any` (4x), `Stock?: any`, `sp as any` (2x) |
| `worksheet-workflow.service.ts` | 1 | `worksheet as any` |
| `worksheet.service.ts` | 1 | `RiceVariety as any` |
| `useInputBatches.ts` | 3 | `prev: any`, `_: any` |
| `useSideProducts.ts` | 3 | `prev: any`, `updated[index] as any` |

**Paling kritis: `tx: any`** — Prisma transaction client punya type `Prisma.TransactionClient`. Ini bisa langsung diganti:

```typescript
// BEFORE
async processInputStockOut(tx: any, ...) 

// AFTER
import { Prisma } from '@prisma/client';
type TxClient = Prisma.TransactionClient;
async processInputStockOut(tx: TxClient, ...)
```

**Frontend hooks**: `setFormData: React.Dispatch<React.SetStateAction<any>>` harusnya menjadi `React.Dispatch<React.SetStateAction<WorksheetFormData>>`.

---

### 🟡 Issue 4: Dead Code Belum Dibersihkan

| File | Status | Alasan |
|------|--------|--------|
| `types/model/table/Worksheet.ts` | ☠️ Dead | TypeORM model, Prisma dipakai |
| `src/dto/worksheet.dto.ts` | ⚠️ Superseded | Masih di-import oleh `T_createWorksheet.ts` (1 file) |

`worksheet.dto.ts` (221 lines) sekarang redundant karena semua types sudah di `worksheet.types.ts`. Tapi `T_createWorksheet.ts` masih import `CreateWorksheetSchema` (class-validator) dari sini.

**Fix**: Migrate `T_createWorksheet.ts` ke import dari `worksheet.types.ts`, lalu hapus `worksheet.dto.ts`.

---

### 🟡 Issue 5: Duplikasi Constants Backend ↔ Frontend

`worksheet.constants.ts` (backend) dan `worksheet.config.ts` (frontend) mendefinisikan hal yang sama:
- `PROCESS_STEPS` — copy paste exact
- `SHIFT_CONFIG` / `shiftConfig` — copy paste exact
- `STATUS_CONFIG` / `statusConfig` — copy paste exact
- `SIDE_PRODUCT_AUTO_PERCENTAGE` — copy paste exact

**Fix jangka pendek**: Tambahkan comment `@sync-with` di kedua file agar developer tahu harus update keduanya.

**Fix jangka panjang**: Buat shared package atau serve config dari API endpoint.

---

### 🟡 Issue 6: `WorksheetDetail.tsx` dan `worksheet.repository.ts` Belum Disentuh

Keduanya belum di-refactor sama sekali. `WorksheetDetail.tsx` (686 lines) masih inline semua logic dan kemungkinan mendefinisikan interface lokal yang seharusnya pakai shared types.

---

## 📈 Scorecard

| Kriteria | Sebelum | Sesudah | Target | Status |
|----------|---------|---------|--------|--------|
| Backend largest file | 949 lines | 403 lines | <250 | 🟡 Progress |
| Frontend largest file | 1,419 lines | 1,341 lines | <200 | 🔴 Minimal |
| `any` count (worksheet module) | 15+ | 16 | 0 | 🔴 No change |
| Backend services | 1 God class | 4 focused | 4 | ✅ Done |
| Frontend hooks created | 0 | 3 | 5+ | 🟡 Created but unused |
| Frontend components extracted | 0 | 0 | 8+ | 🔴 Not started |
| Shared types | Scattered | Centralized | Centralized | ✅ Done |
| Shared configs | Duplicated | 2 files (FE+BE) | Single source | 🟡 Better |
| Dead code removed | 0 | 0 | 2 files | 🔴 Not started |
| Backward compat breaks | - | 0 | 0 | ✅ Perfect |

**Overall Progress: ~45%** — Backend decomposition solid, frontend decomposition belum dimulai.

---

## 🎯 Recommended Next Steps (Prioritized)

### Immediate (Phase 2 Completion)

1. **Wire hooks ke WorksheetForm.tsx** — ganti inline useMemo/logic dengan `useHPPCalculation`, `useInputBatches`, `useSideProducts`
2. **Extract JSX sections** — `InputBatchSection`, `SideProductSection`, `HPPSummary` ke komponen terpisah
3. **Fix `any` di new modules** — `tx: any` → `Prisma.TransactionClient`, `setFormData` typed

### Short-term (Phase 3)

4. **Migrate `T_createWorksheet.ts`** — ganti import dari dto ke `worksheet.types.ts`
5. **Delete dead files** — `types/model/table/Worksheet.ts`, lalu `src/dto/worksheet.dto.ts`
6. **Refactor `WorksheetDetail.tsx`** — import shared types, extract workflow action buttons

### Medium-term (Phase 5)

7. **Add `@sync-with` comments** atau shared config untuk backend/frontend constants
8. **Migrate inline styles → CSS classes** di semua worksheet components
9. **Add JSDoc** ke public methods di extracted services
