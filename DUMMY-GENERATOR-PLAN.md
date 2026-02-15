# Plan: Perbaikan Dummy Generator + Hapus Dummy + Hard Reset

## Context & Bug Report

Fungsi dummy data generator di `DummyService` (`src/services/dummy.service.ts`) punya banyak masalah:

1. **Dead code**: `implementation/data/dummyData.ts` export data tapi **tidak dipakai** oleh `DummyService` — file ini juga import `Employee_gender_enum` yang mungkin sudah tidak ada
2. **Hanya PMD-1**: Tidak generate data untuk PMD 2
3. **Double stock update**: `setStock()` line 283 memanggil `createMovement()` (yang sudah `stock.update` di line 316-323), lalu `setStock()` line 285-288 melakukan `stock.update` LAGI — hasilnya benar tapi logika salah
4. **Type mismatch**: `T_generateDummy.ts` line 18 punya field `schedules` tapi service TIDAK return field ini. Sama di `T_resetDummy.ts`
5. **Info text salah**: Settings.tsx line 300 bilang "Membuat sample Karyawan, Pelanggan" tapi generate tidak membuat data tersebut
6. **Tidak ada Sales/Purchasing dummy**: Customer, Invoice, Payment, Supplier, PO, GoodsReceipt kosong
7. **Reset terlalu agresif**: `resetAll()` hapus SEMUA data tanpa bisa bedakan dummy vs real
8. **reference_id: 0**: `setStock()` line 283 pass `reference_id: 0` ke stock movement — bukan valid FK
9. **Tidak ada Hard Reset**: Tidak ada opsi reset total termasuk master data

### Dampak
- Dashboard kosong untuk PMD 2 (tidak ada dummy data)
- Tidak bisa test flow Sales & Purchasing
- Reset data menghapus semua data termasuk yang real
- Type errors di-silent oleh `any` cast

---

## Yang Diminta User

1. **Fix dummy generator**: Multi-factory, sesuai alur produksi PMD 1 & PMD 2, termasuk Sales & Purchasing
2. **Hapus dummy**: Hapus HANYA data yang di-generate (tagging system)
3. **Hard reset**: Hapus SEMUA data transaksional + master data (kecuali User & Factory), dengan double confirmation

---

## Tagging Strategy — Membedakan Dummy vs Real Data

Untuk bisa "hapus dummy saja", setiap record dummy **WAJIB** ditandai:

| Model | Field | Tag |
|-------|-------|-----|
| Worksheet | `notes` | `[DUMMY] Auto-generated worksheet` |
| StockMovement | `notes` | `[DUMMY] Auto-generated movement` |
| Maintenance | `description` | `[DUMMY] Routine check` |
| Invoice | `notes` | `[DUMMY] Auto-generated invoice` |
| PurchaseOrder | `notes` | `[DUMMY] Auto-generated PO` |
| Customer | `code` | prefix `CUST-DUMMY-001`, `CUST-DUMMY-002`, dst |
| Supplier | `code` | prefix `SUP-DUMMY-001`, `SUP-DUMMY-002`, dst |

> **PENTING**: Semua helper functions yang create data dummy HARUS include tag ini. Tanpa tag, `deleteDummy()` tidak bisa identify dan hapus data tersebut.

---

## Alur Produksi Dummy yang Benar

### PMD 1 — Penggilingan (hanya sampai PK/Glosor)
```
Input: GKP (Gabah Kering Panen) — dari supplier/penerimaan
  ↓ [Dryer]
Output: GKG (Gabah Kering Giling) — intermediate
  ↓ [Husker]
Output: PK (Pecah Kulit) / Glosor (Medium) — final output PMD 1
Side products: SKM (Sekam), DDK (Dedak)

NOTE: PMD 1 TIDAK memproses lebih lanjut.
Stok PK/Glosor bisa DIJUAL LANGSUNG dari PMD 1 (via Invoice)
ATAU di-TRANSFER ke PMD 2 untuk finishing.
Transfer bersifat on-demand, TIDAK otomatis.
```

### PMD 2 — Finishing (PK/Glosor → Beras Akhir)
```
Input: PK / Glosor — ditransfer dari PMD 1
  ↓ [Polisher Batu] → [Polisher Kebi] → [Sorter] → [Grader]
Output: BRS-MS (Beras Medium/Super), BRS-P (Beras Premium)
Side products: MNR (Menir)
```

### ProductTypes Lengkap

| Code | Name | Dipakai di Factory | Peran |
|------|------|--------------------|-------|
| GKP | Gabah Kering Panen | PMD 1 | Input |
| GKG | Gabah Kering Giling | PMD 1 | Intermediate |
| PK | Pecah Kulit | PMD 1 (output) → PMD P (input) | Transfer |
| GLO | Glosor | PMD 1 (output alt) → PMD P (input alt) | Transfer |
| BRS-MS | Beras Medium/Super | PMD P | Output |
| BRS-P | Beras Premium | PMD P | Output |
| SKM | Sekam | PMD 1 | Side product |
| DDK | Dedak | PMD 1 | Side product |
| MNR | Menir | PMD P | Side product |

### Machines per Factory

| Code | Name | Factory | Type |
|------|------|---------| -----|
| MSN-DRY-01 | Dryer A | PMD 1 | Dryer |
| MSN-HSK-01 | Husker A | PMD 1 | Husker |
| MSN-PLB-01 | Polisher Batu A | PMD P | Polisher |
| MSN-PLK-01 | Polisher Kebi A | PMD P | Polisher |
| MSN-SRT-01 | Sorter A | PMD P | Sorter |
| MSN-GRD-01 | Grader A | PMD P | Grader |

### OutputProducts per Factory

| Code | Name | Factory |
|------|------|---------|
| PK | Pecah Kulit | PMD 1 |
| GLO | Glosor | PMD 1 |
| BRS-MS | Beras Medium/Super | PMD P |
| BRS-P | Beras Premium | PMD P |

### Dummy Sales Data (3 Customers)

| Code | Name | Alamat |
|------|------|--------|
| CUST-DUMMY-001 | Toko Beras Makmur | Pasar Induk, Jakarta |
| CUST-DUMMY-002 | CV Pangan Sejahtera | Jl. Gatot Subroto, Jakarta |
| CUST-DUMMY-003 | Warung Bu Siti | Desa Sukamaju, Karawang |

Generate 5-10 invoices (mix DRAFT/SENT/PAID status) per factory, masing-masing 1-3 invoice items (BRS-MS, BRS-P), beberapa dengan Payment.

### Dummy Purchasing Data (3 Suppliers)

| Code | Name | PIC |
|------|------|-----|
| SUP-DUMMY-001 | UD Padi Jaya | Cahyo |
| SUP-DUMMY-002 | PT Gabah Nusantara | Slamet |
| SUP-DUMMY-003 | CV Tani Makmur | Wati |

Generate 5-10 POs (mix DRAFT/APPROVED/RECEIVED status) per factory PMD 1, item GKP, beberapa dengan GoodsReceipt.

---

## Task yang Harus Dikerjakan

### Task 1: Rewrite `DummyService.generateAll()` (CRITICAL)

**File**: `src/services/dummy.service.ts`

**Rewrite total**. Struktur baru:

```typescript
import { prisma } from "../libs/prisma";
import {
    Worksheet_shift_enum,
    StockMovement_movement_type_enum,
    Maintenance_maintenance_type_enum,
    Machine_status_enum
} from "@prisma/client";

export class DummyService {
    private static DUMMY_TAG = '[DUMMY]';
    private static DUMMY_SUPPLIER_PREFIX = 'SUP-DUMMY';
    private static DUMMY_CUSTOMER_PREFIX = 'CUST-DUMMY';

    /**
     * Generate complete dummy data — multi-factory
     */
    static async generateAll(): Promise<{ status: string; created: any }> {
        return await prisma.$transaction(async (tx) => {
            console.log("Starting Dummy Data Generation...");

            const stats = {
                products: 0,
                inventory: 0,
                worksheets: 0,
                transactions: 0,
                machine_logs: 0,
                sales: 0,
                purchasing: 0
            };

            const user = await this.ensureUser(tx);

            // 1. Ensure both factories
            const pmd1 = await this.ensureFactory(tx, 'PMD-1', 'PMD 1 - Penggilingan', 'Jl. Raya Padi No.1, Karawang');
            const pmd2 = await this.ensureFactory(tx, 'PMD-2', 'PMD 2 - Finishing', 'Jl. Raya Beras No.2, Karawang');

            // 2. Ensure ProductTypes
            const productTypes = await this.ensureProductTypes(tx);
            stats.products = Object.keys(productTypes).length;

            // 3. Ensure Machines per factory
            await this.ensureMachines(tx, pmd1, pmd2);

            // 4. Ensure OutputProducts per factory
            await this.ensureOutputProducts(tx, pmd1, pmd2);

            // 5. Ensure Raw Material master data (categories + varieties)
            await this.ensureRawMaterialData(tx);

            // 6. Ensure Stocks per factory per relevant product type
            await this.ensureStocks(tx, pmd1, pmd2, productTypes);

            // 7. Set initial stocks (FIXED: single stock update)
            await this.setInitialStocks(tx, pmd1, pmd2, productTypes, user);
            stats.inventory = await tx.stock.count();

            // 8. Generate Worksheets + StockMovements (7 hari lalu + 3 hari depan)
            const wsStats = await this.generateWorksheets(tx, pmd1, pmd2, productTypes, user);
            stats.worksheets = wsStats.worksheets;
            stats.transactions = wsStats.movements;

            // 9. Generate Maintenance
            stats.machine_logs = await this.generateMaintenance(tx, pmd1, pmd2, user);

            // 10. Generate Sales dummy
            stats.sales = await this.generateSalesData(tx, pmd1, pmd2, productTypes, user);

            // 11. Generate Purchasing dummy
            stats.purchasing = await this.generatePurchasingData(tx, pmd1, pmd2, productTypes, user);

            console.log("Dummy Generation Complete", stats);
            return { status: "success", created: stats };
        }, { timeout: 30000 });
    }
```

**Helper methods yang HARUS diimplementasi:**

#### `ensureFactory(tx, code, name, address)`
```typescript
private static async ensureFactory(tx: any, code: string, name: string, address: string) {
    let factory = await tx.factory.findFirst({ where: { code } });
    if (!factory) {
        factory = await tx.factory.create({
            data: { code, name, address, is_active: true }
        });
    }
    return factory;
}
```

#### `ensureProductTypes(tx)`
Return object `{ GKP, GKG, PK, GLO, BRS_MS, BRS_P, SKM, DDK, MNR }` — findOrCreate each.
```typescript
private static async ensureProductTypes(tx: any) {
    const types = [
        { code: "GKP", name: "Gabah Kering Panen", unit: "kg" },
        { code: "GKG", name: "Gabah Kering Giling", unit: "kg" },
        { code: "PK", name: "Pecah Kulit", unit: "kg" },
        { code: "GLO", name: "Glosor", unit: "kg" },
        { code: "BRS-MS", name: "Beras Medium/Super", unit: "kg" },
        { code: "BRS-P", name: "Beras Premium", unit: "kg" },
        { code: "SKM", name: "Sekam", unit: "kg" },
        { code: "DDK", name: "Dedak", unit: "kg" },
        { code: "MNR", name: "Menir", unit: "kg" }
    ];
    const result: Record<string, any> = {};
    for (const t of types) {
        let pt = await tx.productType.findFirst({ where: { code: t.code } });
        if (!pt) pt = await tx.productType.create({ data: t });
        result[t.code.replace('-', '_')] = pt;
    }
    return result;
}
```

#### `ensureMachines(tx, pmd1, pmd2)`
Create machines per factory (lihat tabel Machines di atas). Pattern:
```typescript
const machines = [
    { code: "MSN-DRY-01", name: "Dryer A", machine_type: "Dryer", factory: pmd1 },
    { code: "MSN-HSK-01", name: "Husker A", machine_type: "Husker", factory: pmd1 },
    { code: "MSN-PLB-01", name: "Polisher Batu A", machine_type: "Polisher", factory: pmd2 },
    { code: "MSN-PLK-01", name: "Polisher Kebi A", machine_type: "Polisher", factory: pmd2 },
    { code: "MSN-SRT-01", name: "Sorter A", machine_type: "Sorter", factory: pmd2 },
    { code: "MSN-GRD-01", name: "Grader A", machine_type: "Grader", factory: pmd2 },
];
for (const m of machines) {
    const exists = await tx.machine.findFirst({ where: { code: m.code } });
    if (!exists) {
        await tx.machine.create({
            data: {
                code: m.code, name: m.name, machine_type: m.machine_type,
                id_factory: m.factory.id, status: Machine_status_enum.ACTIVE,
                serial_number: `SN-${m.code}`, manufacture_year: 2023,
                capacity_per_hour: 2000, purchase_date: new Date()
            }
        });
    }
}
```

#### `ensureOutputProducts(tx, pmd1, pmd2)`
```typescript
const outputs = [
    { code: 'PK', name: 'Pecah Kulit', factory: pmd1, order: 1 },
    { code: 'GLO', name: 'Glosor', factory: pmd1, order: 2 },
    { code: 'BRS-MS', name: 'Beras Medium/Super', factory: pmd2, order: 1 },
    { code: 'BRS-P', name: 'Beras Premium', factory: pmd2, order: 2 },
];
for (const o of outputs) {
    const exists = await tx.outputProduct.findFirst({
        where: { code: o.code, id_factory: o.factory.id }
    });
    if (!exists) {
        await tx.outputProduct.create({
            data: {
                code: o.code, name: o.name, id_factory: o.factory.id,
                is_active: true, display_order: o.order
            }
        });
    }
}
```

#### `ensureRawMaterialData(tx)`
```typescript
// Categories
const cats = [
    { code: 'PADI', name: 'Padi/Gabah' },
    { code: 'PK', name: 'Pecah Kulit' }
];
for (const c of cats) {
    const exists = await tx.rawMaterialCategory.findFirst({ where: { code: c.code } });
    if (!exists) await tx.rawMaterialCategory.create({ data: { ...c, is_active: true } });
}
// Varieties
const vars = [
    { code: 'IR64', name: 'IR 64' },
    { code: 'CIHERANG', name: 'Ciherang' },
    { code: 'INPARI', name: 'Inpari 32' }
];
for (const v of vars) {
    const exists = await tx.rawMaterialVariety.findFirst({ where: { code: v.code } });
    if (!exists) await tx.rawMaterialVariety.create({ data: { ...v, is_active: true } });
}
```

#### `ensureStocks(tx, pmd1, pmd2, productTypes)`
Create Stock entries — PMD 1 butuh stock GKP/GKG/PK/GLO/SKM/DDK, PMD P butuh stock PK/GLO/BRS-MS/BRS-P/MNR:
```typescript
const stockMap = [
    { factory: pmd1, types: ['GKP', 'GKG', 'PK', 'GLO', 'SKM', 'DDK'] },
    { factory: pmd2, types: ['PK', 'GLO', 'BRS_MS', 'BRS_P', 'MNR'] },
];
for (const sm of stockMap) {
    for (const typeKey of sm.types) {
        const pt = productTypes[typeKey];
        if (!pt) continue;
        const exists = await tx.stock.findFirst({
            where: { id_factory: sm.factory.id, id_product_type: pt.id }
        });
        if (!exists) {
            await tx.stock.create({
                data: { id_factory: sm.factory.id, id_product_type: pt.id, quantity: 0, unit: pt.unit }
            });
        }
    }
}
```

#### `setInitialStocks(tx, pmd1, pmd2, productTypes, user)` — FIXED
```typescript
// PMD 1: Gabah 50.000 kg, GKG 10.000 kg
// PMD 2: PK 15.000 kg, Beras Premium 5.000 kg, Beras MS 8.000 kg
const initialStocks = [
    { factory: pmd1, typeKey: 'GKP', qty: 50000 },
    { factory: pmd1, typeKey: 'GKG', qty: 10000 },
    { factory: pmd2, typeKey: 'PK', qty: 15000 },
    { factory: pmd2, typeKey: 'BRS_P', qty: 5000 },
    { factory: pmd2, typeKey: 'BRS_MS', qty: 8000 },
];
for (const is of initialStocks) {
    const pt = productTypes[is.typeKey];
    if (!pt) continue;
    const stock = await tx.stock.findFirst({
        where: { id_factory: is.factory.id, id_product_type: pt.id }
    });
    if (stock && Number(stock.quantity) === 0) {
        // FIXED: Only createMovement — it already updates stock.quantity
        await this.createMovement(
            tx, stock, user, StockMovement_movement_type_enum.IN,
            is.qty, "ADJUSTMENT", stock.id, new Date(),
            `${this.DUMMY_TAG} Initial Stock ${pt.code}`
        );
    }
}
```

#### `createMovement(tx, ...)` — FIXED (single stock update)
```typescript
private static async createMovement(
    tx: any, stock: any, user: any,
    type: StockMovement_movement_type_enum,
    qty: number, refType: string, refId: number | bigint,
    date: Date, note?: string
) {
    await tx.stockMovement.create({
        data: {
            id_stock: stock.id,
            id_user: user.id,
            movement_type: type,
            quantity: qty,
            reference_type: refType,
            reference_id: refId,
            created_at: date,
            notes: note || `${this.DUMMY_TAG} Auto-generated`
        }
    });
    // SINGLE stock update — sebelumnya ada double update di setStock()
    await tx.stock.update({
        where: { id: stock.id },
        data: {
            quantity: type === StockMovement_movement_type_enum.IN
                ? { increment: qty }
                : { decrement: qty }
        }
    });
}
```

#### `generateWorksheets(tx, pmd1, pmd2, productTypes, user)`
Loop 10 hari (6 past + today + 3 future), skip Sunday, 2 shifts per day:

**PMD 1 Worksheet (per shift):**
```typescript
const inputGabah = 5000 + Math.floor(Math.random() * 2000); // 5000-7000 kg
const rendemen = 60 + (Math.random() * 4) - 2; // 58-62%
const outputPK = Math.round(inputGabah * (rendemen / 100));
const sekam = Math.round(inputGabah * 0.20);
const dedak = Math.round(inputGabah * 0.10);

// Cari machine Husker di PMD 1
const husker = await tx.machine.findFirst({ where: { code: 'MSN-HSK-01' } });
const outputProd = await tx.outputProduct.findFirst({ where: { code: 'PK', id_factory: pmd1.id } });

const ws = await tx.worksheet.create({
    data: {
        id_factory: pmd1.id,
        id_user: user.id,
        worksheet_date: date,
        shift: shift,
        id_machine: husker?.id,
        id_output_product: outputProd?.id,
        batch_code: `BATCH-PMD1-${dateStr}-${shift}`,
        gabah_input: inputGabah,
        beras_output: outputPK,
        menir_output: 0,
        dedak_output: dedak,
        sekam_output: sekam,
        rendemen: parseFloat(rendemen.toFixed(2)),
        machine_hours: 8,
        downtime_hours: Math.random() > 0.8 ? 1 : 0,
        notes: `${this.DUMMY_TAG} PMD 1 Worksheet`,
        production_cost: inputGabah * 100,
        raw_material_cost: inputGabah * 6000,
        side_product_revenue: (sekam * 500) + (dedak * 2000),
        hpp: (inputGabah * 6000) + (inputGabah * 100),
        hpp_per_kg: Math.round(((inputGabah * 6100) / outputPK))
    }
});

// Stock movements: OUT gabah, IN PK, IN sekam, IN dedak
// ... (create movements with DUMMY_TAG)
```

**PMD 2 Worksheet (per shift):**
```typescript
const inputPK = 3000 + Math.floor(Math.random() * 1500); // 3000-4500 kg
const rendemenBeras = 85 + (Math.random() * 6) - 3; // 82-88%
const outputBeras = Math.round(inputPK * (rendemenBeras / 100));
const menir = Math.round(inputPK * 0.05);
// Split output: 60% Medium/Super, 40% Premium
const berasMS = Math.round(outputBeras * 0.6);
const berasP = outputBeras - berasMS;

const polisher = await tx.machine.findFirst({ where: { code: 'MSN-PLB-01' } });
const outputProdMS = await tx.outputProduct.findFirst({ where: { code: 'BRS-MS', id_factory: pmd2.id } });

const ws = await tx.worksheet.create({
    data: {
        id_factory: pmd2.id,
        id_user: user.id,
        worksheet_date: date,
        shift: shift,
        id_machine: polisher?.id,
        id_output_product: outputProdMS?.id,
        batch_code: `BATCH-PMDP-${dateStr}-${shift}`,
        gabah_input: inputPK, // field name is gabah_input tapi isinya PK
        beras_output: outputBeras,
        menir_output: menir,
        dedak_output: 0,
        sekam_output: 0,
        rendemen: parseFloat(rendemenBeras.toFixed(2)),
        machine_hours: 8,
        downtime_hours: Math.random() > 0.8 ? 1 : 0,
        notes: `${this.DUMMY_TAG} PMD 2 Worksheet`,
        production_cost: inputPK * 150,
        raw_material_cost: inputPK * 8000,
        side_product_revenue: menir * 3000,
        hpp: (inputPK * 8000) + (inputPK * 150),
        hpp_per_kg: Math.round(((inputPK * 8150) / outputBeras))
    }
});

// Stock movements: OUT PK, IN BRS-MS, IN BRS-P, IN menir
// ... (create movements with DUMMY_TAG)
```

Return `{ worksheets: count, movements: count }`.

#### `generateMaintenance(tx, pmd1, pmd2, user)`
Loop same days, ~30% chance per day per factory:
```typescript
let count = 0;
const allMachines = await tx.machine.findMany();
// ... per day, if Math.random() > 0.7:
await tx.maintenance.create({
    data: {
        id_machine: randomMachine.id,
        id_user: user.id,
        maintenance_type: Maintenance_maintenance_type_enum.PREVENTIVE,
        maintenance_date: date,
        cost: 100000 + Math.floor(Math.random() * 200000),
        description: `${this.DUMMY_TAG} Routine maintenance check`,
        status: "COMPLETED"
    }
});
count++;
```

#### `generateSalesData(tx, pmd1, pmd2, productTypes, user)`
```typescript
// 1. Create 3 dummy customers
const customers = [
    { code: 'CUST-DUMMY-001', name: 'Toko Beras Makmur', address: 'Pasar Induk, Jakarta', phone: '08111111111' },
    { code: 'CUST-DUMMY-002', name: 'CV Pangan Sejahtera', address: 'Jl. Gatot Subroto, Jakarta', phone: '08222222222' },
    { code: 'CUST-DUMMY-003', name: 'Warung Bu Siti', address: 'Desa Sukamaju, Karawang', phone: '08333333333' },
];
// findOrCreate each

// 2. Create 6-10 invoices (mix status)
// Per invoice: 1-3 items (BRS-MS, BRS-P), random quantities
// Status distribution: 30% DRAFT, 30% SENT, 30% PAID, 10% CANCELLED
// PAID invoices get a Payment record

// Invoice pattern:
const inv = await tx.invoice.create({
    data: {
        id_factory: pmd2.id,  // Invoices dari PMD 2 (yang jual beras)
        id_customer: customer.id,
        id_user: user.id,
        invoice_number: `INV-DUMMY-${String(i).padStart(4, '0')}`,
        invoice_date: date,
        due_date: dueDate,
        subtotal: totalAmount,
        tax: Math.round(totalAmount * 0.11),
        total: Math.round(totalAmount * 1.11),
        status: status,
        notes: `${this.DUMMY_TAG} Auto-generated invoice`
    }
});

// InvoiceItem:
await tx.invoiceItem.create({
    data: {
        id_invoice: inv.id,
        id_product_type: productTypes.BRS_P.id,
        quantity: qty,
        unit_price: 12000,
        total: qty * 12000
    }
});

// Payment for PAID invoices:
if (status === 'PAID') {
    await tx.payment.create({
        data: {
            id_invoice: inv.id,
            id_user: user.id,
            amount: inv.total,
            payment_date: date,
            payment_method: 'TRANSFER',
            reference_number: `PAY-DUMMY-${i}`,
            notes: `${this.DUMMY_TAG} Auto payment`
        }
    });
}
```

Return total count of invoices + payments created.

#### `generatePurchasingData(tx, pmd1, pmd2, productTypes, user)`
```typescript
// 1. Create 3 dummy suppliers
const suppliers = [
    { code: 'SUP-DUMMY-001', name: 'UD Padi Jaya', contact_person: 'Cahyo', phone: '083456789012' },
    { code: 'SUP-DUMMY-002', name: 'PT Gabah Nusantara', contact_person: 'Slamet', phone: '084567890123' },
    { code: 'SUP-DUMMY-003', name: 'CV Tani Makmur', contact_person: 'Wati', phone: '085678901234' },
];
// findOrCreate each

// 2. Create 6-10 POs (mix status) for PMD 1 (yang beli gabah)
// Items: GKP (gabah), random qty 10.000-30.000 kg
// Status distribution: 20% DRAFT, 30% APPROVED, 40% RECEIVED, 10% CANCELLED
// RECEIVED POs get GoodsReceipt + GoodsReceiptItems

const po = await tx.purchaseOrder.create({
    data: {
        id_factory: pmd1.id,
        id_supplier: supplier.id,
        id_user: user.id,
        po_number: `PO-DUMMY-${String(i).padStart(4, '0')}`,
        po_date: date,
        expected_date: expectedDate,
        subtotal: totalAmount,
        tax: Math.round(totalAmount * 0.11),
        total: Math.round(totalAmount * 1.11),
        status: status,
        notes: `${this.DUMMY_TAG} Auto-generated PO`
    }
});

// PO Item:
const poItem = await tx.purchaseOrderItem.create({
    data: {
        id_purchase_order: po.id,
        id_product_type: productTypes.GKP.id,
        quantity: qty,
        unit_price: 6000,
        total: qty * 6000
    }
});

// GoodsReceipt for RECEIVED POs:
if (status === 'RECEIVED') {
    const gr = await tx.goodsReceipt.create({
        data: {
            id_purchase_order: po.id,
            id_user: user.id,
            receipt_number: `GR-DUMMY-${i}`,
            receipt_date: date,
            notes: `${this.DUMMY_TAG} Auto goods receipt`
        }
    });
    await tx.goodsReceiptItem.create({
        data: {
            id_goods_receipt: gr.id,
            id_purchase_order_item: poItem.id,
            quantity_received: qty
        }
    });
}
```

Return total count of POs + goods receipts created.

#### `recalculateAllStocks(tx)` — untuk deleteDummy
```typescript
private static async recalculateAllStocks(tx: any) {
    const stocks = await tx.stock.findMany();
    for (const stock of stocks) {
        // Sum all remaining IN movements
        const inSum = await tx.stockMovement.aggregate({
            where: { id_stock: stock.id, movement_type: 'IN' },
            _sum: { quantity: true }
        });
        // Sum all remaining OUT movements
        const outSum = await tx.stockMovement.aggregate({
            where: { id_stock: stock.id, movement_type: 'OUT' },
            _sum: { quantity: true }
        });
        const totalIn = Number(inSum._sum.quantity || 0);
        const totalOut = Number(outSum._sum.quantity || 0);
        await tx.stock.update({
            where: { id: stock.id },
            data: { quantity: Math.max(0, totalIn - totalOut) }
        });
    }
}
```

---

### Task 2: Tambah method `deleteDummy()` di DummyService

**File**: `src/services/dummy.service.ts`

Sudah tercakup di Task 1. Method `deleteDummy()` menghapus data berdasarkan tag:

1. Hapus StockMovement WHERE notes STARTS WITH `[DUMMY]`
2. Hapus WorksheetInputBatch + WorksheetSideProduct WHERE worksheet.notes STARTS WITH `[DUMMY]`
3. Hapus Worksheet WHERE notes STARTS WITH `[DUMMY]`
4. Hapus Maintenance WHERE description STARTS WITH `[DUMMY]`
5. Hapus Payment, InvoiceItem, Invoice WHERE invoice.notes STARTS WITH `[DUMMY]`
6. Hapus GoodsReceiptItem, GoodsReceipt, PurchaseOrderItem, PurchaseOrder WHERE PO.notes STARTS WITH `[DUMMY]`
7. Hapus Customer WHERE code STARTS WITH `CUST-DUMMY`
8. Hapus Supplier WHERE code STARTS WITH `SUP-DUMMY`
9. Recalculate all stock quantities

Lihat code lengkap di bagian "Approach" di atas.

---

### Task 3: Tambah method `hardReset()` di DummyService

**File**: `src/services/dummy.service.ts`

Hapus SEMUA data transaksional + master data, **KECUALI** User, Factory, QualityParameter, ExpenseCategory, ProcessCategory.

**Urutan delete (FK constraints):**

```typescript
static async hardReset(): Promise<{ status: string; deleted: any }> {
    return await prisma.$transaction(async (tx) => {
        const stats: Record<string, number> = {};

        // 1. QC data
        stats.qc_analysis = (await tx.rawMaterialQualityAnalysis.deleteMany({})).count;
        stats.qc_gabah = (await tx.qCGabah.deleteMany({})).count;

        // 2. Stock movements (before stocks)
        stats.stock_movements = (await tx.stockMovement.deleteMany({})).count;

        // 3. Worksheet children + worksheets
        stats.worksheet_batches = (await tx.worksheetInputBatch.deleteMany({})).count;
        stats.worksheet_side_products = (await tx.worksheetSideProduct.deleteMany({})).count;
        stats.worksheets = (await tx.worksheet.deleteMany({})).count;

        // 4. Sales: payments → invoice items → invoices
        stats.payments = (await tx.payment.deleteMany({})).count;
        stats.invoice_items = (await tx.invoiceItem.deleteMany({})).count;
        stats.invoices = (await tx.invoice.deleteMany({})).count;

        // 5. Purchasing: goods receipt items → goods receipts → PO items → POs
        stats.goods_receipt_items = (await tx.goodsReceiptItem.deleteMany({})).count;
        stats.goods_receipts = (await tx.goodsReceipt.deleteMany({})).count;
        stats.po_items = (await tx.purchaseOrderItem.deleteMany({})).count;
        stats.purchase_orders = (await tx.purchaseOrder.deleteMany({})).count;

        // 6. Maintenance
        stats.maintenance = (await tx.maintenance.deleteMany({})).count;

        // 7. Notifications
        stats.notifications = (await tx.notification.deleteMany({})).count;

        // 8. Master data — hapus children dulu
        stats.output_products = (await tx.outputProduct.deleteMany({})).count;
        stats.machines = (await tx.machine.deleteMany({})).count;
        stats.stocks = (await tx.stock.deleteMany({})).count;
        stats.product_types = (await tx.productType.deleteMany({})).count;
        stats.customers = (await tx.customer.deleteMany({})).count;
        stats.suppliers = (await tx.supplier.deleteMany({})).count;
        stats.categories = (await tx.rawMaterialCategory.deleteMany({})).count;
        stats.varieties = (await tx.rawMaterialVariety.deleteMany({})).count;

        // TETAP ADA: User, Factory, QualityParameter, ExpenseCategory, ProcessCategory

        return { status: "success", deleted: stats };
    }, { timeout: 60000 });
}
```

---

### Task 4: Buat API endpoint `DELETE /admin/dummy/delete`

**File baru**: `types/api/T_deleteDummy.ts`

```typescript
import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_deleteDummy_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_deleteDummy = (request: {
    headers: T_deleteDummy_headers
}, response: Response) => Promise<{
    status: string,
    deleted: {
        movements: number,
        worksheets: number,
        maintenance: number,
        invoices: number,
        purchase_orders: number,
        customers: number,
        suppliers: number
    }
}>;

export const method = 'delete';
export const url_path = '/admin/dummy/delete';
export const alias = 'T_deleteDummy';
export const is_streaming = false;
```

**File baru**: `implementation/T_deleteDummy.ts`

```typescript
import { T_deleteDummy } from "../types/api/T_deleteDummy";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteDummy: T_deleteDummy = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERUSER');
    const result = await DummyService.deleteDummy();
    return result;
});
```

---

### Task 5: Buat API endpoint `DELETE /admin/hard-reset`

**File baru**: `types/api/T_hardReset.ts`

```typescript
import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_hardReset_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_hardReset = (request: {
    headers: T_hardReset_headers
}, response: Response) => Promise<{
    status: string,
    deleted: Record<string, number>
}>;

export const method = 'delete';
export const url_path = '/admin/hard-reset';
export const alias = 'T_hardReset';
export const is_streaming = false;
```

**File baru**: `implementation/T_hardReset.ts`

```typescript
import { T_hardReset } from "../types/api/T_hardReset";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_hardReset: T_hardReset = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERUSER');
    const result = await DummyService.hardReset();
    return result;
});
```

---

### Task 6: Fix type definitions yang sudah ada

**File**: `types/api/T_generateDummy.ts`

Ganti `created` type — hapus `schedules`, tambah `sales` dan `purchasing`:

```typescript
// SEBELUM:
created: {
    products: number,
    inventory: number,
    worksheets: number,
    schedules: number,      // ← HAPUS
    transactions: number,
    machine_logs: number
}

// SESUDAH:
created: {
    products: number,
    inventory: number,
    worksheets: number,
    transactions: number,
    machine_logs: number,
    sales: number,
    purchasing: number
}
```

**File**: `types/api/T_resetDummy.ts`

Ganti `deleted` type — hapus `schedules`:

```typescript
// SEBELUM:
deleted: {
    inventory: number,
    worksheets: number,
    schedules: number,      // ← HAPUS
    transactions: number,
    logs: number
}

// SESUDAH:
deleted: {
    inventory: number,
    worksheets: number,
    transactions: number,
    logs: number
}
```

---

### Task 7: Hapus dead code `dummyData.ts`

**File**: `implementation/data/dummyData.ts`

**HAPUS file ini.** Alasan:
- Tidak dipakai oleh `DummyService` (tidak ada import)
- Import `Employee_gender_enum` yang mungkin sudah tidak ada (Employee model di luar scope)
- Semua data sudah di-inline langsung di method-method `DummyService`

---

### Task 8: Update frontend Settings.tsx

**File**: `frontend/src/pages/Settings.tsx`

**Perubahan:**

#### A. Tambah state untuk hard reset confirmation:
```typescript
const [confirmText, setConfirmText] = useState('');
```

#### B. Tambah handler untuk Delete Dummy:
```typescript
const handleDeleteDummyClick = () => {
    setModalConfig({
        isOpen: true,
        title: 'Hapus Data Dummy',
        message: 'Apakah Anda yakin ingin menghapus data dummy? Data asli (non-dummy) akan tetap aman.',
        type: 'info',
        onConfirm: performDeleteDummy,
        showCancel: true
    });
};

const performDeleteDummy = async () => {
    closeModal();
    setLoading(true);
    try {
        const res = await api.delete('/admin/dummy/delete');
        const d = res.data.deleted;
        showSuccess("Berhasil",
            `Data dummy berhasil dihapus! ${d.worksheets} worksheets, ${d.movements} movements, ${d.invoices} invoices, ${d.purchase_orders} POs.`
        );
        fetchSuppliers();
        fetchCategories();
        fetchVarieties();
    } catch (error: any) {
        showError("Gagal menghapus data dummy", error.response?.data?.message || error.message);
    } finally {
        setLoading(false);
    }
};
```

#### C. Ubah handleResetClick → handleHardResetClick:
```typescript
const handleHardResetClick = () => {
    setConfirmText('');
    setModalConfig({
        isOpen: true,
        title: 'Hard Reset',
        message: 'BAHAYA: Ini akan MENGHAPUS SEMUA DATA (transaksi + master data) kecuali User dan Factory. Tindakan ini TIDAK DAPAT dibatalkan.',
        type: 'danger',
        onConfirm: performHardReset,
        showCancel: true
    });
};

const performHardReset = async () => {
    closeModal();
    setLoading(true);
    try {
        const res = await api.delete('/admin/hard-reset');
        const totalDeleted = Object.values(res.data.deleted as Record<string, number>)
            .reduce((sum, val) => sum + val, 0);
        showSuccess("Hard Reset Berhasil", `${totalDeleted} records berhasil dihapus.`);
        setSuppliers([]);
        setCategories([]);
        setVarieties([]);
    } catch (error: any) {
        showError("Gagal melakukan hard reset", error.response?.data?.message || error.message);
    } finally {
        setLoading(false);
    }
};
```

#### D. Update JSX — 3 tombol + info text + hard reset modal:

Ganti seluruh konten tab `data` (dari `{activeTab === 'data' && (` sampai penutup `)}`) dengan:

```tsx
{activeTab === 'data' && (
    <div className="card">
        <div className="card-header">
            <h3 className="card-title">Manajemen Data (Developer)</h3>
            <p className="card-subtitle">Tools untuk mengisi atau membersihkan data sistem untuk keperluan testing.</p>
        </div>
        <div style={{ padding: 24, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={handleSeedClick} disabled={loading}>
                <span className="material-symbols-outlined icon-sm">dataset</span>
                Generate Dummy
            </button>
            <button className="btn btn-warning" onClick={handleDeleteDummyClick} disabled={loading}
                style={{ background: 'var(--warning)', color: '#000' }}>
                <span className="material-symbols-outlined icon-sm">delete_sweep</span>
                Hapus Dummy
            </button>
            <button className="btn btn-error" onClick={handleHardResetClick} disabled={loading}>
                <span className="material-symbols-outlined icon-sm">delete_forever</span>
                Hard Reset
            </button>
            {loading && (
                <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="material-symbols-outlined animate-spin icon-sm">sync</span>
                    Memproses...
                </span>
            )}
        </div>
        <div style={{ padding: '0 24px 24px' }}>
            <div className="alert alert-info" style={{ background: 'rgba(19, 127, 236, 0.1)', color: 'var(--primary)', padding: 16, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                    <span className="material-symbols-outlined">info</span>
                    <div>
                        <h4 style={{ fontWeight: 600, marginBottom: 4 }}>Informasi</h4>
                        <p style={{ fontSize: '0.875rem' }}>
                            <strong>Generate Dummy:</strong> Membuat data sample produksi (PMD 1 &amp; PMD 2), stok, worksheet, invoice, dan purchase order.<br />
                            <strong>Hapus Dummy:</strong> Menghapus HANYA data dummy yang di-generate. Data asli tetap aman.<br />
                            <strong>Hard Reset:</strong> Menghapus SEMUA data transaksi dan master data (kecuali User &amp; Factory). HATI-HATI!
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
)}
```

#### E. Update modal untuk Hard Reset — tambahkan input confirmation:

Di dalam modal JSX, tambahkan kondisi khusus untuk hard reset:

```tsx
<div className="modal-body">
    <p>{modalConfig.message}</p>
    {/* Hard Reset double confirmation */}
    {modalConfig.title === 'Hard Reset' && (
        <div style={{ marginTop: 16 }}>
            <label className="form-label">Ketik <strong>HARD RESET</strong> untuk konfirmasi:</label>
            <input
                type="text"
                className="form-input"
                placeholder="HARD RESET"
                value={confirmText}
                onChange={e => setConfirmText(e.target.value)}
                style={{ marginTop: 8 }}
            />
        </div>
    )}
</div>
<div className="modal-footer">
    {modalConfig.showCancel && (
        <button className="btn btn-secondary" onClick={closeModal}>Batal</button>
    )}
    <button
        className={`btn ${modalConfig.type === 'danger' ? 'btn-error' : 'btn-primary'}`}
        onClick={modalConfig.onConfirm || closeModal}
        disabled={modalConfig.title === 'Hard Reset' && confirmText !== 'HARD RESET'}
    >
        {modalConfig.type === 'success' ? 'OK' : 'Konfirmasi'}
    </button>
</div>
```

#### F. Update performSeed success message:
```typescript
// SEBELUM:
showSuccess("Berhasil", `Data Dummy berhasil dibuat! Worksheets: ${res.data.created.worksheets}, Transaksi: ${res.data.created.transactions}`);

// SESUDAH:
const c = res.data.created;
showSuccess("Berhasil",
    `Data dummy berhasil dibuat! ${c.worksheets} worksheets, ${c.transactions} movements, ${c.sales} invoices, ${c.purchasing} POs.`
);
```

---

## File yang Dimodifikasi — Ringkasan

| # | File | Aksi | Detail |
|---|------|------|--------|
| 1 | `src/services/dummy.service.ts` | **REWRITE** | Rewrite total: multi-factory, tagging, deleteDummy, hardReset |
| 2 | `types/api/T_deleteDummy.ts` | **NEW** | DELETE `/admin/dummy/delete` type definition |
| 3 | `implementation/T_deleteDummy.ts` | **NEW** | Handler untuk deleteDummy |
| 4 | `types/api/T_hardReset.ts` | **NEW** | DELETE `/admin/hard-reset` type definition |
| 5 | `implementation/T_hardReset.ts` | **NEW** | Handler untuk hardReset |
| 6 | `types/api/T_generateDummy.ts` | **FIX** | Hapus `schedules`, tambah `sales` + `purchasing` |
| 7 | `types/api/T_resetDummy.ts` | **FIX** | Hapus `schedules` |
| 8 | `implementation/data/dummyData.ts` | **DELETE** | Dead code — tidak dipakai |
| 9 | `frontend/src/pages/Settings.tsx` | **EDIT** | 3 tombol, info text, hard reset double confirmation |

---

## Verification

1. **Generate Dummy**:
   - Buka `/settings` → tab "Manajemen Data"
   - Klik "Generate Dummy" → Konfirmasi
   - Toast menampilkan jumlah worksheets, movements, invoices, POs
   - Cek Worksheets page: data muncul untuk PMD 1 DAN PMD 2
   - Cek Stocks page: quantity > 0 untuk GKP, GKG, PK di PMD 1 dan PK, BRS-MS, BRS-P di PMD 2
   - Cek Invoices page: ada invoice dummy
   - Cek Purchase Orders page: ada PO dummy

2. **Hapus Dummy**:
   - Klik "Hapus Dummy" → Konfirmasi
   - Toast menampilkan jumlah data terhapus
   - Cek Worksheets: data `[DUMMY]` hilang, data real (jika ada) tetap ada
   - Cek Stocks: quantity di-recalculate (dari remaining movements)
   - Cek Invoices: invoice dummy hilang
   - Cek POs: PO dummy hilang

3. **Hard Reset**:
   - Klik "Hard Reset"
   - Modal muncul dengan input text
   - Tombol "Konfirmasi" disabled sampai user ketik "HARD RESET"
   - Setelah ketik → klik Konfirmasi
   - Semua data terhapus (worksheet, movement, invoice, PO, maintenance, machine, stock, product type, customer, supplier, dll)
   - Yang tetap: User, Factory, QualityParameter

4. **Build**: `npm run build` — no TypeScript errors (frontend & backend)

---

## Catatan Penting

- **`resetAll()`** yang lama (`DELETE /admin/dummy/reset`) **TETAP ADA** untuk backward compatibility, tapi UI hanya menampilkan 3 tombol baru (Generate, Hapus Dummy, Hard Reset). Jika mau bisa dihapus.
- **Prisma transaction timeout**: `generateAll()` set 30 detik, `hardReset()` set 60 detik. Adjust jika data banyak.
- **Stock recalculation**: Setelah `deleteDummy()`, semua stock di-recalculate dari remaining movements. Ini penting agar stock quantity akurat.
- **NAIV framework**: File baru di `types/api/T_*.ts` dan `implementation/T_*.ts` akan otomatis terdaftar sebagai endpoint oleh framework.
