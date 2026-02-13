/**
 * Dummy Service
 * Handles dummy data generation using Prisma
 */

import { prisma } from "../libs/prisma";
import {
    Worksheet_shift_enum,
    StockMovement_movement_type_enum,
    Maintenance_maintenance_type_enum,
    Machine_status_enum
} from "@prisma/client";

export class DummyService {

    /**
     * Generate complete dummy data set
     */
    static async generateAll(): Promise<{ status: string; created: any }> {
        return await prisma.$transaction(async (tx) => {
            console.log("Starting Dummy Data Generation...");

            const stats = {
                products: 0,
                inventory: 0,
                worksheets: 0,
                transactions: 0,
                machine_logs: 0
            };

            // 1. Ensure Master Data (Factory, User, ProductType, Machine)
            const user = await this.ensureUser(tx);
            const factory = await this.ensureFactory(tx);
            await this.ensureMasterData(tx, factory);
            stats.products = await tx.productType.count();

            // 2. Initial Stock (Gabah: 50.000, Beras: 20.000)
            const ptGabah = await tx.productType.findFirst({ where: { code: 'GKP' } });
            const ptBeras = await tx.productType.findFirst({ where: { code: 'BRS-P' } });

            if (ptGabah) {
                await this.setStock(tx, factory, ptGabah, 50000, user, "Initial Stock Gabah");
                stats.inventory++;
            }
            if (ptBeras) {
                await this.setStock(tx, factory, ptBeras, 20000, user, "Initial Stock Beras");
                stats.inventory++;
            }

            // 3. Worksheets & Transactions (Last 7 Days)
            const machineHusker = await tx.machine.findFirst({ where: { code: 'MSN-001' } });
            const outputProduct = await tx.outputProduct.findFirst({ where: { code: 'PK', id_factory: factory.id } });
            const stockGabah = await tx.stock.findFirst({ where: { id_factory: factory.id, id_product_type: ptGabah?.id } });
            const stockBeras = await tx.stock.findFirst({ where: { id_factory: factory.id, id_product_type: ptBeras?.id } });

            const today = new Date();
            // Generate data for past 7 days AND next 3 days (Schedule)
            for (let i = 6; i >= -3; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);

                // Skip Sunday
                if (date.getDay() === 0) continue;

                const shifts = [Worksheet_shift_enum.SHIFT_1, Worksheet_shift_enum.SHIFT_2];

                for (const shift of shifts) {
                    const inputGabah = 5000 + Math.floor(Math.random() * 2000); // 5000-7000 kg
                    const rendemen = 60 + (Math.random() * 4) - 2; // 58-62%
                    const outputBeras = Math.round(inputGabah * (rendemen / 100));

                    const ws = await tx.worksheet.create({
                        data: {
                            id_factory: factory.id,
                            id_user: user.id,
                            worksheet_date: date,
                            shift: shift,
                            id_machine: machineHusker?.id,
                            id_output_product: outputProduct?.id,
                            batch_code: `BATCH-${date.getTime()}-${shift}`,
                            gabah_input: inputGabah,
                            beras_output: outputBeras,
                            menir_output: Math.round(inputGabah * 0.05),
                            dedak_output: Math.round(inputGabah * 0.10),
                            sekam_output: Math.round(inputGabah * 0.20),
                            rendemen: parseFloat(rendemen.toFixed(2)),
                            machine_hours: 8,
                            downtime_hours: 0,
                            notes: "Auto-generated",
                            production_cost: inputGabah * 100,
                            raw_material_cost: inputGabah * 6000,
                            side_product_revenue: 0,
                            hpp: (inputGabah * 6000) + (inputGabah * 100),
                            hpp_per_kg: 10000
                        }
                    });
                    stats.worksheets++;

                    if (stockGabah) {
                        await this.createMovement(tx, stockGabah, user, StockMovement_movement_type_enum.OUT, inputGabah, "WORKSHEET", ws.id, date);
                        stats.transactions++;
                    }
                    if (stockBeras) {
                        await this.createMovement(tx, stockBeras, user, StockMovement_movement_type_enum.IN, outputBeras, "WORKSHEET", ws.id, date);
                        stats.transactions++;
                    }
                }

                if (Math.random() > 0.7 && machineHusker) {
                    await tx.maintenance.create({
                        data: {
                            id_machine: machineHusker.id,
                            id_user: user.id,
                            maintenance_type: Maintenance_maintenance_type_enum.PREVENTIVE,
                            maintenance_date: date,
                            cost: 100000,
                            description: "Routine check",
                            status: "COMPLETED"
                        }
                    });
                    stats.machine_logs++;
                }
            }

            console.log("Dummy Generation Complete", stats);
            return {
                status: "success",
                created: stats
            };
        });
    }

    /**
     * Reset all transactional data
     */
    static async resetAll(): Promise<{ status: string; deleted: any }> {
        return await prisma.$transaction(async (tx) => {
            console.log("Starting Data Reset...");

            const stats = {
                inventory: 0,
                worksheets: 0,
                transactions: 0,
                logs: 0
            };

            const movements = await tx.stockMovement.deleteMany({});
            stats.transactions = movements.count;

            await tx.worksheetSideProduct.deleteMany({});
            await tx.worksheetInputBatch.deleteMany({});

            const worksheets = await tx.worksheet.deleteMany({});
            stats.worksheets = worksheets.count;

            const maintenances = await tx.maintenance.deleteMany({});
            stats.logs = maintenances.count;

            const stocks = await tx.stock.updateMany({
                data: { quantity: 0 }
            });
            stats.inventory = stocks.count;

            console.log("Reset Complete", stats);
            return {
                status: "success",
                deleted: stats
            };
        });
    }

    // --- Helpers ---

    private static async ensureUser(tx: any): Promise<any> {
        const user = await tx.user.findFirst();
        if (!user) {
            throw new Error("User master data missing. Please run basic seed.");
        }
        return user;
    }

    private static async ensureFactory(tx: any): Promise<any> {
        let factory = await tx.factory.findFirst({ where: { code: 'PMD-1' } });
        if (!factory) {
            factory = await tx.factory.create({
                data: {
                    code: 'PMD-1', name: 'Pabrik Utama', address: 'Jateng', is_active: true
                }
            });
        }
        return factory;
    }

    private static async ensureMasterData(tx: any, factory: any) {
        const products = [
            { code: "GKP", name: "Gabah Kering Panen", unit: "kg" },
            { code: "BRS-P", name: "Beras Premium", unit: "kg" },
            { code: "SKM", name: "Sekam", unit: "kg" },
            { code: "DDK", name: "Dedak", unit: "kg" }
        ];
        for (const p of products) {
            const exists = await tx.productType.findFirst({ where: { code: p.code } });
            if (!exists) {
                await tx.productType.create({ data: p });
            }
        }

        const machines = [
            { code: "MSN-001", name: "Husker A", machine_type: "Husker" },
            { code: "MSN-002", name: "Separator A", machine_type: "Separator" },
            { code: "MSN-003", name: "Polisher A", machine_type: "Polisher" }
        ];
        for (const m of machines) {
            const exists = await tx.machine.findFirst({ where: { code: m.code } });
            if (!exists) {
                await tx.machine.create({
                    data: {
                        ...m,
                        id_factory: factory.id,
                        status: Machine_status_enum.ACTIVE,
                        serial_number: `SN-${m.code}`,
                        manufacture_year: 2023,
                        capacity_per_hour: 2000,
                        purchase_date: new Date()
                    }
                });
            }
        }

        const existsOutput = await tx.outputProduct.findFirst({ where: { code: 'PK' } });
        if (!existsOutput) {
            await tx.outputProduct.create({
                data: {
                    id_factory: factory.id, code: 'PK', name: 'Pecah Kulit', is_active: true, display_order: 1
                }
            });
        }

        const existsCat = await tx.rawMaterialCategory.findFirst({ where: { code: 'PADI' } });
        if (!existsCat) {
            await tx.rawMaterialCategory.create({
                data: {
                    code: 'PADI', name: 'Padi/Gabah', is_active: true
                }
            });
        }

        const existsVar = await tx.rawMaterialVariety.findFirst({ where: { code: 'IR64' } });
        if (!existsVar) {
            await tx.rawMaterialVariety.create({
                data: {
                    code: 'IR64', name: 'IR 64', is_active: true
                }
            });
        }

        const allTypes = await tx.productType.findMany();
        for (const pt of allTypes) {
            const existsStock = await tx.stock.findFirst({ where: { id_factory: factory.id, id_product_type: pt.id } });
            if (!existsStock) {
                await tx.stock.create({
                    data: {
                        id_factory: factory.id, id_product_type: pt.id, quantity: 0, unit: pt.unit
                    }
                });
            }
        }
    }

    private static async setStock(tx: any, factory: any, pt: any, qty: number, user: any, note: string) {
        let stock = await tx.stock.findFirst({ where: { id_factory: factory.id, id_product_type: pt.id } });
        if (!stock) {
            stock = await tx.stock.create({
                data: {
                    id_factory: factory.id, id_product_type: pt.id, quantity: 0, unit: pt.unit
                }
            });
        }

        const diff = qty - Number(stock.quantity);
        if (diff !== 0) {
            const type = diff > 0 ? StockMovement_movement_type_enum.IN : StockMovement_movement_type_enum.OUT;
            await this.createMovement(tx, stock, user, type, Math.abs(diff), "ADJUSTMENT", 0, new Date(), note);

            await tx.stock.update({
                where: { id: stock.id },
                data: { quantity: qty }
            });
        }
    }

    private static async createMovement(
        tx: any,
        stock: any,
        user: any,
        type: StockMovement_movement_type_enum,
        qty: number,
        refType: string,
        refId: number | bigint,
        date: Date,
        note?: string
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
                notes: note || ""
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
}
