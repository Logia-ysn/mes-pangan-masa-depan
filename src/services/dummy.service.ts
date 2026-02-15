/**
 * Dummy Service
 * Handles dummy data generation, partial removal, and hard resets using Prisma.
 * Support for multi-factory flows and integrated Sales/Purchasing modules.
 */

import { prisma } from "../libs/prisma";
import {
    Worksheet_shift_enum,
    StockMovement_movement_type_enum,
    Maintenance_maintenance_type_enum,
    Machine_status_enum,
    Invoice_status_enum,
    PurchaseOrder_status_enum
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

            // 0. Clean up existing dummy data first for idempotency
            await this.deleteDummy(tx);

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

            // 7. Set initial stocks (using single stock update logic)
            await this.setInitialStocks(tx, pmd1, pmd2, productTypes, user);
            stats.inventory = await tx.stock.count();

            // 8. Generate Worksheets + StockMovements (Last 7 days + 3 days ahead)
            const wsStats = await this.generateWorksheets(tx, pmd1, pmd2, productTypes, user);
            stats.worksheets = wsStats.worksheets;
            stats.transactions = wsStats.movements;

            // 9. Generate Maintenance
            stats.machine_logs = await this.generateMaintenance(tx, pmd1, pmd2, user);

            // 10. Generate Sales dummy (Customers, Invoices, Payments)
            stats.sales = await this.generateSalesData(tx, pmd2, productTypes, user);

            // 11. Generate Purchasing dummy (Suppliers, POs, GoodsReceipts)
            const p1 = await this.generatePurchasingData(tx, pmd1, productTypes, user);
            const p2 = await this.generatePurchasingData(tx, pmd2, productTypes, user);
            stats.purchasing = p1 + p2;

            console.log("Dummy Generation Complete", stats);
            return { status: "success", created: stats };
        }, { timeout: 60000 });
    }

    /**
     * Delete only dummy data based on tags and prefixes.
     */
    static async deleteDummy(existingTx?: any): Promise<{ status: string; deleted: any }> {
        const logic = async (tx: any) => {
            console.log("Deleting Dummy Data...");

            const stats = {
                movements: 0,
                worksheets: 0,
                maintenance: 0,
                invoices: 0,
                purchase_orders: 0,
                customers: 0,
                suppliers: 0
            };

            // 1. Delete transactional data with [DUMMY] tag
            stats.movements = (await tx.stockMovement.deleteMany({
                where: {
                    OR: [
                        { notes: { startsWith: this.DUMMY_TAG } },
                        { notes: { contains: this.DUMMY_TAG } }
                    ]
                }
            })).count;

            // Delete worksheet related data
            // Note: Cascade delete might handle worksheetInputBatch and worksheetSideProduct
            // But if not, we delete them first
            const dummyWs = await tx.worksheet.findMany({
                where: { notes: { startsWith: this.DUMMY_TAG } },
                select: { id: true }
            });
            const wsIds = dummyWs.map((w: any) => w.id);

            if (wsIds.length > 0) {
                await tx.worksheetInputBatch.deleteMany({ where: { id_worksheet: { in: wsIds } } });
                await tx.worksheetSideProduct.deleteMany({ where: { id_worksheet: { in: wsIds } } });
                stats.worksheets = (await tx.worksheet.deleteMany({ where: { id: { in: wsIds } } })).count;
            }

            stats.maintenance = (await tx.maintenance.deleteMany({
                where: { description: { startsWith: this.DUMMY_TAG } }
            })).count;

            // 2. Delete Sales dummy (Invoices, Items, Payments, Customers)
            const dummyInvoices = await tx.invoice.findMany({
                where: { notes: { startsWith: this.DUMMY_TAG } },
                select: { id: true }
            });
            const invIds = dummyInvoices.map((i: any) => i.id);

            if (invIds.length > 0) {
                await tx.payment.deleteMany({ where: { id_invoice: { in: invIds } } });
                await tx.invoiceItem.deleteMany({ where: { id_invoice: { in: invIds } } });
                stats.invoices = (await tx.invoice.deleteMany({ where: { id: { in: invIds } } })).count;
            }

            stats.customers = (await tx.customer.deleteMany({
                where: { code: { startsWith: this.DUMMY_CUSTOMER_PREFIX } }
            })).count;

            // 3. Delete Purchasing dummy (POs, GoodsReceipts, Suppliers)
            const dummyPOs = await tx.purchaseOrder.findMany({
                where: { notes: { startsWith: this.DUMMY_TAG } },
                select: { id: true }
            });
            const poIds = dummyPOs.map((p: any) => p.id);

            if (poIds.length > 0) {
                const grs = await tx.goodsReceipt.findMany({
                    where: { id_purchase_order: { in: poIds } },
                    select: { id: true }
                });
                const grIds = grs.map((g: any) => g.id);
                if (grIds.length > 0) {
                    await tx.goodsReceiptItem.deleteMany({ where: { id_goods_receipt: { in: grIds } } });
                    await tx.goodsReceipt.deleteMany({ where: { id: { in: grIds } } });
                }
                await tx.purchaseOrderItem.deleteMany({ where: { id_purchase_order: { in: poIds } } });
                stats.purchase_orders = (await tx.purchaseOrder.deleteMany({ where: { id: { in: poIds } } })).count;
            }

            stats.suppliers = (await tx.supplier.deleteMany({
                where: { code: { startsWith: this.DUMMY_SUPPLIER_PREFIX } }
            })).count;

            // 4. Recalculate all stocks based on remaining movements
            await this.recalculateAllStocks(tx);

            console.log("Delete Dummy Complete", stats);
            return { status: "success", deleted: stats };
        };

        if (existingTx) {
            return await logic(existingTx);
        } else {
            return await prisma.$transaction(logic, { timeout: 60000 });
        }
    }

    /**
     * Hard Reset: Delete ALL transactional and master data.
     * Keeps ONLY User, Factory, and system configurations.
     */
    static async hardReset(): Promise<{ status: string; deleted: any }> {
        return await prisma.$transaction(async (tx) => {
            console.log("Performing Hard Reset...");
            const stats: Record<string, number> = {};

            // Delete in order to satisfy FK constraints
            stats.qc_analysis = (await tx.rawMaterialQualityAnalysis.deleteMany({})).count;
            stats.qc_gabah = (await tx.qCGabah.deleteMany({})).count;
            stats.stock_movements = (await tx.stockMovement.deleteMany({})).count;

            await tx.worksheetInputBatch.deleteMany({});
            await tx.worksheetSideProduct.deleteMany({});
            stats.worksheets = (await tx.worksheet.deleteMany({})).count;

            await tx.payment.deleteMany({});
            await tx.invoiceItem.deleteMany({});
            stats.invoices = (await tx.invoice.deleteMany({})).count;

            await tx.goodsReceiptItem.deleteMany({});
            await tx.goodsReceipt.deleteMany({});
            await tx.purchaseOrderItem.deleteMany({});
            stats.purchase_orders = (await tx.purchaseOrder.deleteMany({})).count;

            stats.maintenance = (await tx.maintenance.deleteMany({})).count;
            stats.notifications = (await tx.notification.deleteMany({})).count;

            // Master data
            stats.output_products = (await tx.outputProduct.deleteMany({})).count;
            stats.machines = (await tx.machine.deleteMany({})).count;
            stats.stocks = (await tx.stock.deleteMany({})).count;
            stats.product_types = (await tx.productType.deleteMany({})).count;
            stats.customers = (await tx.customer.deleteMany({})).count;
            stats.suppliers = (await tx.supplier.deleteMany({})).count;
            stats.categories = (await tx.rawMaterialCategory.deleteMany({})).count;
            stats.varieties = (await tx.rawMaterialVariety.deleteMany({})).count;

            console.log("Hard Reset Complete", stats);
            return { status: "success", deleted: stats };
        }, { timeout: 90000 });
    }

    /**
     * Legacy resetAll method for backward compatibility.
     * Maps to deleteDummy() which is safer (tag-based).
     */
    static async resetAll(): Promise<{ status: string; deleted: any }> {
        return await this.deleteDummy();
    }

    // --- Private Helpers ---

    private static async ensureUser(tx: any): Promise<any> {
        const user = await tx.user.findFirst({ where: { is_active: true } });
        if (!user) throw new Error("No active user found. Please seed a superuser first.");
        return user;
    }

    private static async ensureFactory(tx: any, code: string, name: string, address: string) {
        let factory = await tx.factory.findFirst({ where: { code } });
        if (!factory) {
            factory = await tx.factory.create({
                data: { code, name, address, is_active: true }
            });
        }
        return factory;
    }

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
            // Map code to keys like BRS_MS for easy access
            result[t.code.replace('-', '_')] = pt;
        }
        return result;
    }

    private static async ensureMachines(tx: any, pmd1: any, pmd2: any) {
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
                        code: m.code,
                        name: m.name,
                        machine_type: m.machine_type,
                        id_factory: m.factory.id,
                        status: Machine_status_enum.ACTIVE,
                        capacity_per_hour: 2000
                    }
                });
            }
        }
    }

    private static async ensureOutputProducts(tx: any, pmd1: any, pmd2: any) {
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
    }

    private static async ensureRawMaterialData(tx: any) {
        const cats = [
            { code: 'PADI', name: 'Padi/Gabah' },
            { code: 'PK', name: 'Pecah Kulit' }
        ];
        for (const c of cats) {
            const exists = await tx.rawMaterialCategory.findFirst({ where: { code: c.code } });
            if (!exists) await tx.rawMaterialCategory.create({ data: { ...c, is_active: true } });
        }
        const vars = [
            { code: 'IR64', name: 'IR 64' },
            { code: 'CIHERANG', name: 'Ciherang' },
            { code: 'INPARI', name: 'Inpari 32' }
        ];
        for (const v of vars) {
            const exists = await tx.rawMaterialVariety.findFirst({ where: { code: v.code } });
            if (!exists) await tx.rawMaterialVariety.create({ data: { ...v, is_active: true } });
        }
    }

    private static async ensureStocks(tx: any, pmd1: any, pmd2: any, productTypes: Record<string, any>) {
        const stockMap = [
            { factory: pmd1, types: ['GKP', 'GKG', 'PK', 'GLO', 'SKM', 'DDK'] },
            { factory: pmd2, types: ['GKP', 'PK', 'GLO', 'BRS_MS', 'BRS_P', 'MNR'] },
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
    }

    private static async setInitialStocks(tx: any, pmd1: any, pmd2: any, productTypes: Record<string, any>, user: any) {
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
                await this.createMovement(
                    tx, stock, user, StockMovement_movement_type_enum.IN,
                    is.qty, "ADJUSTMENT", stock.id, new Date(),
                    `${this.DUMMY_TAG} Initial Stock ${pt.code}`
                );
            }
        }
    }

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
                reference_id: refId !== undefined ? BigInt(refId) : null,
                created_at: date,
                notes: note || `${this.DUMMY_TAG} Auto-generated`
            }
        });
        await tx.stock.update({
            where: { id: stock.id },
            data: {
                quantity: type === StockMovement_movement_type_enum.IN
                    ? { increment: qty }
                    : { decrement: qty }
            }
        });
    }

    private static async generateWorksheets(tx: any, pmd1: any, pmd2: any, productTypes: Record<string, any>, user: any) {
        let worksheets = 0;
        let movements = 0;
        const today = new Date();

        for (let i = 6; i >= -3; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            if (date.getDay() === 0) continue; // Skip Sundays

            const dateStr = date.toISOString().split('T')[0];
            const shifts = [Worksheet_shift_enum.SHIFT_1, Worksheet_shift_enum.SHIFT_2];

            for (const shift of shifts) {
                // --- PMD 1 Production (GKP -> PK) ---
                const inPmd1 = 5000 + Math.floor(Math.random() * 2000);
                const rendemenPmd1 = 60 + (Math.random() * 4) - 2;
                const outPK = Math.round(inPmd1 * (rendemenPmd1 / 100));
                const skm = Math.round(inPmd1 * 0.20);
                const ddk = Math.round(inPmd1 * 0.10);

                const husker = await tx.machine.findFirst({ where: { code: 'MSN-HSK-01' } });

                const ws1 = await tx.worksheet.create({
                    data: {
                        id_factory: pmd1.id, id_user: user.id, worksheet_date: date, shift,
                        id_machine: husker?.id, id_output_product: productTypes.PK.id,
                        batch_code: `BATCH-PMD1-${dateStr}-${shift}`,
                        gabah_input: inPmd1, beras_output: outPK, menir_output: 0,
                        dedak_output: ddk, sekam_output: skm, rendemen: parseFloat(rendemenPmd1.toFixed(2)),
                        machine_hours: 8, downtime_hours: 0, notes: `${this.DUMMY_TAG} PMD 1 Worksheet`,
                        production_cost: inPmd1 * 100, raw_material_cost: inPmd1 * 6000,
                        side_product_revenue: (skm * 500) + (ddk * 2000),
                        hpp: (inPmd1 * 6100), hpp_per_kg: Math.round((inPmd1 * 6100) / outPK)
                    }
                });
                worksheets++;

                // PMD 1 Movements
                const sGKP = await tx.stock.findFirst({ where: { id_factory: pmd1.id, id_product_type: productTypes.GKP.id } });
                const sPK1 = await tx.stock.findFirst({ where: { id_factory: pmd1.id, id_product_type: productTypes.PK.id } });
                const sSKM = await tx.stock.findFirst({ where: { id_factory: pmd1.id, id_product_type: productTypes.SKM.id } });
                const sDDK = await tx.stock.findFirst({ where: { id_factory: pmd1.id, id_product_type: productTypes.DDK.id } });

                if (sGKP) await this.createMovement(tx, sGKP, user, 'OUT', inPmd1, "WORKSHEET", ws1.id, date, `${this.DUMMY_TAG} Input GKP`);
                if (sPK1) await this.createMovement(tx, sPK1, user, 'IN', outPK, "WORKSHEET", ws1.id, date, `${this.DUMMY_TAG} Output PK`);
                if (sSKM) await this.createMovement(tx, sSKM, user, 'IN', skm, "WORKSHEET", ws1.id, date, `${this.DUMMY_TAG} Output Sekam`);
                if (sDDK) await this.createMovement(tx, sDDK, user, 'IN', ddk, "WORKSHEET", ws1.id, date, `${this.DUMMY_TAG} Output Dedak`);
                movements += 4;

                // --- PMD 2 Production (PK -> BRS) ---
                const inPmdP = 3000 + Math.floor(Math.random() * 1500);
                const rendemenPmdP = 85 + (Math.random() * 6) - 3;
                const outBerasTotal = Math.round(inPmdP * (rendemenPmdP / 100));
                const outMS = Math.round(outBerasTotal * 0.6);
                const outP = outBerasTotal - outMS;
                const mnr = Math.round(inPmdP * 0.05);

                const polisher = await tx.machine.findFirst({ where: { code: 'MSN-PLB-01' } });

                const wsP = await tx.worksheet.create({
                    data: {
                        id_factory: pmd2.id, id_user: user.id, worksheet_date: date, shift,
                        id_machine: polisher?.id, id_output_product: productTypes.BRS_MS.id,
                        batch_code: `BATCH-PMD2-${dateStr}-${shift}`,
                        gabah_input: inPmdP, beras_output: outBerasTotal, menir_output: mnr,
                        dedak_output: 0, sekam_output: 0, rendemen: parseFloat(rendemenPmdP.toFixed(2)),
                        machine_hours: 8, downtime_hours: 0, notes: `${this.DUMMY_TAG} PMD 2 Worksheet`,
                        production_cost: inPmdP * 150, raw_material_cost: inPmdP * 8000,
                        side_product_revenue: mnr * 3000,
                        hpp: (inPmdP * 8150), hpp_per_kg: Math.round((inPmdP * 8150) / outBerasTotal)
                    }
                });
                worksheets++;

                // PMD 2 Movements
                const sPK_P = await tx.stock.findFirst({ where: { id_factory: pmd2.id, id_product_type: productTypes.PK.id } });
                const sMS = await tx.stock.findFirst({ where: { id_factory: pmd2.id, id_product_type: productTypes.BRS_MS.id } });
                const sP = await tx.stock.findFirst({ where: { id_factory: pmd2.id, id_product_type: productTypes.BRS_P.id } });
                const sMNR = await tx.stock.findFirst({ where: { id_factory: pmd2.id, id_product_type: productTypes.MNR.id } });

                if (sPK_P) await this.createMovement(tx, sPK_P, user, 'OUT', inPmdP, "WORKSHEET", wsP.id, date, `${this.DUMMY_TAG} Input PK`);
                if (sMS) await this.createMovement(tx, sMS, user, 'IN', outMS, "WORKSHEET", wsP.id, date, `${this.DUMMY_TAG} Output Beras MS`);
                if (sP) await this.createMovement(tx, sP, user, 'IN', outP, "WORKSHEET", wsP.id, date, `${this.DUMMY_TAG} Output Beras P`);
                if (sMNR) await this.createMovement(tx, sMNR, user, 'IN', mnr, "WORKSHEET", wsP.id, date, `${this.DUMMY_TAG} Output Menir`);
                movements += 4;
            }
        }
        return { worksheets, movements };
    }

    private static async generateMaintenance(tx: any, pmd1: any, pmd2: any, user: any) {
        let count = 0;
        const today = new Date();
        const machines = await tx.machine.findMany();

        for (let i = 6; i >= -3; i--) {
            const date = new Date(today);
            date.setDate(today.getDate() - i);
            if (date.getDay() === 0) continue;

            for (const m of machines) {
                if (Math.random() > 0.85) {
                    await tx.maintenance.create({
                        data: {
                            id_machine: m.id, id_user: user.id,
                            maintenance_type: Maintenance_maintenance_type_enum.PREVENTIVE,
                            maintenance_date: date, cost: 150000 + Math.floor(Math.random() * 300000),
                            description: `${this.DUMMY_TAG} Routine maintenance check`,
                            status: "COMPLETED"
                        }
                    });
                    count++;
                }
            }
        }
        return count;
    }

    private static async generateSalesData(tx: any, factory: any, productTypes: Record<string, any>, user: any) {
        // 1. Ensure Customers
        const customers = [
            { code: 'CUST-DUMMY-001', name: 'Toko Beras Makmur', address: 'Pasar Induk, Jakarta', phone: '08111111111' },
            { code: 'CUST-DUMMY-002', name: 'CV Pangan Sejahtera', address: 'Jl. Gatot Subroto, Jakarta', phone: '08222222222' },
            { code: 'CUST-DUMMY-003', name: 'Warung Bu Siti', address: 'Desa Sukamaju, Karawang', phone: '08333333333' },
        ];
        const custRecords = [];
        for (const c of customers) {
            let record = await tx.customer.findFirst({ where: { code: c.code } });
            if (!record) record = await tx.customer.create({ data: { ...c, is_active: true } });
            custRecords.push(record);
        }

        // 2. Create Invoices
        let count = 0;
        const statuses = [Invoice_status_enum.PAID, Invoice_status_enum.SENT, Invoice_status_enum.DRAFT];

        for (let i = 1; i <= 8; i++) {
            const customer = custRecords[i % custRecords.length];
            const status = statuses[i % statuses.length];
            const date = new Date();
            date.setDate(date.getDate() - i * 2);
            const dueDate = new Date(date);
            dueDate.setDate(dueDate.getDate() + 14);

            const qty = 500 + Math.floor(Math.random() * 1000);
            const total = qty * 12000;

            const inv = await tx.invoice.create({
                data: {
                    id_factory: factory.id, id_customer: customer.id, id_user: user.id,
                    invoice_number: `INV-DUMMY-${String(i).padStart(4, '0')}`,
                    invoice_date: date, due_date: dueDate,
                    subtotal: total, tax: Math.round(total * 0.11), total: Math.round(total * 1.11),
                    status, notes: `${this.DUMMY_TAG} Auto-generated invoice`
                }
            });

            await tx.invoiceItem.create({
                data: {
                    id_invoice: inv.id, id_product_type: productTypes.BRS_P.id,
                    quantity: qty, unit_price: 12000, subtotal: total
                }
            });

            if (status === Invoice_status_enum.PAID) {
                await tx.payment.create({
                    data: {
                        id_invoice: inv.id, id_user: user.id, amount: inv.total,
                        payment_date: date, payment_method: 'TRANSFER',
                        reference_number: `PAY-DUMMY-${i}`, notes: `${this.DUMMY_TAG} Auto payment`
                    }
                });
            }
            count++;
        }
        return count;
    }

    private static async generatePurchasingData(tx: any, factory: any, productTypes: Record<string, any>, user: any) {
        // 1. Ensure Suppliers
        const suppliers = [
            { code: 'SUP-DUMMY-001', name: 'UD Padi Jaya', contact_person: 'Cahyo', phone: '083456789012' },
            { code: 'SUP-DUMMY-002', name: 'PT Gabah Nusantara', contact_person: 'Slamet', phone: '084567890123' },
            { code: 'SUP-DUMMY-003', name: 'CV Tani Makmur', contact_person: 'Wati', phone: '085678901234' },
        ];
        const supRecords = [];
        for (const s of suppliers) {
            let record = await tx.supplier.findFirst({ where: { code: s.code } });
            if (!record) record = await tx.supplier.create({ data: { ...s, is_active: true } });
            supRecords.push(record);
        }

        // 2. Create POs
        let count = 0;
        const statuses = [PurchaseOrder_status_enum.RECEIVED, PurchaseOrder_status_enum.RECEIVED, PurchaseOrder_status_enum.APPROVED];

        for (let i = 1; i <= 8; i++) {
            const supplier = supRecords[i % supRecords.length];
            const status = statuses[i % statuses.length];
            const date = new Date();
            date.setDate(date.getDate() - i * 3);

            const qty = 10000 + Math.floor(Math.random() * 10000);
            const total = qty * 6000;

            const po = await tx.purchaseOrder.create({
                data: {
                    id_factory: factory.id, id_supplier: supplier.id, id_user: user.id,
                    po_number: `PO-${factory.code}-${String(i).padStart(4, '0')}`,
                    order_date: date, expected_date: date,
                    subtotal: total, tax: Math.round(total * 0.11), total: Math.round(total * 1.11),
                    status, notes: `${this.DUMMY_TAG} Auto-generated PO`
                }
            });

            const poItem = await tx.purchaseOrderItem.create({
                data: {
                    id_purchase_order: po.id, id_product_type: productTypes.GKP.id,
                    quantity: qty, unit_price: 6000, subtotal: total
                }
            });

            if (status === PurchaseOrder_status_enum.RECEIVED) {
                const gr = await tx.goodsReceipt.create({
                    data: {
                        id_purchase_order: po.id, id_user: user.id,
                        receipt_number: `GR-${factory.code}-${i}`, receipt_date: date,
                        notes: `${this.DUMMY_TAG} Auto goods receipt`
                    }
                });
                const gri = await tx.goodsReceiptItem.create({
                    data: {
                        id_goods_receipt: gr.id, id_purchase_order_item: poItem.id,
                        quantity_received: qty
                    }
                });

                // Add Stock Movement for traceability in Worksheet Batch Selection
                const stock = await tx.stock.findFirst({
                    where: { id_factory: factory.id, id_product_type: productTypes.GKP.id }
                });
                if (stock) {
                    await this.createMovement(
                        tx, stock, user, StockMovement_movement_type_enum.IN, qty,
                        'RAW_MATERIAL_RECEIPT', gr.id, date,
                        JSON.stringify({
                            batchId: `BTC-${factory.code}-${String(i).padStart(3, '0')}`,
                            supplier: supplier.name,
                            category: 'Padi/Gabah',
                            qualityGrade: 'KW 1',
                            pricePerKg: 6000,
                            isDummy: true,
                            tag: this.DUMMY_TAG
                        })
                    );
                }
            }
            count++;
        }
        return count;
    }

    private static async recalculateAllStocks(tx: any) {
        const stocks = await tx.stock.findMany();
        for (const s of stocks) {
            const inSum = await tx.stockMovement.aggregate({
                where: { id_stock: s.id, movement_type: 'IN' },
                _sum: { quantity: true }
            });
            const outSum = await tx.stockMovement.aggregate({
                where: { id_stock: s.id, movement_type: 'OUT' },
                _sum: { quantity: true }
            });
            const total = Number(inSum._sum.quantity || 0) - Number(outSum._sum.quantity || 0);
            await tx.stock.update({
                where: { id: s.id },
                data: { quantity: Math.max(0, total) }
            });
        }
    }
}
