# 🔧 Refactoring Plan: Modul Produksi — Worksheet

> **Target**: Scalable, Reliable, Easy to Maintain
> **Scope**: Backend (Service, Repository, DTO, Implementation) + Frontend (Form, List, Detail)
> **Total Lines Saat Ini**: ~3,900 lines across 11+ files

---

## 📊 Audit Kondisi Saat Ini

### File Inventory

| File | Lines | Rating | Masalah Utama |
|------|-------|--------|---------------|
| `worksheet.service.ts` | 949 | 🔴 Critical | God Class — CRUD + Workflow + Stock + HPP + Audit |
| `WorksheetForm.tsx` | 1,419 | 🔴 Critical | Mega Component — fetch + state + UI + calculation |
| `WorksheetDetail.tsx` | 686 | 🟡 Warning | Cukup besar, perlu split |
| `Worksheets.tsx` | 433 | 🟢 OK | Masih manageable |
| `worksheet.repository.ts` | 194 | 🟡 Warning | `any` types, inline filter building |
| `worksheet.dto.ts` | 221 | 🟡 Warning | Duplikasi interface + class schema |
| Implementation files (11) | 466 | 🟡 Warning | Thin wrappers, some logic leaking |

### Masalah Yang Teridentifikasi

#### 🔴 Backend — God Service (SRP Violation)

```
worksheet.service.ts (949 lines) menangani:
├── CRUD Operations (create, update, delete, get)
├── Workflow State Machine (submit, approve, reject, cancel)
├── Stock Movement Logic (IN/OUT/reversal)
├── HPP Calculation (raw material + production - side product)
├── Batch Code Generation (via BatchNumberingService)
├── Audit Logging (setiap operasi)
├── Side Product Management (batch code, auto-calc)
└── Input Batch Management (stock validation, cost calc)
```

**Impact**: Satu perubahan di HPP calculation bisa break workflow approval.

#### 🔴 Frontend — Mega Component

```
WorksheetForm.tsx (1,419 lines) berisi:
├── 8+ useState declarations
├── 5+ useEffect hooks
├── 4+ useMemo calculations
├── Reference data fetching (factories, machines, employees, stocks, processes)
├── Form state management
├── HPP calculation logic (DUPLIKASI dari backend!)
├── Input batch modal + add/remove logic
├── Side product auto-calculation
├── Operator management + add new operator
├── Form submission + validation
└── 500+ lines of JSX (inline styles)
```

**Impact**: Menambah satu field form = harus navigasi 1400+ baris.

#### 🟡 Type Safety Issues

```typescript
// worksheet.service.ts
private mapDtoToWorksheetData(dto: CreateWorksheetDTO): any  // ← returns any
async cancelWorksheet(id: number, userId: number, reason?: string) {
    return await prisma.$transaction(async (tx) => {  // tx is any
        ...
    });
}

// worksheet.dto.ts
input_batches?: any[];  // ← not typed in interface
```

#### 🟡 Duplikasi & Inconsistency

1. **`PROCESS_STEPS`** didefinisikan di `worksheet.service.ts` DAN `worksheet.dto.ts`
2. **`Worksheet` interface** didefinisikan di `Worksheets.tsx` (frontend) — berbeda dari Prisma type
3. **HPP calculation** ada di service (server-side) DAN di `WorksheetForm.tsx` (client-side)
4. **`shiftConfig`** di-copy paste di `WorksheetForm.tsx` dan `Worksheets.tsx`
5. **`InputBatchDTO` / `SideProductDTO`** ada sebagai interface DAN class schema

#### 🟡 Dead Code & Legacy

- `types/model/table/Worksheet.ts` — TypeORM model (not used, Prisma is active)
- `handleInputBatches()` method — seems unused (superseded by inline logic in create)
- `updateStockFromProductionTransactional()` — fallback that may never execute
- `input_batch_id`, `input_category_code` in DTO — legacy fields

---

## 🏗️ Arsitektur Target

### Prinsip

| Prinsip | Penjelasan |
|---------|------------|
| **Single Responsibility** | 1 class/hook = 1 job |
| **Domain-Driven** | Group by domain (worksheet, stock, workflow) bukan by technical layer |
| **Type Safety** | Zero `any`, semua typed dari Prisma |
| **Testable** | Setiap service bisa di-unit test tanpa DB |
| **DRY** | Shared types, shared configs, shared hooks |

### Backend — Proposed Structure

```
src/
├── modules/
│   └── production/
│       └── worksheet/
│           ├── worksheet.controller.ts      # HTTP handling (thin)
│           ├── worksheet.service.ts         # CRUD only (~150 lines)
│           ├── worksheet.repository.ts      # Data access (~200 lines)
│           ├── worksheet.types.ts           # All types/interfaces
│           ├── worksheet.validator.ts       # Zod schemas + validation
│           ├── worksheet.constants.ts       # PROCESS_STEPS, shifts, etc
│           ├── workflow/
│           │   ├── worksheet-workflow.service.ts   # State machine (~200 lines)
│           │   └── worksheet-workflow.types.ts     # Workflow types
│           ├── stock/
│           │   ├── worksheet-stock.service.ts      # Stock IN/OUT (~200 lines)
│           │   └── worksheet-stock.types.ts
│           └── hpp/
│               └── hpp-calculator.service.ts       # HPP logic (~80 lines)
```

### Frontend — Proposed Structure

```
frontend/src/
├── features/
│   └── production/
│       └── worksheet/
│           ├── types/
│           │   └── worksheet.types.ts         # Shared types
│           ├── hooks/
│           │   ├── useWorksheetList.ts         # List fetch + filters
│           │   ├── useWorksheetForm.ts         # Form state + submission
│           │   ├── useWorksheetDetail.ts       # Detail fetch + actions
│           │   ├── useInputBatches.ts          # Batch management
│           │   ├── useSideProducts.ts          # Side product calc
│           │   └── useHPPCalculation.ts        # HPP computed values
│           ├── components/
│           │   ├── WorksheetTable.tsx           # Table component
│           │   ├── WorksheetFilters.tsx         # Filter bar
│           │   ├── WorksheetStatsBar.tsx        # Summary cards
│           │   ├── InputBatchSection.tsx        # Input batch form section
│           │   ├── SideProductSection.tsx       # Side products form section
│           │   ├── HPPSummary.tsx               # HPP calculation display
│           │   ├── WorkflowActions.tsx          # Submit/Approve/Reject buttons
│           │   └── WorksheetStatusBadge.tsx     # Status badge
│           ├── config/
│           │   └── worksheet.config.ts          # shiftConfig, statusConfig
│           └── pages/
│               ├── WorksheetListPage.tsx        # Thin page wrapper (~50 lines)
│               ├── WorksheetFormPage.tsx         # Thin page wrapper (~80 lines)
│               └── WorksheetDetailPage.tsx       # Thin page wrapper (~60 lines)
```

---

## 📋 Execution Plan — 5 Phases

### Phase 1: Foundation & Types (Zero Risk)
> **Goal**: Buat shared types + constants tanpa mengubah logic existing

**Tasks:**
1. Buat `worksheet.constants.ts` — pindahkan `PROCESS_STEPS`, `shiftConfig`, `statusConfig`
2. Buat `worksheet.types.ts` (backend) — proper types menggantikan `any`
3. Buat `worksheet.types.ts` (frontend) — single source of truth untuk interfaces
4. Hapus `types/model/table/Worksheet.ts` (TypeORM dead code)
5. Identify & mark dead code (jangan hapus dulu, tandai dengan `@deprecated`)

**Deliverables:**
- [ ] `src/modules/production/worksheet/worksheet.constants.ts`
- [ ] `src/modules/production/worksheet/worksheet.types.ts`
- [ ] `frontend/src/features/production/worksheet/types/worksheet.types.ts`
- [ ] `frontend/src/features/production/worksheet/config/worksheet.config.ts`

**Lines affected**: ~0 (additive only)
**Risk**: ⚪ None

---

### Phase 2: Backend Decomposition (Medium Risk)
> **Goal**: Pecah God Service menjadi focused services

**Step 2a: Extract HPP Calculator**
```typescript
// hpp-calculator.service.ts (~80 lines)
class HPPCalculator {
  calculate(params: HPPCalculationInput): HPPResult {
    const rawMaterialCost = params.inputBatches.reduce(...)
    const sideProductRevenue = params.sideProducts.reduce(...)
    const hpp = rawMaterialCost + params.productionCost - sideProductRevenue
    return { rawMaterialCost, sideProductRevenue, hpp, hppPerKg }
  }
}
```

**Step 2b: Extract Stock Movement Service**
```typescript
// worksheet-stock.service.ts (~200 lines)
class WorksheetStockService {
  async processInputStockOut(tx, worksheet, inputBatches, userId) { ... }
  async processOutputStockIn(tx, worksheet, sideProducts, userId) { ... }
  async reverseAllMovements(tx, worksheetId, userId) { ... }
  private async createMovement(tx, params: StockMovementParams) { ... }
}
```

**Step 2c: Extract Workflow Service**
```typescript
// worksheet-workflow.service.ts (~200 lines)
class WorksheetWorkflowService {
  async submit(id, userId): Promise<Worksheet> { ... }
  async approve(id, approverId): Promise<Worksheet> { ... }
  async reject(id, rejectorId, reason): Promise<Worksheet> { ... }
  async cancel(id, userId, reason?): Promise<Worksheet> { ... }
  private validateTransition(current: Status, target: Status) { ... }
}
```

**Step 2d: Slim down `worksheet.service.ts`**
```typescript
// worksheet.service.ts (~150 lines) — CRUD only
class WorksheetService {
  constructor(
    private stockService: WorksheetStockService,
    private workflowService: WorksheetWorkflowService,
    private hppCalculator: HPPCalculator
  ) {}

  async create(dto) { ... }    // Just create DRAFT
  async update(dto) { ... }    // Just update data
  async delete(id) { ... }     // Just delete
  async getById(id) { ... }
  async getList(params) { ... }
}
```

**Deliverables:**
- [ ] `hpp-calculator.service.ts`
- [ ] `worksheet-stock.service.ts`
- [ ] `worksheet-workflow.service.ts`
- [ ] Slimmed `worksheet.service.ts`
- [ ] Unit tests untuk setiap service baru

**Lines**: 949 → 4 files × ~150-200 avg = masih ~700 total, tapi **separated concerns**
**Risk**: 🟡 Medium — harus pastikan transaction integrity

---

### Phase 3: Backend Quality & Validation (Low Risk)
> **Goal**: Type safety + proper validation

**Tasks:**
1. Ganti semua `any` return types dengan proper Prisma types
2. Migrate dari class-validator ke **Zod schemas** (lebih ringan, better DX)
3. Buat `worksheet.validator.ts` dengan Zod:
```typescript
const createWorksheetSchema = z.object({
  id_factory: z.number().int().positive(),
  worksheet_date: z.string().date(),
  shift: z.nativeEnum(Worksheet_shift_enum),
  input_batches: z.array(inputBatchSchema).min(1),
  ...
});
```
4. Hapus duplikasi DTO — satu `worksheet.types.ts` sebagai single source
5. Add proper error types (bukan generic Error)

**Risk**: 🟢 Low

---

### Phase 4: Frontend Decomposition (Medium Risk)
> **Goal**: Pecah 1,419-line mega component

**Step 4a: Extract Custom Hooks**
```typescript
// useWorksheetForm.ts — manages form state & submission
// useInputBatches.ts — input batch add/remove/edit
// useSideProducts.ts — auto-calc side products
// useHPPCalculation.ts — computed HPP values
// useReferenceData.ts — fetch factories, machines, stocks
```

**Step 4b: Extract UI Components**
```typescript
// InputBatchSection.tsx — batch table + add modal
// SideProductSection.tsx — side products table
// HPPSummary.tsx — HPP calculation card
// ProcessStepSelector.tsx — process step checkboxes
// MachineSelector.tsx — machine multi-select
// OperatorSelector.tsx — operator multi-select
```

**Step 4c: Compose in Page**
```tsx
// WorksheetFormPage.tsx (~80 lines)
const WorksheetFormPage = () => {
  const form = useWorksheetForm();
  const batches = useInputBatches(form.selectedFactory);
  const sideProducts = useSideProducts(form.berasOutput);
  const hpp = useHPPCalculation(batches, sideProducts, form.productionCost);

  return (
    <div className="page-content">
      <BasicInfoSection form={form} />
      <InputBatchSection batches={batches} />
      <OutputSection form={form} />
      <SideProductSection products={sideProducts} />
      <HPPSummary hpp={hpp} />
      <FormActions onSubmit={form.handleSubmit} />
    </div>
  );
};
```

**Risk**: 🟡 Medium — banyak component interactions

---

### Phase 5: Cleanup & Polish (Low Risk)
> **Goal**: Remove dead code, add documentation

**Tasks:**
1. Hapus `types/model/table/Worksheet.ts` (TypeORM legacy)
2. Hapus `@deprecated` marked code
3. Hapus field legacy (`input_batch_id`, `input_category_code` dari DTO)
4. Migrate inline styles → CSS classes / design tokens
5. Add JSDoc documentation ke setiap public method
6. Add error boundaries di frontend components
7. Review & optimize Prisma queries (N+1 check)

**Risk**: 🟢 Low

---

## 🎯 Priority Matrix

```
                    HIGH IMPACT
                        │
    Phase 2 (Backend    │    Phase 4 (Frontend
    Decomposition)      │    Decomposition)
                        │
  ──────────────────────┼──────────────────────
                        │
    Phase 1 (Types)     │    Phase 5 (Cleanup)
    Phase 3 (Validation)│
                        │
                    LOW IMPACT

         LOW EFFORT ←───┼───→ HIGH EFFORT
```

**Recommended Order**: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5

---

## ⚠️ Migration Rules

1. **Tidak boleh break existing API** — semua endpoint harus tetap sama
2. **Satu phase selesai = commit** — jangan campur phase dalam satu PR
3. **Test dulu di local** sebelum merge — khususnya workflow approval + stock movement
4. **Feature flag** kalau perlu — bisa fallback ke old code
5. **Database schema TIDAK berubah** — ini murni refactor code, bukan restructure data

---

## 📈 Expected Results

| Metric | Sebelum | Sesudah |
|--------|---------|---------|
| Largest file | 1,419 lines | ~200 lines |
| `any` usage in worksheet module | 15+ | 0 |
| Backend service files | 1 (God) | 4 (focused) |
| Frontend components | 3 (mega) | 12+ (composable) |
| Unit testable methods | ~20% | ~90% |
| Time to add new field | ~30 min (find across 1400 lines) | ~5 min (specific hook/component) |
| Time to change HPP logic | ~15 min (find in 949-line service) | ~3 min (open hpp-calculator) |

---

## 🚀 Mulai Dari Mana?

**Rekomendasi: Mulai Phase 1** karena:
- Zero risk (additive only, tidak ubah existing code)
- Fondasi untuk semua phase selanjutnya
- Bisa dikerjakan dalam 1 session
- Langsung terlihat hasilnya (cleaner imports, no duplication)

**Siap mulai Phase 1?**
