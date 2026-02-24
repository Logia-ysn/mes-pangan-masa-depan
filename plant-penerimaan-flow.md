# Plan: Flow Penerimaan Bahan Baku → Pembayaran

## Context

Saat ini, flow penerimaan bahan baku (Direct Raw Material Receipt) menyimpan data sebagai JSON di field `notes` pada `StockMovement` (`/frontend/src/pages/production/RawMaterialReceipt.tsx:372-399`), tanpa status approval. Stok langsung tersedia begitu operator input. Tidak ada konsep karantina, digital stamp, atau tracking pembayaran ke supplier.

**Tujuan**: Membangun workflow bertahap:
```
Operator Input → WAITING_APPROVAL (stok karantina)
       ↓
Manager Approve → APPROVED (stok ready + digital stamp PDF)
       ↓
Accounting Mark Paid → PAID (pembayaran ke supplier dicatat)
```

**Scope**: Hanya Direct Raw Material Receipt (BUKAN PO-based GoodsReceipt).

---

## STEP 1: Schema Prisma — Tambah Enum, Model, dan Field Baru

**File**: `/prisma/schema.prisma`

### 1a. Tambah enum `MaterialReceipt_status_enum` (setelah baris ~631, dekat enum lainnya)

```prisma
enum MaterialReceipt_status_enum {
  WAITING_APPROVAL
  APPROVED
  PAID
}
```

### 1b. Tambah `RECEIPT_APPROVED` ke `Notification_type_enum` (baris ~707)

Ubah dari:
```prisma
enum Notification_type_enum {
  LOW_STOCK
  OVERDUE_INVOICE
  OVERDUE_MAINTENANCE
  SYSTEM
}
```
Menjadi:
```prisma
enum Notification_type_enum {
  LOW_STOCK
  OVERDUE_INVOICE
  OVERDUE_MAINTENANCE
  RECEIPT_APPROVED
  RECEIPT_PAID
  SYSTEM
}
```

### 1c. Tambah `ACCOUNTING` ke `User_role_enum` (baris ~693)

Ubah dari:
```prisma
enum User_role_enum {
  SUPERUSER
  ADMIN
  MANAGER
  SUPERVISOR
  OPERATOR
}
```
Menjadi:
```prisma
enum User_role_enum {
  SUPERUSER
  ADMIN
  MANAGER
  ACCOUNTING
  SUPERVISOR
  OPERATOR
}
```

### 1d. Tambah field `quarantine_quantity` ke model `Stock` (baris ~370)

Tambahkan field baru setelah `quantity`:
```prisma
model Stock {
  id                  Int                   @id(map: "PK_2725537b7bbe40073a50986598d") @default(autoincrement())
  id_factory          Int
  id_product_type     Int
  quantity            Decimal               @default(0) @db.Decimal(15, 2)
  quarantine_quantity Decimal               @default(0) @db.Decimal(15, 2)  // NEW
  unit                String                @default("kg") @db.VarChar(20)
  updated_at          DateTime              @updatedAt @db.Timestamp(6)
  // ... relations tetap sama ...
}
```

### 1e. Tambah model `MaterialReceipt` (setelah model `GoodsReceiptItem`, baris ~591)

```prisma
model MaterialReceipt {
  id                 Int                          @id @default(autoincrement())
  receipt_number     String                       @unique @db.VarChar(50)
  id_stock_movement  Int
  id_supplier        Int
  id_factory         Int
  id_user            Int
  id_product_type    Int
  id_variety         Int?
  receipt_date       DateTime                     @db.Date
  batch_code         String                       @db.VarChar(50)
  quantity           Decimal                      @db.Decimal(15, 2)
  unit_price         Decimal                      @db.Decimal(15, 2)
  other_costs        Decimal                      @default(0) @db.Decimal(15, 2)
  total_amount       Decimal                      @db.Decimal(15, 2)
  status             MaterialReceipt_status_enum  @default(WAITING_APPROVAL)
  approved_by        Int?
  approved_at        DateTime?                    @db.Timestamp(6)
  paid_by            Int?
  paid_at            DateTime?                    @db.Timestamp(6)
  payment_reference  String?                      @db.VarChar(100)
  payment_method     Payment_payment_method_enum?
  delivery_note_url  String?
  receipt_url        String?
  notes              String?
  created_at         DateTime                     @default(now()) @db.Timestamp(6)
  updated_at         DateTime                     @updatedAt @db.Timestamp(6)

  StockMovement      StockMovement                @relation(fields: [id_stock_movement], references: [id], onDelete: NoAction, onUpdate: NoAction)
  Supplier           Supplier                     @relation(fields: [id_supplier], references: [id], onDelete: NoAction, onUpdate: NoAction)
  Factory            Factory                      @relation(fields: [id_factory], references: [id], onDelete: NoAction, onUpdate: NoAction)
  User               User                         @relation("MaterialReceiptOperator", fields: [id_user], references: [id], onDelete: NoAction, onUpdate: NoAction)
  ProductType        ProductType                  @relation(fields: [id_product_type], references: [id], onDelete: NoAction, onUpdate: NoAction)
  Approver           User?                        @relation("MaterialReceiptApprover", fields: [approved_by], references: [id], onDelete: NoAction, onUpdate: NoAction)
  PaidByUser         User?                        @relation("MaterialReceiptPaidBy", fields: [paid_by], references: [id], onDelete: NoAction, onUpdate: NoAction)

  @@index([id_factory])
  @@index([id_supplier])
  @@index([status])
  @@index([receipt_date])
  @@index([batch_code])
}
```

### 1f. Update relasi pada model existing

**Pada model `Supplier`** (baris ~412): tambah `MaterialReceipt MaterialReceipt[]`
**Pada model `StockMovement`** (baris ~387): tambah `MaterialReceipt MaterialReceipt[]`
**Pada model `Factory`** (cari model Factory): tambah `MaterialReceipt MaterialReceipt[]`
**Pada model `ProductType`** (cari model ProductType): tambah `MaterialReceipt MaterialReceipt[]`
**Pada model `User`** (baris ~425): tambah 3 relasi:
```prisma
  MaterialReceiptOperator  MaterialReceipt[] @relation("MaterialReceiptOperator")
  MaterialReceiptApprover  MaterialReceipt[] @relation("MaterialReceiptApprover")
  MaterialReceiptPaidBy    MaterialReceipt[] @relation("MaterialReceiptPaidBy")
```

### 1g. Run Migration

```bash
npx prisma migrate dev --name add_material_receipt_workflow
npx prisma generate
```

---

## STEP 2: Update Role Hierarchy

**File**: `/utility/auth.ts`

Ubah `ROLE_HIERARCHY` (baris 21-27) dari:
```typescript
const ROLE_HIERARCHY: Record<string, number> = {
    OPERATOR: 1,
    SUPERVISOR: 2,
    MANAGER: 3,
    ADMIN: 4,
    SUPERUSER: 5,
};
```
Menjadi:
```typescript
const ROLE_HIERARCHY: Record<string, number> = {
    OPERATOR: 1,
    SUPERVISOR: 2,
    ACCOUNTING: 3,
    MANAGER: 3,
    ADMIN: 4,
    SUPERUSER: 5,
};
```

---

## STEP 3: Backend — Repository

**File baru**: `/src/repositories/material-receipt.repository.ts`

Ikuti pattern dari `/src/repositories/goods-receipt.repository.ts`. Extends `BaseRepository` dari `/src/repositories/base.repository.ts`.

```typescript
import { BaseRepository } from './base.repository';
import { MaterialReceipt } from '@prisma/client';
import { prisma } from '../libs/prisma';

export class MaterialReceiptRepository extends BaseRepository<MaterialReceipt> {
    protected modelName = 'MaterialReceipt';

    // Include relations lengkap
    private fullInclude = {
        StockMovement: {
            include: {
                Stock: { include: { Factory: true, ProductType: true } },
                RawMaterialQualityAnalysis: true
            }
        },
        Supplier: true,
        Factory: true,
        User: { select: { id: true, fullname: true, email: true, role: true } },
        ProductType: true,
        Approver: { select: { id: true, fullname: true, email: true, role: true } },
        PaidByUser: { select: { id: true, fullname: true, email: true, role: true } }
    };

    async findById(id: number) {
        return prisma.materialReceipt.findUnique({
            where: { id },
            include: this.fullInclude
        });
    }

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_supplier?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = params.id_factory;
        if (params.id_supplier) where.id_supplier = params.id_supplier;
        if (params.status) where.status = params.status;
        if (params.start_date || params.end_date) {
            where.receipt_date = {};
            if (params.start_date) where.receipt_date.gte = new Date(params.start_date);
            if (params.end_date) where.receipt_date.lte = new Date(params.end_date);
        }

        const [data, total] = await Promise.all([
            prisma.materialReceipt.findMany({
                where,
                include: this.fullInclude,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { created_at: 'desc' }
            }),
            prisma.materialReceipt.count({ where })
        ]);

        return { data, total };
    }
}

export const materialReceiptRepository = new MaterialReceiptRepository();
```

Jangan lupa export dari `/src/repositories/index.ts`.

---

## STEP 4: Backend — Service

**File baru**: `/src/services/material-receipt.service.ts`

Ikuti pattern dari `/src/services/purchase-order.service.ts` dan `/src/services/stock.service.ts`.

```typescript
import { Prisma, MaterialReceipt_status_enum, StockMovement_movement_type_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { materialReceiptRepository } from '../repositories/material-receipt.repository';
import { notificationRepository } from '../repositories/notification.repository';
import { BusinessRuleError, NotFoundError, ValidationError } from '../utils/errors';

export interface CreateMaterialReceiptDTO {
    id_supplier: number;
    id_factory: number;
    id_product_type: number;
    id_variety?: number;
    receipt_date: string;
    batch_code: string;
    quantity: number;
    unit_price: number;
    other_costs?: number;
    delivery_note_url?: string;
    receipt_url?: string;
    notes?: string;
    // QC data (optional, passed to quality analysis)
    moisture_value?: number;
    density_value?: number;
    quality_grade?: string;
}

export interface MarkAsPaidDTO {
    payment_reference?: string;
    payment_method?: 'CASH' | 'TRANSFER' | 'CHECK' | 'GIRO';
}

class MaterialReceiptService {

    /**
     * Operator creates receipt → status WAITING_APPROVAL, stock goes to quarantine
     */
    async create(dto: CreateMaterialReceiptDTO, userId: number): Promise<any> {
        // Validation
        if (!dto.id_supplier || !dto.id_factory || !dto.id_product_type || !dto.quantity || !dto.unit_price) {
            throw new ValidationError('Missing required fields');
        }
        if (dto.quantity <= 0) throw new ValidationError('Quantity must be positive');
        if (dto.unit_price <= 0) throw new ValidationError('Unit price must be positive');

        const totalAmount = dto.quantity * dto.unit_price + (dto.other_costs || 0);

        return await prisma.$transaction(async (tx) => {
            // 1. Generate receipt number: MR-YYYYMMDD-XXXX
            const today = new Date();
            const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
            const count = await tx.materialReceipt.count({
                where: {
                    receipt_number: { startsWith: `MR-${dateStr}` }
                }
            });
            const seq = String(count + 1).padStart(4, '0');
            const receiptNumber = `MR-${dateStr}-${seq}`;

            // 2. Get or create Stock record
            let stock = await tx.stock.findFirst({
                where: { id_factory: dto.id_factory, id_product_type: dto.id_product_type }
            });
            if (!stock) {
                const productType = await tx.productType.findUnique({ where: { id: dto.id_product_type } });
                stock = await tx.stock.create({
                    data: {
                        id_factory: dto.id_factory,
                        id_product_type: dto.id_product_type,
                        quantity: 0,
                        quarantine_quantity: 0,
                        unit: productType?.unit || 'kg'
                    }
                });
            }

            // 3. Increment quarantine_quantity (NOT quantity)
            await tx.stock.update({
                where: { id: stock.id },
                data: { quarantine_quantity: { increment: dto.quantity } }
            });

            // 4. Create StockMovement (IN) with reference_type='RAW_MATERIAL_RECEIPT'
            const movement = await tx.stockMovement.create({
                data: {
                    id_stock: stock.id,
                    id_user: userId,
                    movement_type: StockMovement_movement_type_enum.IN,
                    quantity: dto.quantity,
                    reference_type: 'RAW_MATERIAL_RECEIPT',
                    batch_code: dto.batch_code,
                    notes: JSON.stringify({
                        batchId: dto.batch_code,
                        supplier: dto.id_supplier,
                        qualityGrade: dto.quality_grade || '-',
                        moistureContent: dto.moisture_value || 0,
                        density: dto.density_value || 0,
                        pricePerKg: dto.unit_price,
                        otherCosts: dto.other_costs || 0,
                        notes: dto.notes || '',
                        deliveryNoteUrl: dto.delivery_note_url || '',
                        receiptUrl: dto.receipt_url || ''
                    })
                }
            });

            // 5. Create MaterialReceipt record
            const receipt = await tx.materialReceipt.create({
                data: {
                    receipt_number: receiptNumber,
                    id_stock_movement: movement.id,
                    id_supplier: dto.id_supplier,
                    id_factory: dto.id_factory,
                    id_user: userId,
                    id_product_type: dto.id_product_type,
                    id_variety: dto.id_variety || null,
                    receipt_date: new Date(dto.receipt_date),
                    batch_code: dto.batch_code,
                    quantity: dto.quantity,
                    unit_price: dto.unit_price,
                    other_costs: dto.other_costs || 0,
                    total_amount: totalAmount,
                    status: MaterialReceipt_status_enum.WAITING_APPROVAL,
                    delivery_note_url: dto.delivery_note_url,
                    receipt_url: dto.receipt_url,
                    notes: dto.notes
                }
            });

            // 6. Notify managers about pending approval
            const managers = await tx.user.findMany({
                where: {
                    role: { in: ['MANAGER', 'ADMIN', 'SUPERUSER'] },
                    is_active: true,
                    id_factory: dto.id_factory
                }
            });
            for (const manager of managers) {
                await tx.notification.create({
                    data: {
                        id_user: manager.id,
                        type: 'SYSTEM',
                        severity: 'INFO',
                        title: 'Penerimaan Baru Menunggu Approval',
                        message: `Receipt ${receiptNumber} (${dto.batch_code}) menunggu persetujuan Anda.`,
                        reference_type: 'MATERIAL_RECEIPT',
                        reference_id: receipt.id
                    }
                });
            }

            return receipt;
        });
    }

    /**
     * Manager approves → move quarantine to available stock, set APPROVED
     */
    async approve(id: number, userId: number): Promise<any> {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.WAITING_APPROVAL) {
            throw new BusinessRuleError(`Cannot approve receipt with status ${receipt.status}`);
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Move from quarantine to available
            const stock = await tx.stock.findFirst({
                where: { id_factory: receipt.id_factory, id_product_type: receipt.id_product_type }
            });
            if (!stock) throw new BusinessRuleError('Stock record not found');

            await tx.stock.update({
                where: { id: stock.id },
                data: {
                    quarantine_quantity: { decrement: Number(receipt.quantity) },
                    quantity: { increment: Number(receipt.quantity) }
                }
            });

            // 2. Update receipt status
            const updated = await tx.materialReceipt.update({
                where: { id },
                data: {
                    status: MaterialReceipt_status_enum.APPROVED,
                    approved_by: userId,
                    approved_at: new Date()
                }
            });

            // 3. Notify operator
            await tx.notification.create({
                data: {
                    id_user: receipt.id_user,
                    type: 'RECEIPT_APPROVED',
                    severity: 'INFO',
                    title: 'Penerimaan Disetujui',
                    message: `Receipt ${receipt.receipt_number} telah disetujui. Stok sudah tersedia untuk produksi.`,
                    reference_type: 'MATERIAL_RECEIPT',
                    reference_id: receipt.id
                }
            });

            return updated;
        });
    }

    /**
     * Accounting marks as paid
     */
    async markAsPaid(id: number, dto: MarkAsPaidDTO, userId: number): Promise<any> {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.APPROVED) {
            throw new BusinessRuleError(`Cannot mark as paid. Receipt must be APPROVED first (current: ${receipt.status})`);
        }

        const updated = await prisma.materialReceipt.update({
            where: { id },
            data: {
                status: MaterialReceipt_status_enum.PAID,
                paid_by: userId,
                paid_at: new Date(),
                payment_reference: dto.payment_reference,
                payment_method: dto.payment_method
            }
        });

        // Notify operator
        await notificationRepository.createNotification({
            id_user: receipt.id_user,
            type: 'RECEIPT_PAID',
            severity: 'INFO',
            title: 'Pembayaran Tercatat',
            message: `Receipt ${receipt.receipt_number} telah dicatat pembayarannya.`,
            reference_type: 'MATERIAL_RECEIPT',
            reference_id: receipt.id
        });

        return updated;
    }

    /**
     * Get by ID with all relations
     */
    async getById(id: number) {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        return receipt;
    }

    /**
     * List with filters and pagination
     */
    async getAll(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_supplier?: number;
        status?: string;
        start_date?: string;
        end_date?: string;
    }) {
        return await materialReceiptRepository.findWithFilters(params);
    }

    /**
     * Update receipt (only WAITING_APPROVAL)
     */
    async update(id: number, data: Partial<CreateMaterialReceiptDTO>, userId: number) {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.WAITING_APPROVAL) {
            throw new BusinessRuleError('Can only edit receipts with WAITING_APPROVAL status');
        }

        // If quantity changed, update quarantine
        if (data.quantity !== undefined && data.quantity !== Number(receipt.quantity)) {
            const diff = data.quantity - Number(receipt.quantity);
            const stock = await prisma.stock.findFirst({
                where: { id_factory: receipt.id_factory, id_product_type: receipt.id_product_type }
            });
            if (stock) {
                await prisma.stock.update({
                    where: { id: stock.id },
                    data: { quarantine_quantity: { increment: diff } }
                });
            }
            // Also update the StockMovement quantity
            await prisma.stockMovement.update({
                where: { id: receipt.id_stock_movement },
                data: { quantity: data.quantity }
            });
        }

        const totalAmount = (data.quantity || Number(receipt.quantity)) * (data.unit_price || Number(receipt.unit_price)) + (data.other_costs ?? Number(receipt.other_costs));

        return await prisma.materialReceipt.update({
            where: { id },
            data: {
                ...(data.id_supplier && { id_supplier: data.id_supplier }),
                ...(data.id_product_type && { id_product_type: data.id_product_type }),
                ...(data.id_variety !== undefined && { id_variety: data.id_variety }),
                ...(data.receipt_date && { receipt_date: new Date(data.receipt_date) }),
                ...(data.quantity && { quantity: data.quantity }),
                ...(data.unit_price && { unit_price: data.unit_price }),
                ...(data.other_costs !== undefined && { other_costs: data.other_costs }),
                total_amount: totalAmount,
                ...(data.delivery_note_url !== undefined && { delivery_note_url: data.delivery_note_url }),
                ...(data.receipt_url !== undefined && { receipt_url: data.receipt_url }),
                ...(data.notes !== undefined && { notes: data.notes })
            }
        });
    }

    /**
     * Delete receipt (only WAITING_APPROVAL, reverses quarantine)
     */
    async delete(id: number) {
        const receipt = await materialReceiptRepository.findById(id);
        if (!receipt) throw new NotFoundError('MaterialReceipt', id);
        if (receipt.status !== MaterialReceipt_status_enum.WAITING_APPROVAL) {
            throw new BusinessRuleError('Can only delete receipts with WAITING_APPROVAL status');
        }

        return await prisma.$transaction(async (tx) => {
            // 1. Reverse quarantine stock
            const stock = await tx.stock.findFirst({
                where: { id_factory: receipt.id_factory, id_product_type: receipt.id_product_type }
            });
            if (stock) {
                await tx.stock.update({
                    where: { id: stock.id },
                    data: { quarantine_quantity: { decrement: Number(receipt.quantity) } }
                });
            }

            // 2. Delete related QualityAnalysis if exists
            await tx.rawMaterialQualityAnalysis.deleteMany({
                where: { id_stock_movement: receipt.id_stock_movement }
            });

            // 3. Delete the MaterialReceipt
            await tx.materialReceipt.delete({ where: { id } });

            // 4. Delete the StockMovement
            await tx.stockMovement.delete({ where: { id: receipt.id_stock_movement } });

            return true;
        });
    }
}

export const materialReceiptService = new MaterialReceiptService();
```

Export dari `/src/services/index.ts`.

---

## STEP 5: Backend — PDF Generation (Digital Stamp)

**File**: `/src/services/pdf.service.ts`

Tambahkan method `generateReceiptPDF(receiptId: number)` ke class `PDFService` yang sudah ada. Ikuti pattern dari `generateInvoicePDF()` (baris 37-307).

Method ini harus:
1. Query `MaterialReceipt` dengan semua relasi (Supplier, Factory, ProductType, User, Approver, PaidByUser)
2. Query `RawMaterialQualityAnalysis` via `id_stock_movement`
3. Generate PDF A4 dengan PDFKit (sudah installed, `import PDFDocument from 'pdfkit'`)
4. Layout:
   - Header: "TANDA TERIMA BAHAN BAKU" + "Pangan Masa Depan"
   - Info: Receipt number, batch code, receipt date, supplier name+phone, factory name
   - Detail table: Product type, variety, grade, moisture%, weight, unit price, total
   - QC section: Moisture grade, density grade, color grade, final grade (jika ada)
   - Payment section (jika PAID): Payment date, method, reference
   - Signature lines: Admin Gudang, Sopir/Pengantar, Mengetahui
   - Footer: Print timestamp
5. **Digital Stamp** (jika status APPROVED atau PAID):
   - Rounded rectangle stamp di kanan atas halaman (x: ~380, y: ~40, w: ~170, h: ~60)
   - Border color: hijau (#22c55e) untuk APPROVED, biru (#3b82f6) untuk PAID
   - Text besar: "APPROVED" atau "PAID"
   - Text kecil: "Oleh: {approver_fullname}" + "Tgl: {approved_at formatted}"
   - Diagonal watermark di tengah halaman: text besar semi-transparan (opacity 0.08), rotated 45 derajat

PDFKit drawing reference untuk stamp:
```typescript
// Stamp box
doc.save();
doc.roundedRect(380, 40, 170, 60, 5).lineWidth(2).strokeColor('#22c55e').stroke();
doc.fontSize(18).font('Helvetica-Bold').fillColor('#22c55e').text('APPROVED', 390, 48, { width: 150, align: 'center' });
doc.fontSize(7).font('Helvetica').fillColor('#666666').text(`Oleh: ${approverName}`, 390, 70, { width: 150, align: 'center' });
doc.fontSize(7).text(`Tgl: ${formatDate(approvedAt)}`, 390, 82, { width: 150, align: 'center' });
doc.restore();

// Diagonal watermark
doc.save();
doc.opacity(0.08);
doc.fontSize(80).font('Helvetica-Bold').fillColor('#000000');
doc.translate(300, 500).rotate(-45, { origin: [0, 0] });
doc.text('APPROVED', -200, -40);
doc.restore();
```

---

## STEP 6: Backend — API Type Definitions

Buat file type definitions di `/types/api/`. Ikuti pattern dari `/types/api/T_approvePurchaseOrder.ts` dan `/types/api/T_createGoodsReceipt.ts`.

### 6a. `/types/api/T_createMaterialReceipt.ts`
```typescript
import { Response } from "express";
import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class T_createMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_createMaterialReceipt_body {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id_supplier!: number;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id_factory!: number;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id_product_type!: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() id_variety?: number;
    @IsNotEmpty() @IsString() receipt_date!: string;
    @IsNotEmpty() @IsString() batch_code!: string;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() quantity!: number;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() unit_price!: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : 0) @IsNumber() other_costs?: number;
    @IsOptional() @IsString() delivery_note_url?: string;
    @IsOptional() @IsString() receipt_url?: string;
    @IsOptional() @IsString() notes?: string;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) moisture_value?: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) density_value?: number;
    @IsOptional() @IsString() quality_grade?: string;
}

export type T_createMaterialReceipt = (request: { headers: T_createMaterialReceipt_headers; body: T_createMaterialReceipt_body }, response: Response) => Promise<any>;
export const method = 'post';
export const url_path = '/material-receipts';
export const alias = 'T_createMaterialReceipt';
export const is_streaming = false;
```

### 6b. `/types/api/T_getMaterialReceipts.ts`
- Method: GET, URL: `/material-receipts`
- Query params: `limit`, `offset`, `id_factory`, `id_supplier`, `status`, `start_date`, `end_date`
- Semua optional

### 6c. `/types/api/T_getMaterialReceipt.ts`
- Method: GET, URL: `/material-receipts/:id`
- Path param: `id` (number)

### 6d. `/types/api/T_updateMaterialReceipt.ts`
- Method: PUT, URL: `/material-receipts/:id`
- Same body as create, semua field optional

### 6e. `/types/api/T_deleteMaterialReceipt.ts`
- Method: DELETE, URL: `/material-receipts/:id`

### 6f. `/types/api/T_approveMaterialReceipt.ts`
- Method: POST, URL: `/material-receipts/:id/approve`
- No body, hanya headers (auth) + path (id)

### 6g. `/types/api/T_payMaterialReceipt.ts`
- Method: POST, URL: `/material-receipts/:id/pay`
- Body: `payment_reference` (optional string), `payment_method` (optional enum)

### 6h. `/types/api/T_getMaterialReceiptPdf.ts`
- Method: GET, URL: `/material-receipts/:id/pdf`
- Path param: `id` (number)

---

## STEP 7: Backend — Implementation Handlers

Buat file implementation di `/implementation/`. Ikuti pattern dari `/implementation/T_approvePurchaseOrder.ts` dan `/implementation/T_createGoodsReceipt.ts`.

### 7a. `/implementation/T_createMaterialReceipt.ts`
```typescript
import { T_createMaterialReceipt } from "../types/api/T_createMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_createMaterialReceipt: T_createMaterialReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'OPERATOR');
    const result = await materialReceiptService.create(req.body, user.id);
    return result;
});
```

### 7b. `/implementation/T_getMaterialReceipts.ts`
- `requireAuth(req, 'OPERATOR')`
- Call `materialReceiptService.getAll(req.query)`

### 7c. `/implementation/T_getMaterialReceipt.ts`
- `requireAuth(req, 'OPERATOR')`
- Call `materialReceiptService.getById(Number(req.path.id))`

### 7d. `/implementation/T_updateMaterialReceipt.ts`
- `requireAuth(req, 'OPERATOR')`
- Call `materialReceiptService.update(Number(req.path.id), req.body, user.id)`

### 7e. `/implementation/T_deleteMaterialReceipt.ts`
- `requireAuth(req, 'SUPERVISOR')`
- Call `materialReceiptService.delete(Number(req.path.id))`

### 7f. `/implementation/T_approveMaterialReceipt.ts`
```typescript
import { T_approveMaterialReceipt } from "../types/api/T_approveMaterialReceipt";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { materialReceiptService } from "../src/services/material-receipt.service";

export const t_approveMaterialReceipt: T_approveMaterialReceipt = apiWrapper(async (req, res) => {
    const user = await requireAuth(req, 'MANAGER');
    const result = await materialReceiptService.approve(Number(req.path.id), user.id);
    return result;
});
```

### 7g. `/implementation/T_payMaterialReceipt.ts`
- Validasi role: `user.role === 'ACCOUNTING' || user.role === 'ADMIN' || user.role === 'SUPERUSER'`
- Jika tidak, throw ForbiddenError
- Call `materialReceiptService.markAsPaid(Number(req.path.id), req.body, user.id)`

### 7h. `/implementation/T_getMaterialReceiptPdf.ts`
- `requireAuth(req, 'OPERATOR')`
- Call `pdfService.generateReceiptPDF(Number(req.path.id))`
- Set `res.setHeader('Content-Type', 'application/pdf')`, `res.setHeader('Content-Disposition', ...)`
- Send buffer

---

## STEP 8: Frontend — API Client

**File**: `/frontend/src/services/api.ts`

Tambahkan setelah `stockApi` object (baris ~97):

```typescript
// Material Receipts
export const materialReceiptApi = {
    getAll: (params?: Record<string, any>) => api.get('/material-receipts', { params }),
    getById: (id: number) => api.get(`/material-receipts/${id}`),
    create: (data: Record<string, any>) => api.post('/material-receipts', data),
    update: (id: number, data: Record<string, any>) => api.put(`/material-receipts/${id}`, data),
    delete: (id: number) => api.delete(`/material-receipts/${id}`),
    approve: (id: number) => api.post(`/material-receipts/${id}/approve`),
    markAsPaid: (id: number, data: Record<string, any>) => api.post(`/material-receipts/${id}/pay`, data),
    downloadPdf: (id: number) => api.get(`/material-receipts/${id}/pdf`, { responseType: 'blob' }),
};
```

---

## STEP 9: Frontend — Update RawMaterialReceipt Page

**File**: `/frontend/src/pages/production/RawMaterialReceipt.tsx`

Ini adalah perubahan terbesar. Perubahan utama:

### 9a. Import `materialReceiptApi` dan tambah state baru

```typescript
import { materialReceiptApi } from '../../services/api';
// Tambah state:
const [statusFilter, setStatusFilter] = useState<string>('');
const [showPaymentModal, setShowPaymentModal] = useState<number | null>(null); // receipt id
```

### 9b. Update interface `RawMaterialBatch` — tambah status fields

```typescript
interface RawMaterialBatch {
    // ... existing fields ...
    status: 'WAITING_APPROVAL' | 'APPROVED' | 'PAID';
    approvedBy?: string;
    approvedAt?: string;
    paidAt?: string;
    paymentReference?: string;
    paymentMethod?: string;
    receiptNumber: string;
}
```

### 9c. Update `fetchData()` — ganti dari `/stock-movements` ke `materialReceiptApi`

Ganti `api.get('/stock-movements', ...)` (baris 166-173) dengan `materialReceiptApi.getAll(...)`.
Map response ke RawMaterialBatch format yang sudah ada + field baru.

### 9d. Update `handleSave()` — ganti dari `api.post('/stock-movements', ...)` ke `materialReceiptApi.create(...)`

Ubah payload dari (baris 391-398):
```typescript
// LAMA:
const payload = { id_stock: targetStock.id, id_user: user?.id, movement_type: 'IN', quantity, reference_type: 'RAW_MATERIAL_RECEIPT', ... };
await api.post('/stock-movements', payload);
```
Menjadi:
```typescript
// BARU:
const payload = {
    id_supplier: parseInt(formData.supplierId),
    id_factory: selectedFactory,
    id_product_type: matchedProductType.id,
    id_variety: formData.varietyId ? parseInt(formData.varietyId) : undefined,
    receipt_date: formData.dateReceived,
    batch_code: formData.batchId,
    quantity: parseFloat(formData.netWeight),
    unit_price: parseFloat(formData.pricePerKg),
    other_costs: parseFloat(formData.otherCosts || '0'),
    delivery_note_url: deliveryNoteUrl || undefined,
    receipt_url: receiptUrl || undefined,
    notes: formData.notes,
    moisture_value: parseFloat(formData.moistureContent) || undefined,
    density_value: parseFloat(formData.density) || undefined,
    quality_grade: formData.qualityGrade !== '-' ? formData.qualityGrade : undefined,
};
await materialReceiptApi.create(payload);
```

### 9e. Tambah kolom "Status" di tabel (baris ~912, setelah header `<th>Total Biaya</th>`)

```tsx
<th>Status</th>
```

Dan di row (baris ~940, setelah Total Biaya td):
```tsx
<td>
    <span className={`badge ${
        batch.status === 'WAITING_APPROVAL' ? 'badge-warning' :
        batch.status === 'APPROVED' ? 'badge-success' :
        'badge-info'
    }`}>
        {batch.status === 'WAITING_APPROVAL' ? 'Menunggu Approval' :
         batch.status === 'APPROVED' ? 'Disetujui' : 'Lunas'}
    </span>
</td>
```

### 9f. Update action buttons berdasarkan status (baris ~942-976)

```tsx
<td style={{ textAlign: 'right' }}>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        {/* Download PDF — always available */}
        <button className="btn btn-ghost btn-sm" onClick={() => handleDownloadPdf(batch)} title="Download PDF">
            <span className="material-symbols-outlined icon-sm">picture_as_pdf</span>
        </button>
        {/* Print — always available */}
        <button className="btn btn-ghost btn-sm" onClick={() => handlePrint(batch)} title="Cetak">
            <span className="material-symbols-outlined icon-sm">print</span>
        </button>
        {/* Approve — only WAITING_APPROVAL, only MANAGER+ */}
        {batch.status === 'WAITING_APPROVAL' && user && ['MANAGER', 'ADMIN', 'SUPERUSER'].includes(user.role) && (
            <button className="btn btn-success btn-sm" onClick={() => handleApprove(batch.id)} title="Approve">
                <span className="material-symbols-outlined icon-sm">check_circle</span>
            </button>
        )}
        {/* Mark as Paid — only APPROVED, only ACCOUNTING/ADMIN/SUPERUSER */}
        {batch.status === 'APPROVED' && user && ['ACCOUNTING', 'ADMIN', 'SUPERUSER'].includes(user.role) && (
            <button className="btn btn-info btn-sm" onClick={() => setShowPaymentModal(batch.id)} title="Catat Pembayaran">
                <span className="material-symbols-outlined icon-sm">payments</span>
            </button>
        )}
        {/* Edit — only WAITING_APPROVAL */}
        {batch.status === 'WAITING_APPROVAL' && (
            <button className="btn btn-ghost btn-sm" onClick={() => handleEdit(batch)}>
                <span className="material-symbols-outlined icon-sm">edit</span>
            </button>
        )}
        {/* Delete — only WAITING_APPROVAL */}
        {batch.status === 'WAITING_APPROVAL' && (
            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(batch.id)}>
                <span className="material-symbols-outlined icon-sm" style={{ color: 'var(--error)' }}>delete</span>
            </button>
        )}
    </div>
</td>
```

### 9g. Tambah handler `handleApprove` dan `handleDownloadPdf`

```typescript
const handleApprove = async (id: number) => {
    if (!confirm('Setujui penerimaan ini? Stok akan dilepas dari karantina dan tersedia untuk produksi.')) return;
    try {
        await materialReceiptApi.approve(id);
        showSuccess('Berhasil', 'Penerimaan berhasil disetujui');
        fetchData();
    } catch (error: any) {
        showError('Gagal', error.response?.data?.error?.message || error.message);
    }
};

const handleDownloadPdf = async (batch: RawMaterialBatch) => {
    try {
        const response = await materialReceiptApi.downloadPdf(batch.id);
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${batch.receiptNumber || batch.batchId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error: any) {
        showError('Gagal', 'Gagal download PDF');
    }
};
```

### 9h. Tambah filter status di atas tabel

Sebelum tabel (baris ~898, di dalam card-header), tambahkan dropdown filter:
```tsx
<div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <h3 className="card-title">Riwayat Penerimaan</h3>
    <select className="form-input form-select" style={{ width: 200 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
        <option value="">Semua Status</option>
        <option value="WAITING_APPROVAL">Menunggu Approval</option>
        <option value="APPROVED">Disetujui</option>
        <option value="PAID">Lunas</option>
    </select>
</div>
```

### 9i. Update `handleDelete` — ganti ke `materialReceiptApi.delete(id)`

---

## STEP 10: Frontend — Payment Modal Component

**File baru**: `/frontend/src/components/Production/PaymentModal.tsx`

```tsx
import { useState } from 'react';
import { materialReceiptApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface PaymentModalProps {
    receiptId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const PaymentModal = ({ receiptId, onClose, onSuccess }: PaymentModalProps) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        payment_method: 'TRANSFER',
        payment_reference: ''
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await materialReceiptApi.markAsPaid(receiptId, formData);
            showSuccess('Berhasil', 'Pembayaran berhasil dicatat');
            onSuccess();
            onClose();
        } catch (error: any) {
            showError('Gagal', error.response?.data?.error?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header"><h3>Catat Pembayaran</h3></div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Metode Pembayaran</label>
                        <select className="form-input form-select" value={formData.payment_method}
                            onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                            <option value="CASH">Tunai</option>
                            <option value="TRANSFER">Transfer Bank</option>
                            <option value="CHECK">Cek</option>
                            <option value="GIRO">Giro</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nomor Referensi</label>
                        <input type="text" className="form-input" placeholder="Nomor transfer/cek/giro..."
                            value={formData.payment_reference}
                            onChange={e => setFormData({ ...formData, payment_reference: e.target.value })} />
                    </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
```

Import dan render di RawMaterialReceipt.tsx:
```tsx
{showPaymentModal && (
    <PaymentModal
        receiptId={showPaymentModal}
        onClose={() => setShowPaymentModal(null)}
        onSuccess={fetchData}
    />
)}
```

---

## STEP 11: Frontend — Update Stocks Page (Quarantine Column)

**File**: `/frontend/src/pages/production/Stocks.tsx`

1. Tambah kolom "Karantina" di tabel stok setelah "Stok Tersedia"
2. Tampilkan `quarantine_quantity` dari API response
3. Gunakan warna kuning/warning untuk quarantine > 0:
```tsx
<td>
    {stock.quarantine_quantity > 0 ? (
        <span className="badge badge-warning">{formatNumber(stock.quarantine_quantity)} {stock.unit}</span>
    ) : (
        <span style={{ color: 'var(--text-muted)' }}>-</span>
    )}
</td>
```

---

## STEP 12: Frontend — Update Sidebar for ACCOUNTING Role

**File**: `/frontend/src/components/Layout/Sidebar.tsx`

Saat ini sidebar menampilkan "Admin Panel" hanya untuk `ADMIN`/`SUPERUSER` (baris 56-62). Pastikan role `ACCOUNTING` dapat melihat menu "Penerimaan Bahan" di bawah Produksi (sudah visible untuk semua role). Tidak perlu menu khusus baru karena ACCOUNTING menggunakan halaman yang sama, hanya action buttons berbeda.

---

## Urutan Eksekusi

1. **STEP 1**: Schema Prisma + migration
2. **STEP 2**: Update role hierarchy
3. **STEP 3**: Repository baru
4. **STEP 4**: Service baru
5. **STEP 5**: PDF generation + digital stamp
6. **STEP 6**: API type definitions
7. **STEP 7**: Implementation handlers
8. **STEP 8**: Frontend API client
9. **STEP 9**: Update RawMaterialReceipt page
10. **STEP 10**: Payment modal component
11. **STEP 11**: Update Stocks page
12. **STEP 12**: Update Sidebar (jika perlu)

---

## Verifikasi

1. **Database**: Run `npx prisma migrate dev`, pastikan tabel `MaterialReceipt` terbuat, field `quarantine_quantity` ada di `Stock`, enum baru ada
2. **Create Receipt**: POST `/material-receipts` → status WAITING_APPROVAL, `Stock.quarantine_quantity` bertambah, `Stock.quantity` tidak berubah
3. **Approve**: POST `/material-receipts/:id/approve` → status APPROVED, `quarantine_quantity` berkurang, `quantity` bertambah
4. **Mark Paid**: POST `/material-receipts/:id/pay` → status PAID
5. **PDF**: GET `/material-receipts/:id/pdf` → PDF dengan digital stamp (APPROVED/PAID) + data QC
6. **Role Access**: OPERATOR bisa create tapi tidak bisa approve/pay, MANAGER bisa approve, ACCOUNTING bisa pay
7. **Stock Protection**: Worksheet/production tidak bisa menggunakan quarantine stock (hanya baca `quantity`)
8. **Frontend**: Status badge tampil, action buttons sesuai role dan status, filter status berfungsi
