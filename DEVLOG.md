# Development Log

## 2026-03-07 — Scalable Production: Lini Produksi & Work Order (v2.28.0)

### Motivasi
Seiring berkembangnya skala bisnis, kapasitas produksi meningkat dan pabrik baru beroperasi. Sebelumnya, setiap Worksheet berdiri sendiri tanpa konsep "Lini Produksi" (grup mesin berurutan) atau "Work Order" (perintah kerja multi-tahap). Fitur ini menambahkan dua entitas baru tersebut agar sistem dapat bertumbuh secara scalable dan mudah dipantau kapabilitasnya.

### Fitur Baru
1. **Lini Produksi (Production Line)**:
   - Pengelompokan mesin-mesin dalam satu lini produksi (cth: Line 1 = Sortir → Husker → Polisher).
   - Penambahan skema tabel `ProductionLine`.
   - Modifikasi entitas `Machine` dan `Worksheet` untuk menambahkan referensi `id_production_line` serta urutan antrean `sequence_order`.
   - Modul Frontend terintegrasi di `/production-lines` dengan manajemen assign/remove mesin dalam lini terkait.

2. **Perintah Kerja (Work Order)**:
   - Surat Perintah Kerja (SPK) yang mengelompokkan Worksheet produksi menjadi beberapa tahapan proses.
   - Skema tabel `WorkOrder` yang dilengkapi enum Status dan Prioritas.
   - Entitas `Worksheet` dapat ditetapkan sebagai child dari sebuah `WorkOrder` berbasis urutan `step_number`.
   - Implementasi Event Bus System (`productionEventBus`) guna me-*listen* pada event perubahan status (status change) WorkSheet untuk auto-update progres Work Order.

### Keputusan Desain
1. **Backward Compatible**: Penambahan fitur `id_production_line` & `id_work_order` bersifat opsional (nullable). Data historis Worksheet *single-stage* sebelumnya tetap berjalan lancar.
2. **Event-driven Architecture**: Pengambilan pendekatan asinkron (EventBus) pada *update status* Worksheet ke WorkOrder untuk menghindari terbentuknya file God-Method.
## 2026-03-02 — Worksheet Module Refactoring (v2.27.0)

### Motivasi
File `worksheet.service.ts` telah tumbuh menjadi 952 baris "God Service" yang menangani CRUD, workflow state machine, HPP calculation, stock movements, dan batch numbering dalam satu file. Ini menyulitkan maintenance, testing, dan onboarding developer baru.

### Pendekatan: 5-Phase Refactoring

| Phase | Fokus | Risiko |
|-------|-------|--------|
| 1. Foundation | Shared types, constants, config | Zero (additive only) |
| 2. Backend Decomposition | Extract 3 focused services | Low (delegators) |
| 3. Backend Quality | Replace `any` → Prisma types | Low (type-only) |
| 4. Frontend Decomposition | Extract hooks, shared types | Low (import changes) |
| 5. Cleanup | Remove deprecated dead code | Medium (functional removal) |

### File Baru yang Dibuat

**Backend Modules** (`src/modules/production/worksheet/`):
- `worksheet.constants.ts` — PROCESS_STEPS, SHIFT_CONFIG, STATUS_CONFIG, WORKFLOW_TRANSITIONS
- `worksheet.types.ts` — InputBatchDTO, SideProductDTO, CreateWorksheetDTO, HPP types
- `hpp/hpp-calculator.service.ts` — HPP formula + rendemen calculation
- `stock/worksheet-stock.service.ts` — Stock IN/OUT movements + reversals
- `workflow/worksheet-workflow.service.ts` — Submit/Approve/Reject/Cancel state machine

**Frontend Features** (`frontend/src/features/production/worksheet/`):
- `types/worksheet.types.ts` — Unified frontend interfaces (Worksheet, Factory, Machine, etc.)
- `config/worksheet.config.ts` — Shared UI config (shiftConfig, statusConfig, STATUS_FILTERS)
- `hooks/useHPPCalculation.ts` — Reactive HPP computation hook
- `hooks/useInputBatches.ts` — Input batch add/remove management hook
- `hooks/useSideProducts.ts` — Auto-calculation side products hook

### Hasil Akhir

```
worksheet.service.ts:  952 → 403 baris  (−57.7%)
WorksheetForm.tsx:   1,420 → 1,341 baris  (−79 baris)
Worksheets.tsx:        436 → 383 baris  (−53 baris)
```

### Keputusan Desain
1. **Re-export pattern** — DTOs dan PROCESS_STEPS di `worksheet.service.ts` di-replace dengan `export type` dan `export` re-exports dari shared modules. Ini mempertahankan backward compatibility bagi consumer yang sudah import dari service.
2. **UncheckedCreateInput vs CreateInput** — Prisma membedakan antara relation-based (`CreateInput`) dan raw ID-based (`UncheckedCreateInput`). Service ini menggunakan raw IDs, sehingga `UncheckedCreateInput` yang tepat.
3. **Prisma.JsonNull** — `null` literal tidak valid untuk nullable JSON column di Prisma. Harus menggunakan `Prisma.JsonNull` sebagai sentinel value.
4. **Frontend standalone config** — Frontend tidak bisa import dari `src/modules/` (different build system), sehingga config dibuatkan standalone dengan komentar sinkronisasi.

### Git Commits
1. `6f41d81` — Phase 1: shared constants, types, config
2. `03cbbfe` — Phase 2: decompose God Service
3. `3440c01` — Phase 3: replace `any` → Prisma types
4. `105413d` — Phase 4: frontend decomposition
5. `e21aa58` — Phase 5: cleanup dead code
