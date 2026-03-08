# Plan Scalable: Production Line & Work Order

## Context

Bisnis selalu berkembang — kapasitas naik, mesin bertambah, pabrik baru dibuka. Saat ini setiap Worksheet berdiri sendiri tanpa konsep "lini produksi" (grup mesin berurutan) maupun "work order" (perintah kerja multi-tahap). Plan ini menambahkan dua konsep baru agar sistem bisa scale seiring pertumbuhan bisnis, ditambah event system sederhana sebagai fondasi decoupling antar modul.

**Scope**: 51 file baru + 17 file dimodifikasi, dibagi dalam 3 fase.

**Backward Compatible**: Semua field baru nullable/optional — worksheet dan mesin existing tetap jalan tanpa perubahan.

---

## Referensi Pattern Existing

Sebelum mulai, pahami pattern yang **WAJIB** diikuti persis:

### NAIV API Type Pattern
Lihat: `types/api/T_createMachine.ts`
```typescript
import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { Machine } from '../model/table/Machine'

export class T_createMachine_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createMachine_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  // ... more fields
}

export type T_createMachine = (request: {
  headers: T_createMachine_headers
  body: T_createMachine_body
}, response: Response) => Promise<Machine>;

export const method = 'post';
export const url_path = '/machines';
export const alias = 'T_createMachine';
export const is_streaming = false;
```

### Implementation Pattern
Lihat: `implementation/T_createMachine.ts`
```typescript
import { T_createMachine } from "../types/api/T_createMachine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { machineRepository } from "../src/repositories/machine.repository";

export const t_createMachine: T_createMachine = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');
  const { id_factory, code, name, ... } = req.body as any;
  // validate, then create
  return await machineRepository.create({ ... });
});
```

### Repository Pattern
Lihat: `src/repositories/machine.repository.ts`
```typescript
import { BaseRepository } from './base.repository';
import { Machine, Machine_status_enum } from '@prisma/client';

export class MachineRepository extends BaseRepository<Machine> {
    protected modelName = 'Machine';
    async findWithFilters(params: { limit?, offset?, id_factory?, status? }) {
        const where: any = {};
        // build where clause
        const [data, total] = await Promise.all([
            this.model.findMany({ where, take, skip, orderBy, include }),
            this.model.count({ where })
        ]);
        return { data, total };
    }
}
export const machineRepository = new MachineRepository();
```

### Model Table Stub Pattern
Lihat: `types/model/table/Machine.ts` — Class dengan TypeORM decorators (legacy, dipakai oleh NAIV types).

### Service Pattern
Lihat: `src/services/audit.service.ts` — Class singleton, export `const xxxService = new XxxService()`. Method terima optional `tx?: Prisma.TransactionClient`.

### Frontend API Pattern
Lihat: `frontend/src/services/api.ts`
```typescript
export const machineApi = {
    getAll: (params?: Record<string, any>) => api.get('/machines', { params }),
    getById: (id: number) => api.get(`/machines/${id}`),
    create: (data: Record<string, any>) => api.post('/machines', data),
    update: (id: number, data: Record<string, any>) => api.put(`/machines/${id}`, data),
    delete: (id: number) => api.delete(`/machines/${id}`),
};
```

---

## FASE 1: Production Line (Lini Produksi)

**Konsep**: Production Line mengelompokkan mesin-mesin yang bekerja berurutan dalam satu lini (contoh: Line 1 = Sortir → Husker → Polisher). Ini memungkinkan tracking OEE per lini, maintenance scheduling per lini, dan capacity planning.

### Step 1.1 — Prisma Schema + Migration

**File**: `prisma/schema.prisma`

#### A. Tambah model `ProductionLine` (taruh setelah model `Machine`):

```prisma
model ProductionLine {
  id                Int         @id @default(autoincrement())
  id_factory        Int
  code              String      @unique @db.VarChar(30)
  name              String      @db.VarChar(200)
  description       String?
  is_active         Boolean     @default(true)
  capacity_per_hour Decimal?    @db.Decimal(10, 2)
  created_at        DateTime    @default(now()) @db.Timestamp(6)
  updated_at        DateTime    @updatedAt @db.Timestamp(6)
  Factory           Factory     @relation(fields: [id_factory], references: [id], onDelete: NoAction, onUpdate: NoAction)
  Machine           Machine[]
  Worksheet         Worksheet[]

  @@index([id_factory])
  @@index([code])
}
```

#### B. Modifikasi model `Machine` — tambah field sebelum `Factory` relation:

```prisma
  id_production_line  Int?
  sequence_order      Int?              @default(0)
  ProductionLine      ProductionLine?   @relation(fields: [id_production_line], references: [id], onDelete: SetNull, onUpdate: NoAction)
```

Dan tambah index:
```prisma
  @@index([id_production_line])
```

#### C. Modifikasi model `Worksheet` — tambah field (taruh setelah `id_operators`):

```prisma
  id_production_line  Int?
  ProductionLine      ProductionLine?   @relation(fields: [id_production_line], references: [id], onDelete: SetNull, onUpdate: NoAction)
```

#### D. Modifikasi model `Factory` — tambah relasi (setelah `Machine Machine[]`):

```prisma
  ProductionLine      ProductionLine[]
```

#### E. Jalankan migration:

```bash
npx prisma migrate dev --name add_production_line
```

### Step 1.2 — Model Table Stub

**File baru**: `types/model/table/ProductionLine.ts`

```typescript
import { Column, Entity, PrimaryGeneratedColumn, BaseEntity, ManyToOne, JoinColumn } from "typeorm";
import { Factory } from '../../model/table/Factory'

@Entity('ProductionLine')
export class ProductionLine extends BaseEntity {
  @Column({
    type: 'bigint',
    nullable: false,
  })
  @PrimaryGeneratedColumn('increment')
  id!: number;
  @ManyToOne(() => Factory, x => x.id, { nullable: false })
  @JoinColumn({ name: 'id_factory' })
  otm_id_factory?: Factory;
  @Column({
    name: 'id_factory',
    type: 'bigint',
    nullable: false,
  })
  id_factory!: number;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 30,
  })
  code!: string;
  @Column({
    type: 'varchar',
    nullable: false,
    length: 200,
  })
  name!: string;
  @Column({
    type: 'varchar',
    nullable: true,
  })
  description?: string;
  @Column({
    type: 'boolean',
    nullable: false,
    default: true,
  })
  is_active!: boolean;
  @Column({
    type: 'decimal',
    nullable: true,
    precision: 10,
    scale: 2,
  })
  capacity_per_hour?: number;
}
```

### Step 1.3 — Repository

**File baru**: `src/repositories/production-line.repository.ts`

```typescript
import { BaseRepository } from './base.repository';
import { ProductionLine } from '@prisma/client';

export class ProductionLineRepository extends BaseRepository<ProductionLine> {
    protected modelName = 'ProductionLine';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.is_active !== undefined) where.is_active = params.is_active;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 50,
                skip: params.offset || 0,
                orderBy: { id: 'asc' },
                include: {
                    Factory: true,
                    Machine: {
                        orderBy: { sequence_order: 'asc' },
                        include: { Factory: true }
                    },
                    _count: { select: { Machine: true, Worksheet: true } }
                }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }

    async findByIdWithMachines(id: number): Promise<ProductionLine | null> {
        return await this.model.findUnique({
            where: { id },
            include: {
                Factory: true,
                Machine: {
                    orderBy: { sequence_order: 'asc' },
                    include: { Factory: true }
                },
                _count: { select: { Machine: true, Worksheet: true } }
            }
        });
    }
}

export const productionLineRepository = new ProductionLineRepository();
```

**Update** `src/repositories/index.ts` — tambah:
```typescript
export * from './production-line.repository';
```

### Step 1.4 — Service

**File baru**: `src/services/production-line.service.ts`

```typescript
import { ProductionLine } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { Prisma } from '@prisma/client';
import { auditService } from './audit.service';
import { productionLineRepository } from '../repositories/production-line.repository';

class ProductionLineService {
    async create(data: {
        id_factory: number;
        code: string;
        name: string;
        description?: string;
        capacity_per_hour?: number;
    }, userId: number): Promise<ProductionLine> {
        return await prisma.$transaction(async (tx) => {
            // Validate unique code
            const existing = await tx.productionLine.findUnique({ where: { code: data.code } });
            if (existing) throw new Error('Production line code already exists');

            const line = await tx.productionLine.create({
                data: {
                    id_factory: Number(data.id_factory),
                    code: data.code,
                    name: data.name,
                    description: data.description || null,
                    capacity_per_hour: data.capacity_per_hour ? Number(data.capacity_per_hour) : null,
                }
            });

            await auditService.log({
                userId,
                action: 'CREATE',
                tableName: 'ProductionLine',
                recordId: line.id,
                newValue: line,
            }, tx);

            return line;
        });
    }

    async update(id: number, data: {
        code?: string;
        name?: string;
        description?: string;
        is_active?: boolean;
        capacity_per_hour?: number;
    }, userId: number): Promise<ProductionLine> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.productionLine.findUnique({ where: { id } });
            if (!existing) throw new Error('Production line not found');

            // Check unique code if changing
            if (data.code && data.code !== existing.code) {
                const dup = await tx.productionLine.findUnique({ where: { code: data.code } });
                if (dup) throw new Error('Production line code already exists');
            }

            const updateData: any = {};
            if (data.code !== undefined) updateData.code = data.code;
            if (data.name !== undefined) updateData.name = data.name;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.is_active !== undefined) updateData.is_active = data.is_active;
            if (data.capacity_per_hour !== undefined) updateData.capacity_per_hour = data.capacity_per_hour ? Number(data.capacity_per_hour) : null;

            const updated = await tx.productionLine.update({ where: { id }, data: updateData });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'ProductionLine',
                recordId: id,
                oldValue: existing,
                newValue: updated,
            }, tx);

            return updated;
        });
    }

    async delete(id: number, userId: number): Promise<boolean> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.productionLine.findUnique({
                where: { id },
                include: { _count: { select: { Worksheet: true } } }
            });
            if (!existing) throw new Error('Production line not found');

            // Unlink machines first
            await tx.machine.updateMany({
                where: { id_production_line: id },
                data: { id_production_line: null, sequence_order: null }
            });

            await tx.productionLine.delete({ where: { id } });

            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'ProductionLine',
                recordId: id,
                oldValue: existing,
            }, tx);

            return true;
        });
    }

    async assignMachine(lineId: number, machineId: number, sequenceOrder: number, userId: number): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const line = await tx.productionLine.findUnique({ where: { id: lineId } });
            if (!line) throw new Error('Production line not found');

            const machine = await tx.machine.findUnique({ where: { id: machineId } });
            if (!machine) throw new Error('Machine not found');

            if (machine.id_factory !== line.id_factory) {
                throw new Error('Machine and production line must be in the same factory');
            }

            await tx.machine.update({
                where: { id: machineId },
                data: { id_production_line: lineId, sequence_order: sequenceOrder }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'Machine',
                recordId: machineId,
                oldValue: { id_production_line: machine.id_production_line, sequence_order: machine.sequence_order },
                newValue: { id_production_line: lineId, sequence_order: sequenceOrder },
            }, tx);
        });
    }

    async removeMachine(lineId: number, machineId: number, userId: number): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const machine = await tx.machine.findUnique({ where: { id: machineId } });
            if (!machine) throw new Error('Machine not found');
            if (machine.id_production_line !== lineId) {
                throw new Error('Machine is not assigned to this production line');
            }

            await tx.machine.update({
                where: { id: machineId },
                data: { id_production_line: null, sequence_order: null }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'Machine',
                recordId: machineId,
                oldValue: { id_production_line: lineId, sequence_order: machine.sequence_order },
                newValue: { id_production_line: null, sequence_order: null },
            }, tx);
        });
    }
}

export const productionLineService = new ProductionLineService();
```

### Step 1.5 — API Type Files (7 file)

Buat 7 file di `types/api/`. Setiap file WAJIB ikuti pattern persis dari `T_createMachine.ts`.

**File 1**: `types/api/T_createProductionLine.ts`
- Import `ProductionLine` dari `'../model/table/ProductionLine'`
- `T_createProductionLine_headers`: authorization (IsNotEmpty, IsString)
- `T_createProductionLine_body`: id_factory (required, number), code (required, string), name (required, string), description (optional, string), capacity_per_hour (optional, number — pakai Transform parseFloat)
- Return type: `Promise<ProductionLine>`
- `method = 'post'`, `url_path = '/production-lines'`, `alias = 'T_createProductionLine'`

**File 2**: `types/api/T_getProductionLines.ts`
- `T_getProductionLines_query`: limit (optional, number), offset (optional, number), id_factory (optional, number), is_active (optional, string — "true"/"false" as query param)
- Return type: `Promise<{ data: ProductionLine[], total: number }>`  — buat `ReturnType_0` class seperti di `T_getMachines.ts`
- `method = 'get'`, `url_path = '/production-lines'`

**File 3**: `types/api/T_getProductionLineById.ts`
- `T_getProductionLineById_path`: id (required, number)
- Return type: `Promise<ProductionLine>`
- `method = 'get'`, `url_path = '/production-lines/:id'`

**File 4**: `types/api/T_updateProductionLine.ts`
- `T_updateProductionLine_path`: id (required, number)
- `T_updateProductionLine_body`: code (opt, string), name (opt, string), description (opt, string), is_active (opt, boolean), capacity_per_hour (opt, number)
- `method = 'put'`, `url_path = '/production-lines/:id'`

**File 5**: `types/api/T_deleteProductionLine.ts`
- `T_deleteProductionLine_path`: id (required, number)
- `method = 'delete'`, `url_path = '/production-lines/:id'`

**File 6**: `types/api/T_assignMachineToLine.ts`
- `T_assignMachineToLine_path`: id (required, number)
- `T_assignMachineToLine_body`: id_machine (required, number), sequence_order (required, number)
- `method = 'post'`, `url_path = '/production-lines/:id/machines'`

**File 7**: `types/api/T_removeMachineFromLine.ts`
- `T_removeMachineFromLine_path`: id (required, number), machineId (required, number)
- `method = 'delete'`, `url_path = '/production-lines/:id/machines/:machineId'`

### Step 1.6 — Implementation Files (7 file)

Buat 7 file di `implementation/`. Setiap file WAJIB ikuti pattern persis dari `implementation/T_createMachine.ts`.

**File 1**: `implementation/T_createProductionLine.ts`
```typescript
import { T_createProductionLine } from "../types/api/T_createProductionLine";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productionLineService } from "../src/services/production-line.service";

export const t_createProductionLine: T_createProductionLine = apiWrapper(async (req, res) => {
  const user = await requireAuth(req, 'SUPERVISOR');
  const { id_factory, code, name, description, capacity_per_hour } = req.body as any;
  return await productionLineService.create(
    { id_factory, code, name, description, capacity_per_hour },
    user.id
  );
});
```

**File 2**: `implementation/T_getProductionLines.ts` — `requireAuth(req, 'OPERATOR')`, panggil `productionLineRepository.findWithFilters()`

**File 3**: `implementation/T_getProductionLineById.ts` — `requireAuth(req, 'OPERATOR')`, panggil `productionLineRepository.findByIdWithMachines(req.path.id)`

**File 4**: `implementation/T_updateProductionLine.ts` — `requireAuth(req, 'SUPERVISOR')`, panggil `productionLineService.update()`

**File 5**: `implementation/T_deleteProductionLine.ts` — `requireAuth(req, 'ADMIN')`, panggil `productionLineService.delete()`

**File 6**: `implementation/T_assignMachineToLine.ts` — `requireAuth(req, 'SUPERVISOR')`, panggil `productionLineService.assignMachine()`

**File 7**: `implementation/T_removeMachineFromLine.ts` — `requireAuth(req, 'SUPERVISOR')`, panggil `productionLineService.removeMachine()`

### Step 1.7 — Modifikasi File Existing

#### A. `types/api/T_createMachine.ts` — tambah di `T_createMachine_body`:
```typescript
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_production_line must be a number (decimal)' })
  id_production_line?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'sequence_order must be a number (decimal)' })
  sequence_order?: number
```

#### B. `types/api/T_updateMachine.ts` — tambah field yang sama di `T_updateMachine_body`

#### C. `implementation/T_createMachine.ts` — tambah destructuring `id_production_line`, `sequence_order` dan pass ke `machineRepository.create()`:
```typescript
  id_production_line: id_production_line ? Number(id_production_line) : null,
  sequence_order: sequence_order ? Number(sequence_order) : null,
```

#### D. `implementation/T_updateMachine.ts` — tambah di destructuring dan updateData:
```typescript
  if (id_production_line !== undefined) updateData.id_production_line = id_production_line ? Number(id_production_line) : null;
  if (sequence_order !== undefined) updateData.sequence_order = sequence_order ? Number(sequence_order) : null;
```

#### E. `src/repositories/machine.repository.ts` — update `include` di `findWithFilters`:
```typescript
include: {
    Factory: true,
    ProductionLine: true  // ← tambah ini
}
```

#### F. `types/api/T_createWorksheet.ts` — tambah optional field di body:
```typescript
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_production_line must be a number (decimal)' })
  id_production_line?: number
```

#### G. `src/modules/production/worksheet/worksheet.types.ts` — tambah field:
Di `CreateWorksheetDTO`:
```typescript
    id_production_line?: number;
```
Di `WorksheetListParams`:
```typescript
    id_production_line?: number;
```

#### H. `src/services/worksheet.service.ts` — pass `id_production_line` saat mapping DTO ke Prisma create data

#### I. `src/repositories/worksheet.repository.ts` — tambah `ProductionLine: true` di include pada `findById()` dan `findWithFilters()`. Tambah filter `id_production_line` di `findWithFilters()` where clause.

### Step 1.8 — Frontend

#### A. File baru: `frontend/src/pages/production/ProductionLines.tsx`
- Ikuti pattern & styling dari `frontend/src/pages/production/Machines.tsx`
- Factory selector di atas (pakai hook `useFactory` dari `frontend/src/hooks/useFactory.ts`)
- Tabel kolom: Code, Nama, Jumlah Mesin, Kapasitas/jam, Status (Aktif/Tidak)
- Modal create/edit form
- Klik row buka detail: daftar mesin dalam lini (urut sequence_order)
- Button assign mesin (pilih dari dropdown mesin di factory yang sama)
- Button remove mesin dari lini

#### B. Update `frontend/src/services/api.ts` — tambah setelah `machineApi`:
```typescript
export const productionLineApi = {
    getAll: (params?: Record<string, any>) => api.get('/production-lines', { params }),
    getById: (id: number) => api.get(`/production-lines/${id}`),
    create: (data: Record<string, any>) => api.post('/production-lines', data),
    update: (id: number, data: Record<string, any>) => api.put(`/production-lines/${id}`, data),
    delete: (id: number) => api.delete(`/production-lines/${id}`),
    assignMachine: (id: number, data: { id_machine: number; sequence_order: number }) =>
        api.post(`/production-lines/${id}/machines`, data),
    removeMachine: (id: number, machineId: number) =>
        api.delete(`/production-lines/${id}/machines/${machineId}`),
};
```

#### C. Update `frontend/src/App.tsx` — tambah lazy-loaded route di section production:
```tsx
const ProductionLines = lazy(() => import('./pages/production/ProductionLines'));
// ... di routes:
{ path: 'production-lines', element: <ProductionLines /> }
```

#### D. Update `frontend/src/components/Layout/Sidebar.tsx` — tambah menu "Lini Produksi" di section Produksi, dengan icon layout/grid

#### E. Update `frontend/src/pages/production/OEE.tsx` — tambah toggle/dropdown untuk menampilkan OEE per Production Line (grouping) selain per Machine individual

---

## FASE 2: Work Order (Perintah Kerja)

**Konsep**: Work Order adalah perintah kerja yang mengelompokkan beberapa Worksheet sebagai tahapan produksi berurutan (Pengeringan → Penggilingan → Grading). Status WO otomatis update berdasarkan progress worksheet child-nya.

### Step 2.1 — Prisma Schema + Migration

**File**: `prisma/schema.prisma`

#### A. Tambah 2 enum baru (taruh di bagian enum, bawah file):

```prisma
enum WorkOrder_status_enum {
  PLANNED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum WorkOrder_priority_enum {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

#### B. Tambah model `WorkOrder` (taruh setelah model `Worksheet`):

```prisma
model WorkOrder {
  id                  Int                       @id @default(autoincrement())
  id_factory          Int
  id_user             Int
  work_order_number   String                    @unique @db.VarChar(30)
  target_product      String?                   @db.VarChar(200)
  target_quantity     Decimal?                  @db.Decimal(15, 2)
  actual_quantity     Decimal?                  @db.Decimal(15, 2)
  status              WorkOrder_status_enum     @default(PLANNED)
  priority            WorkOrder_priority_enum   @default(MEDIUM)
  planned_start_date  DateTime?                 @db.Date
  planned_end_date    DateTime?                 @db.Date
  actual_start_date   DateTime?                 @db.Date
  actual_end_date     DateTime?                 @db.Date
  notes               String?
  created_at          DateTime                  @default(now()) @db.Timestamp(6)
  updated_at          DateTime                  @updatedAt @db.Timestamp(6)
  Factory             Factory                   @relation(fields: [id_factory], references: [id], onDelete: NoAction, onUpdate: NoAction)
  User                User                      @relation("WorkOrderCreatedBy", fields: [id_user], references: [id], onDelete: NoAction, onUpdate: NoAction)
  Worksheet           Worksheet[]

  @@index([id_factory])
  @@index([status])
  @@index([work_order_number])
}
```

#### C. Modifikasi model `Worksheet` — tambah field (setelah `id_production_line`):

```prisma
  id_work_order       Int?
  step_number         Int?
  WorkOrder           WorkOrder?   @relation(fields: [id_work_order], references: [id], onDelete: SetNull, onUpdate: NoAction)
```

#### D. Modifikasi model `Factory` — tambah relasi:
```prisma
  WorkOrder           WorkOrder[]
```

#### E. Modifikasi model `User` — tambah relasi:
```prisma
  WorkOrderCreated    WorkOrder[]   @relation("WorkOrderCreatedBy")
```

#### F. Jalankan migration:
```bash
npx prisma migrate dev --name add_work_order
```

### Step 2.2 — Model Table Stub & Enum Files

**File baru**: `types/model/table/WorkOrder.ts`
Ikuti pattern persis seperti `types/model/table/Machine.ts`. Field: id, id_factory, id_user, work_order_number, target_product, target_quantity, actual_quantity, status, priority, planned_start_date, planned_end_date, actual_start_date, actual_end_date, notes. Relasi ManyToOne ke Factory dan User.

**File baru**: `types/model/enum/WorkOrderStatus.ts`
```typescript
export enum WorkOrderStatus {
  'PLANNED' = 'PLANNED',
  'IN_PROGRESS' = 'IN_PROGRESS',
  'COMPLETED' = 'COMPLETED',
  'CANCELLED' = 'CANCELLED',
}
```

**File baru**: `types/model/enum/WorkOrderPriority.ts`
```typescript
export enum WorkOrderPriority {
  'LOW' = 'LOW',
  'MEDIUM' = 'MEDIUM',
  'HIGH' = 'HIGH',
  'URGENT' = 'URGENT',
}
```

### Step 2.3 — Module Structure

Buat folder: `src/modules/production/work-order/`

**File baru**: `src/modules/production/work-order/work-order.types.ts`

```typescript
import { WorkOrder, WorkOrder_status_enum, WorkOrder_priority_enum } from '@prisma/client';

export { WorkOrder_status_enum, WorkOrder_priority_enum };

export interface CreateWorkOrderDTO {
    id_factory: number;
    id_user: number;
    target_product?: string;
    target_quantity?: number;
    priority?: WorkOrder_priority_enum;
    planned_start_date?: string;
    planned_end_date?: string;
    notes?: string;
}

export interface UpdateWorkOrderDTO extends Partial<CreateWorkOrderDTO> {
    id: number;
}

export interface WorkOrderListParams {
    limit?: number;
    offset?: number;
    id_factory?: number;
    status?: string;
    priority?: string;
    start_date?: string;
    end_date?: string;
}

export interface WorkOrderWithRelations extends WorkOrder {
    Factory?: { id: number; code: string; name: string };
    User?: { id: number; fullname: string };
    Worksheet?: Array<{
        id: number;
        step_number: number | null;
        status: string;
        worksheet_date: Date;
        process_step: string | null;
        beras_output: any;
        batch_code: string | null;
        Machine?: { id: number; name: string } | null;
        ProductionLine?: { id: number; name: string } | null;
    }>;
}
```

**File baru**: `src/modules/production/work-order/work-order.constants.ts`

```typescript
export const WO_STATUS_CONFIG = {
    PLANNED:     { label: 'Direncanakan', color: '#6b7280', bg: '#f3f4f6' },
    IN_PROGRESS: { label: 'Berjalan',     color: '#1d4ed8', bg: '#dbeafe' },
    COMPLETED:   { label: 'Selesai',      color: '#15803d', bg: '#dcfce7' },
    CANCELLED:   { label: 'Dibatalkan',   color: '#374151', bg: '#e5e7eb' },
} as const;

export const WO_PRIORITY_CONFIG = {
    LOW:    { label: 'Rendah',  color: '#6b7280', bg: '#f3f4f6' },
    MEDIUM: { label: 'Sedang',  color: '#1d4ed8', bg: '#dbeafe' },
    HIGH:   { label: 'Tinggi',  color: '#b45309', bg: '#fef3c7' },
    URGENT: { label: 'Urgent',  color: '#b91c1c', bg: '#fee2e2' },
} as const;

export const WO_WORKFLOW_TRANSITIONS: Record<string, string[]> = {
    PLANNED:     ['IN_PROGRESS', 'CANCELLED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
    COMPLETED:   [],
    CANCELLED:   [],
};

export const WO_DELETABLE_STATUSES = ['PLANNED', 'CANCELLED'];
export const WO_EDITABLE_STATUSES = ['PLANNED'];

export const WO_STATUS_FILTERS = [
    { value: '', label: 'Semua Status' },
    { value: 'PLANNED', label: 'Direncanakan' },
    { value: 'IN_PROGRESS', label: 'Berjalan' },
    { value: 'COMPLETED', label: 'Selesai' },
    { value: 'CANCELLED', label: 'Dibatalkan' },
] as const;

export const WO_PRIORITY_FILTERS = [
    { value: '', label: 'Semua Prioritas' },
    { value: 'LOW', label: 'Rendah' },
    { value: 'MEDIUM', label: 'Sedang' },
    { value: 'HIGH', label: 'Tinggi' },
    { value: 'URGENT', label: 'Urgent' },
] as const;
```

### Step 2.4 — Repository

**File baru**: `src/repositories/work-order.repository.ts`

```typescript
import { BaseRepository } from './base.repository';
import { WorkOrder, WorkOrder_status_enum, WorkOrder_priority_enum } from '@prisma/client';

export class WorkOrderRepository extends BaseRepository<WorkOrder> {
    protected modelName = 'WorkOrder';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        status?: string;
        priority?: string;
        start_date?: Date;
        end_date?: Date;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = Number(params.id_factory);
        if (params.status) where.status = params.status as WorkOrder_status_enum;
        if (params.priority) where.priority = params.priority as WorkOrder_priority_enum;

        if (params.start_date || params.end_date) {
            where.planned_start_date = {};
            if (params.start_date) where.planned_start_date.gte = params.start_date;
            if (params.end_date) where.planned_start_date.lte = params.end_date;
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: [{ created_at: 'desc' }, { id: 'desc' }],
                include: {
                    Factory: true,
                    User: { select: { id: true, fullname: true } },
                    _count: { select: { Worksheet: true } }
                }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }

    async findByIdWithWorksheets(id: number): Promise<WorkOrder | null> {
        return await this.model.findUnique({
            where: { id },
            include: {
                Factory: true,
                User: { select: { id: true, fullname: true } },
                Worksheet: {
                    orderBy: { step_number: 'asc' },
                    include: {
                        Machine: true,
                        ProductionLine: true,
                        ProductType: true,
                        User: { select: { id: true, fullname: true } },
                    }
                }
            }
        });
    }
}

export const workOrderRepository = new WorkOrderRepository();
```

**Update**: `src/repositories/index.ts` — tambah `export * from './work-order.repository'`

### Step 2.5 — Service

**File baru**: `src/services/work-order.service.ts`

Service class dengan method berikut (semua pakai `prisma.$transaction()` dan `auditService.log()`):

| Method | Deskripsi |
|--------|-----------|
| `create(dto, userId)` | Auto-generate `work_order_number` format `WO-{factory_prefix}-{DDMMYY}-{SEQ}`. Gunakan pattern dari `BatchNumberingService.getNextSequence()` — upsert ke tabel `BatchSequence` dengan key `WO-{factory}-{date}`. Create WorkOrder, audit |
| `update(id, dto, userId)` | Hanya status PLANNED bisa edit (cek `WO_EDITABLE_STATUSES`). Update, audit |
| `delete(id, userId)` | Hanya PLANNED/CANCELLED bisa delete (cek `WO_DELETABLE_STATUSES`). Unlink worksheets dulu, delete, audit |
| `start(id, userId)` | Validasi status PLANNED, transition → IN_PROGRESS, set `actual_start_date = now()`, audit |
| `complete(id, userId)` | Validasi status IN_PROGRESS, validasi semua child worksheets COMPLETED, hitung `actual_quantity = sum(worksheet.beras_output)`, set `actual_end_date = now()`, transition → COMPLETED, audit |
| `cancel(id, userId, reason?)` | Transition → CANCELLED, audit |
| `addWorksheet(woId, worksheetId, stepNumber)` | Validasi worksheet exists & same factory, set `id_work_order` & `step_number` pada Worksheet |
| `removeWorksheet(woId, worksheetId)` | Clear `id_work_order` & `step_number` pada Worksheet |
| `syncStatusFromWorksheets(woId)` | Dipanggil oleh event listener. Cek semua child worksheet: jika semua COMPLETED → auto-complete WO, jika ada yang IN_PROGRESS/SUBMITTED → auto-start WO |

**Referensi auto-numbering**: lihat `src/services/batch-numbering.service.ts` method `getNextSequence()` yang pakai `tx.batchSequence.upsert()`.

### Step 2.6 — API Type Files (10 file)

Semua di `types/api/`, ikuti pattern NAIV persis.

| File | method | url_path | Body/Query/Path |
|------|--------|----------|-----------------|
| `T_createWorkOrder.ts` | `post` | `/work-orders` | body: id_factory (req), target_product (opt), target_quantity (opt), priority (opt), planned_start_date (opt), planned_end_date (opt), notes (opt) |
| `T_getWorkOrders.ts` | `get` | `/work-orders` | query: limit, offset, id_factory, status, priority, start_date, end_date (semua opt) |
| `T_getWorkOrderById.ts` | `get` | `/work-orders/:id` | path: id |
| `T_updateWorkOrder.ts` | `put` | `/work-orders/:id` | path: id, body: target_product, target_quantity, priority, planned_start_date, planned_end_date, notes (semua opt) |
| `T_deleteWorkOrder.ts` | `delete` | `/work-orders/:id` | path: id |
| `T_startWorkOrder.ts` | `post` | `/work-orders/:id/start` | path: id |
| `T_completeWorkOrder.ts` | `post` | `/work-orders/:id/complete` | path: id |
| `T_cancelWorkOrder.ts` | `post` | `/work-orders/:id/cancel` | path: id, body: reason (opt) |
| `T_addWorksheetToOrder.ts` | `post` | `/work-orders/:id/worksheets` | path: id, body: id_worksheet (req), step_number (req) |
| `T_removeWorksheetFromOrder.ts` | `delete` | `/work-orders/:id/worksheets/:worksheetId` | path: id, worksheetId |

### Step 2.7 — Implementation Files (10 file)

Semua di `implementation/`, ikuti pattern persis.

| File | Auth Role | Calls |
|------|-----------|-------|
| `T_createWorkOrder.ts` | SUPERVISOR | `workOrderService.create()` |
| `T_getWorkOrders.ts` | OPERATOR | `workOrderRepository.findWithFilters()` |
| `T_getWorkOrderById.ts` | OPERATOR | `workOrderRepository.findByIdWithWorksheets()` |
| `T_updateWorkOrder.ts` | SUPERVISOR | `workOrderService.update()` |
| `T_deleteWorkOrder.ts` | ADMIN | `workOrderService.delete()` |
| `T_startWorkOrder.ts` | SUPERVISOR | `workOrderService.start()` |
| `T_completeWorkOrder.ts` | SUPERVISOR | `workOrderService.complete()` |
| `T_cancelWorkOrder.ts` | SUPERVISOR | `workOrderService.cancel()` |
| `T_addWorksheetToOrder.ts` | SUPERVISOR | `workOrderService.addWorksheet()` |
| `T_removeWorksheetFromOrder.ts` | SUPERVISOR | `workOrderService.removeWorksheet()` |

### Step 2.8 — Modifikasi File Existing

#### A. `types/api/T_createWorksheet.ts` — tambah optional fields di body:
```typescript
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_work_order must be a number (decimal)' })
  id_work_order?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'step_number must be a number (decimal)' })
  step_number?: number
```

#### B. `src/modules/production/worksheet/worksheet.types.ts`:
Di `CreateWorksheetDTO` tambah:
```typescript
    id_work_order?: number;
    step_number?: number;
```
Di `WorksheetListParams` tambah:
```typescript
    id_work_order?: number;
```
Di `WorksheetWithRelations` tambah:
```typescript
    WorkOrder?: { id: number; work_order_number: string; status: string };
```

#### C. `src/services/worksheet.service.ts` — pass `id_work_order` dan `step_number` saat mapping DTO ke Prisma create data

#### D. `src/repositories/worksheet.repository.ts`:
- Di `findById()` include tambah: `WorkOrder: true`
- Di `findWithFilters()` include tambah: `WorkOrder: true`
- Di `findWithFilters()` where clause tambah: `if (params.id_work_order) where.id_work_order = params.id_work_order;`

### Step 2.9 — Frontend

#### A. File baru: `frontend/src/pages/production/WorkOrders.tsx`
- List page dengan factory selector, filter status & priority
- Tabel: WO Number, Target Product, Target Qty, Status badge, Priority badge, Tanggal, Jumlah Step
- Klik row navigasi ke detail

#### B. File baru: `frontend/src/pages/production/WorkOrderDetail.tsx`
- Header: WO number, status badge (warna dari `WO_STATUS_CONFIG`), priority badge, tanggal plan/actual
- Progress bar: jumlah worksheet completed / total
- Body: timeline/list worksheet steps (ordered by step_number)
- Setiap step tampilkan: step number, process_step, batch_code, status worksheet, output
- Action buttons: Start WO, Complete WO, Cancel WO (tampilkan sesuai `WO_WORKFLOW_TRANSITIONS`)
- Button Add Worksheet (pilih dari dropdown worksheet yang belum assigned ke WO manapun)
- Button Remove Worksheet

#### C. File baru: `frontend/src/pages/production/WorkOrderForm.tsx`
- Form create/edit: factory (auto dari context), target product, target quantity, priority dropdown, planned date range, notes
- Hanya muncul untuk PLANNED status

#### D. Update `frontend/src/services/api.ts` — tambah:
```typescript
export const workOrderApi = {
    getAll: (params?: Record<string, any>) => api.get('/work-orders', { params }),
    getById: (id: number) => api.get(`/work-orders/${id}`),
    create: (data: Record<string, any>) => api.post('/work-orders', data),
    update: (id: number, data: Record<string, any>) => api.put(`/work-orders/${id}`, data),
    delete: (id: number) => api.delete(`/work-orders/${id}`),
    start: (id: number) => api.post(`/work-orders/${id}/start`),
    complete: (id: number) => api.post(`/work-orders/${id}/complete`),
    cancel: (id: number, data?: { reason?: string }) => api.post(`/work-orders/${id}/cancel`, data),
    addWorksheet: (id: number, data: { id_worksheet: number; step_number: number }) =>
        api.post(`/work-orders/${id}/worksheets`, data),
    removeWorksheet: (id: number, worksheetId: number) =>
        api.delete(`/work-orders/${id}/worksheets/${worksheetId}`),
};
```

#### E. Update `frontend/src/App.tsx` — tambah routes:
```tsx
const WorkOrders = lazy(() => import('./pages/production/WorkOrders'));
const WorkOrderDetail = lazy(() => import('./pages/production/WorkOrderDetail'));
const WorkOrderForm = lazy(() => import('./pages/production/WorkOrderForm'));
// ... di routes:
{ path: 'work-orders', element: <WorkOrders /> }
{ path: 'work-orders/new', element: <WorkOrderForm /> }
{ path: 'work-orders/:id', element: <WorkOrderDetail /> }
{ path: 'work-orders/:id/edit', element: <WorkOrderForm /> }
```

#### F. Update Sidebar — tambah menu "Work Order" di section Produksi, dengan icon clipboard/list

---

## FASE 3: Event System (Fondasi Decoupling)

**Konsep**: Simple in-process event emitter menggunakan Node.js built-in EventEmitter. Ketika worksheet berubah status, dia emit event → module lain bisa listen dan react (contoh: auto-complete Work Order ketika semua worksheet selesai).

### Step 3.1 — Event Bus

**File baru**: `src/libs/event-bus.ts`

```typescript
import { EventEmitter } from 'events';

export interface AppEvent<T = any> {
    type: string;
    payload: T;
    timestamp: Date;
    userId?: number;
}

class AppEventBus extends EventEmitter {
    emitEvent<T>(eventType: string, payload: T, userId?: number): void {
        const event: AppEvent<T> = {
            type: eventType,
            payload,
            timestamp: new Date(),
            userId,
        };
        this.emit(eventType, event);
    }
}

export const eventBus = new AppEventBus();
eventBus.setMaxListeners(50);
```

### Step 3.2 — Event Types

**File baru**: `src/libs/event-types.ts`

```typescript
export const EVENTS = {
    // Worksheet events
    WORKSHEET_CREATED: 'worksheet.created',
    WORKSHEET_SUBMITTED: 'worksheet.submitted',
    WORKSHEET_COMPLETED: 'worksheet.completed',
    WORKSHEET_REJECTED: 'worksheet.rejected',
    WORKSHEET_CANCELLED: 'worksheet.cancelled',
    // Work Order events
    WORK_ORDER_STARTED: 'work-order.started',
    WORK_ORDER_COMPLETED: 'work-order.completed',
    WORK_ORDER_CANCELLED: 'work-order.cancelled',
    // Production Line events
    PRODUCTION_LINE_UPDATED: 'production-line.updated',
} as const;

export type EventType = typeof EVENTS[keyof typeof EVENTS];
```

### Step 3.3 — Emit Events dari Worksheet Workflow

**Update**: `src/modules/production/worksheet/workflow/worksheet-workflow.service.ts`

Tambah import di atas:
```typescript
import { eventBus } from '../../../../libs/event-bus';
import { EVENTS } from '../../../../libs/event-types';
```

Di setiap method workflow, **setelah** `prisma.$transaction()` berhasil return, emit event:

```typescript
// Contoh di method submit():
async submit(id: number, userId: number): Promise<Worksheet> {
    const result = await prisma.$transaction(async (tx) => {
        // ... existing logic ...
        return updated;
    });

    // Emit SETELAH transaction commit berhasil
    eventBus.emitEvent(EVENTS.WORKSHEET_SUBMITTED, {
        worksheetId: result.id,
        workOrderId: (result as any).id_work_order,
        factoryId: result.id_factory,
    }, userId);

    return result;
}
```

Emit event untuk setiap transition:
- `submit()` → `EVENTS.WORKSHEET_SUBMITTED`
- `approve()` → `EVENTS.WORKSHEET_COMPLETED`
- `reject()` → `EVENTS.WORKSHEET_REJECTED`
- `cancel()` → `EVENTS.WORKSHEET_CANCELLED`

**PENTING**: Emit **DI LUAR** `prisma.$transaction()` — setelah transaction commit berhasil. Ini mencegah event dikirim untuk transaction yang gagal/rollback.

### Step 3.4 — Work Order Listener

**File baru**: `src/modules/production/work-order/work-order.listener.ts`

```typescript
import { eventBus, AppEvent } from '../../../libs/event-bus';
import { EVENTS } from '../../../libs/event-types';
import { workOrderService } from '../../../services/work-order.service';

export function registerWorkOrderListeners(): void {
    // Ketika worksheet completed, cek apakah semua worksheet di WO sudah selesai
    eventBus.on(EVENTS.WORKSHEET_COMPLETED, async (event: AppEvent) => {
        const { workOrderId } = event.payload;
        if (workOrderId) {
            try {
                await workOrderService.syncStatusFromWorksheets(workOrderId);
                console.log(`[WorkOrderListener] Synced WO #${workOrderId} after worksheet completed`);
            } catch (error) {
                console.error('[WorkOrderListener] Failed to sync WO status:', error);
                // Fire-and-forget: error di listener tidak mengganggu main flow
            }
        }
    });

    // Ketika worksheet cancelled, sync ulang WO status
    eventBus.on(EVENTS.WORKSHEET_CANCELLED, async (event: AppEvent) => {
        const { workOrderId } = event.payload;
        if (workOrderId) {
            try {
                await workOrderService.syncStatusFromWorksheets(workOrderId);
                console.log(`[WorkOrderListener] Synced WO #${workOrderId} after worksheet cancelled`);
            } catch (error) {
                console.error('[WorkOrderListener] Failed to sync WO status:', error);
            }
        }
    });

    console.log('[EventBus] Work Order listeners registered');
}
```

### Step 3.5 — Register Listeners di Startup

**Update**: `index.ts` (server entry point)

Tambah import dan panggil di bagian startup (setelah express app setup, sebelum `app.listen()`):

```typescript
import { registerWorkOrderListeners } from './src/modules/production/work-order/work-order.listener';

// Register event listeners
registerWorkOrderListeners();
```

---

## Urutan Pengerjaan

| # | Step | Fase | Depends On | Estimasi |
|---|------|------|------------|----------|
| 1 | Schema ProductionLine + migration | 1.1 | - | 10 min |
| 2 | Model stub ProductionLine | 1.2 | 1 | 5 min |
| 3 | Repository production-line | 1.3 | 1 | 10 min |
| 4 | Service production-line | 1.4 | 3 | 15 min |
| 5 | API type files (7) | 1.5 | 2 | 20 min |
| 6 | Implementation files (7) | 1.6 | 3, 4, 5 | 15 min |
| 7 | Modifikasi Machine & Worksheet existing | 1.7 | 1 | 15 min |
| 8 | Frontend ProductionLines | 1.8 | 6 | 30 min |
| 9 | Schema WorkOrder + migration | 2.1 | 1 | 10 min |
| 10 | Model stub + enums WorkOrder | 2.2 | 9 | 10 min |
| 11 | Module structure (types, constants) | 2.3 | 9 | 10 min |
| 12 | Repository work-order | 2.4 | 9 | 10 min |
| 13 | Service work-order | 2.5 | 11, 12 | 25 min |
| 14 | API type files (10) | 2.6 | 10 | 25 min |
| 15 | Implementation files (10) | 2.7 | 12, 13, 14 | 20 min |
| 16 | Modifikasi Worksheet existing | 2.8 | 9 | 10 min |
| 17 | Frontend WorkOrders (3 pages) | 2.9 | 15 | 45 min |
| 18 | Event bus + types | 3.1-3.2 | - | 5 min |
| 19 | Emit events dari worksheet workflow | 3.3 | 18 | 10 min |
| 20 | Work order listener | 3.4 | 13, 18 | 5 min |
| 21 | Register listeners di startup | 3.5 | 19, 20 | 2 min |

---

## File Inventory

### File Baru (51 file)

**Fase 1 — Production Line (18 file)**:
1. `types/model/table/ProductionLine.ts`
2. `src/repositories/production-line.repository.ts`
3. `src/services/production-line.service.ts`
4. `types/api/T_createProductionLine.ts`
5. `types/api/T_getProductionLines.ts`
6. `types/api/T_getProductionLineById.ts`
7. `types/api/T_updateProductionLine.ts`
8. `types/api/T_deleteProductionLine.ts`
9. `types/api/T_assignMachineToLine.ts`
10. `types/api/T_removeMachineFromLine.ts`
11. `implementation/T_createProductionLine.ts`
12. `implementation/T_getProductionLines.ts`
13. `implementation/T_getProductionLineById.ts`
14. `implementation/T_updateProductionLine.ts`
15. `implementation/T_deleteProductionLine.ts`
16. `implementation/T_assignMachineToLine.ts`
17. `implementation/T_removeMachineFromLine.ts`
18. `frontend/src/pages/production/ProductionLines.tsx`

**Fase 2 — Work Order (30 file)**:
19. `types/model/table/WorkOrder.ts`
20. `types/model/enum/WorkOrderStatus.ts`
21. `types/model/enum/WorkOrderPriority.ts`
22. `src/modules/production/work-order/work-order.types.ts`
23. `src/modules/production/work-order/work-order.constants.ts`
24. `src/repositories/work-order.repository.ts`
25. `src/services/work-order.service.ts`
26. `types/api/T_createWorkOrder.ts`
27. `types/api/T_getWorkOrders.ts`
28. `types/api/T_getWorkOrderById.ts`
29. `types/api/T_updateWorkOrder.ts`
30. `types/api/T_deleteWorkOrder.ts`
31. `types/api/T_startWorkOrder.ts`
32. `types/api/T_completeWorkOrder.ts`
33. `types/api/T_cancelWorkOrder.ts`
34. `types/api/T_addWorksheetToOrder.ts`
35. `types/api/T_removeWorksheetFromOrder.ts`
36. `implementation/T_createWorkOrder.ts`
37. `implementation/T_getWorkOrders.ts`
38. `implementation/T_getWorkOrderById.ts`
39. `implementation/T_updateWorkOrder.ts`
40. `implementation/T_deleteWorkOrder.ts`
41. `implementation/T_startWorkOrder.ts`
42. `implementation/T_completeWorkOrder.ts`
43. `implementation/T_cancelWorkOrder.ts`
44. `implementation/T_addWorksheetToOrder.ts`
45. `implementation/T_removeWorksheetFromOrder.ts`
46. `frontend/src/pages/production/WorkOrders.tsx`
47. `frontend/src/pages/production/WorkOrderDetail.tsx`
48. `frontend/src/pages/production/WorkOrderForm.tsx`

**Fase 3 — Event System (3 file)**:
49. `src/libs/event-bus.ts`
50. `src/libs/event-types.ts`
51. `src/modules/production/work-order/work-order.listener.ts`

### File Dimodifikasi (17 file)

1. `prisma/schema.prisma` — tambah ProductionLine, WorkOrder model + enum; modif Machine, Worksheet, Factory, User
2. `src/repositories/index.ts` — export repository baru
3. `src/repositories/machine.repository.ts` — include ProductionLine
4. `src/repositories/worksheet.repository.ts` — include ProductionLine & WorkOrder; tambah filter
5. `src/services/worksheet.service.ts` — pass FK baru (id_production_line, id_work_order, step_number)
6. `src/modules/production/worksheet/worksheet.types.ts` — tambah field di DTO
7. `src/modules/production/worksheet/workflow/worksheet-workflow.service.ts` — emit events
8. `types/api/T_createMachine.ts` — tambah id_production_line, sequence_order
9. `types/api/T_updateMachine.ts` — tambah id_production_line, sequence_order
10. `types/api/T_createWorksheet.ts` — tambah id_production_line, id_work_order, step_number
11. `implementation/T_createMachine.ts` — pass new fields
12. `implementation/T_updateMachine.ts` — pass new fields
13. `frontend/src/services/api.ts` — tambah productionLineApi, workOrderApi
14. `frontend/src/App.tsx` — tambah routes
15. `frontend/src/components/Layout/Sidebar.tsx` — tambah menu items
16. `frontend/src/pages/production/OEE.tsx` — OEE per production line
17. `index.ts` — register event listeners

---

## Verifikasi

Setelah implementasi selesai, verifikasi dengan:

1. **Schema**: `npx prisma migrate status` — pastikan semua migration applied
2. **Generate**: `npx prisma generate` — pastikan Prisma client up to date
3. **Build**: `npx tsc --noEmit` — pastikan tidak ada TypeScript error
4. **Server**: Jalankan server (`npm run dev`), cek console tidak ada error, event listeners registered
5. **API Test Production Line**:
   - `POST /production-lines` dengan `{ id_factory: 1, code: "LINE-PMD1-01", name: "Lini Produksi 1" }` → success
   - `GET /production-lines?id_factory=1` → list muncul
   - `POST /production-lines/1/machines` dengan `{ id_machine: 1, sequence_order: 1 }` → mesin ter-assign
   - `GET /production-lines/1` → detail dengan daftar mesin
   - `DELETE /production-lines/1/machines/1` → mesin ter-unassign
6. **API Test Work Order**:
   - `POST /work-orders` dengan `{ id_factory: 1, target_product: "Beras Premium", target_quantity: 1000, priority: "HIGH" }` → success, WO number auto-generated
   - `POST /work-orders/1/start` → status IN_PROGRESS
   - `POST /work-orders/1/worksheets` dengan `{ id_worksheet: 1, step_number: 1 }` → worksheet linked
   - Approve semua worksheet dalam WO → event listener auto-sync WO → status COMPLETED
7. **Frontend**: Buka browser, cek menu "Lini Produksi" dan "Work Order" muncul di sidebar, halaman CRUD berfungsi
