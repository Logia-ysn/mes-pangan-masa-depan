import { EntityManager } from "typeorm";
import { AppDataSource } from "../../data-source";
import { Factory } from "../../types/model/table/Factory";
import { User } from "../../types/model/table/User";
import { ProductType } from "../../types/model/table/ProductType";
import { Stock } from "../../types/model/table/Stock";
import { Machine } from "../../types/model/table/Machine";
import { OutputProduct } from "../../types/model/table/OutputProduct";
import { Supplier } from "../../types/model/table/Supplier";
import { RawMaterialCategory } from "../../types/model/table/RawMaterialCategory";
import { RawMaterialVariety } from "../../types/model/table/RawMaterialVariety";
import { Employee } from "../../types/model/table/Employee";
import { ProcessCategory } from "../../types/model/table/ProcessCategory";
import { Worksheet } from "../../types/model/table/Worksheet";
import { WorksheetInputBatch } from "../../types/model/table/WorksheetInputBatch";
import { WorksheetSideProduct } from "../../types/model/table/WorksheetSideProduct";
import { StockMovement } from "../../types/model/table/StockMovement";
import { Maintenance } from "../../types/model/table/Maintenance";
import { WorkshiftType } from "../../types/model/enum/WorkshiftType";
import { MovementType } from "../../types/model/enum/MovementType";
import { MaintenanceType } from "../../types/model/enum/MaintenanceType";
import { MachineStatus } from "../../types/model/enum/MachineStatus";
import { EmploymentStatus } from "../../types/model/enum/EmploymentStatus";

export class DummyService {

    /**
     * Generate complete dummy data set
     */
    static async generateAll(): Promise<{ status: string; created: any }> {
        return await AppDataSource.transaction(async (manager: EntityManager) => {
            console.log("Starting Dummy Data Generation...");

            const stats = {
                products: 0,
                inventory: 0,
                worksheets: 0,
                transactions: 0,
                machine_logs: 0
            };

            // 1. Ensure Master Data (Factory, User, ProductType, Machine)
            const user = await this.ensureUser(manager);
            const factory = await this.ensureFactory(manager);
            await this.ensureMasterData(manager, factory);
            stats.products = await manager.count(ProductType);

            // 2. Initial Stock (Gabah: 50.000, Beras: 20.000)
            const ptGabah = await manager.findOne(ProductType, { where: { code: 'GKP' } });
            const ptBeras = await manager.findOne(ProductType, { where: { code: 'BRS-P' } });

            if (ptGabah) {
                await this.setStock(manager, factory, ptGabah, 50000, user, "Initial Stock Gabah");
                stats.inventory++;
            }
            if (ptBeras) {
                await this.setStock(manager, factory, ptBeras, 20000, user, "Initial Stock Beras");
                stats.inventory++;
            }

            // 3. Worksheets & Transactions (Last 7 Days)
            const machineHusker = await manager.findOne(Machine, { where: { code: 'MSN-001' } });
            const outputProduct = await manager.findOne(OutputProduct, { where: { code: 'PK', id_factory: factory.id } });
            const stockGabah = await manager.findOne(Stock, { where: { id_factory: factory.id, id_product_type: ptGabah?.id } });
            const stockBeras = await manager.findOne(Stock, { where: { id_factory: factory.id, id_product_type: ptBeras?.id } });

            const today = new Date();
            // Generate data for past 7 days AND next 3 days (Schedule)
            for (let i = 6; i >= -3; i--) {
                const date = new Date(today);
                date.setDate(today.getDate() - i);

                // Skip Sunday
                if (date.getDay() === 0) continue;

                const shifts = [WorkshiftType.SHIFT_1, WorkshiftType.SHIFT_2]; // 2 Shifts per day

                for (const shift of shifts) {
                    // Logic: Input Gabah -> Process -> Output Beras
                    const inputGabah = 5000 + Math.floor(Math.random() * 2000); // 5000-7000 kg
                    const rendemen = 60 + (Math.random() * 4) - 2; // 58-62%
                    const outputBeras = Math.round(inputGabah * (rendemen / 100));

                    const ws = await manager.save(Worksheet, Worksheet.create({
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

                        // Costs (Dummy)
                        production_cost: inputGabah * 100,
                        raw_material_cost: inputGabah * 6000,
                        side_product_revenue: 0,
                        hpp: (inputGabah * 6000) + (inputGabah * 100),
                        hpp_per_kg: 10000
                    } as any));
                    stats.worksheets++;

                    // Helper to create stock movement
                    if (stockGabah) {
                        await this.createMovement(manager, stockGabah, user, MovementType.OUT, inputGabah, "PRODUCTION_INPUT", ws.id, date);
                        stats.transactions++;
                    }
                    if (stockBeras) {
                        await this.createMovement(manager, stockBeras, user, MovementType.IN, outputBeras, "PRODUCTION_OUTPUT", ws.id, date);
                        stats.transactions++;
                    }
                }

                // Random Machine Log / Maintenance
                if (Math.random() > 0.7 && machineHusker) {
                    await manager.save(Maintenance, Maintenance.create({
                        id_machine: machineHusker.id,
                        id_user: user.id,
                        maintenance_type: MaintenanceType.PREVENTIVE,
                        maintenance_date: date,
                        cost: 100000,
                        description: "Routine check",
                        status: "COMPLETED"
                    } as any));
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
     * Reset all transactional data, preserving masters
     */
    static async resetAll(): Promise<{ status: string; deleted: any }> {
        return await AppDataSource.transaction(async (manager: EntityManager) => {
            console.log("Starting Data Reset...");

            const stats = {
                inventory: 0,
                worksheets: 0,
                transactions: 0,
                logs: 0
            };

            // Delete Child Tables first to avoid FK constraint errors
            const deleteResultMovements = await manager.delete(StockMovement, {});
            stats.transactions = deleteResultMovements.affected || 0;

            await manager.delete(WorksheetSideProduct, {});
            await manager.delete(WorksheetInputBatch, {});

            const deleteResultWs = await manager.delete(Worksheet, {});
            stats.worksheets = deleteResultWs.affected || 0;

            const deleteResultMaint = await manager.delete(Maintenance, {});
            stats.logs = deleteResultMaint.affected || 0;

            // Reset Stock Quantities to 0
            const updateStock = await manager.update(Stock, {}, { quantity: 0 });
            stats.inventory = updateStock.affected || 0;

            console.log("Reset Complete", stats);
            return {
                status: "success",
                deleted: stats
            };
        });
    }

    // --- Helpers ---

    private static async ensureUser(manager: EntityManager): Promise<User> {
        let user = await manager.findOne(User, { where: {} });
        if (!user) {
            // Should usually exist from seed-superuser, but fallback just in case
            throw new Error("User master data missing. Please run basic seed.");
        }
        return user;
    }

    private static async ensureFactory(manager: EntityManager): Promise<Factory> {
        let factory = await manager.findOne(Factory, { where: { code: 'PMD-1' } });
        if (!factory) {
            factory = await manager.save(Factory, Factory.create({
                code: 'PMD-1', name: 'Pabrik Utama', address: 'Jateng', is_active: true
            } as any));
        }
        return factory;
    }

    private static async ensureMasterData(manager: EntityManager, factory: Factory) {
        // Product Types
        const products = [
            { code: "GKP", name: "Gabah Kering Panen", unit: "kg" },
            { code: "BRS-P", name: "Beras Premium", unit: "kg" },
            { code: "SKM", name: "Sekam", unit: "kg" },
            { code: "DDK", name: "Dedak", unit: "kg" }
        ];
        for (const p of products) {
            if (!await manager.findOne(ProductType, { where: { code: p.code } })) {
                await manager.save(ProductType, ProductType.create(p as any));
            }
        }

        // Machines
        const machines = [
            { code: "MSN-001", name: "Husker A", machine_type: "Husker" },
            { code: "MSN-002", name: "Separator A", machine_type: "Separator" },
            { code: "MSN-003", name: "Polisher A", machine_type: "Polisher" }
        ];
        for (const m of machines) {
            if (!await manager.findOne(Machine, { where: { code: m.code } })) {
                await manager.save(Machine, Machine.create({
                    ...m, id_factory: factory.id, status: MachineStatus.ACTIVE,
                    serial_number: `SN-${m.code}`, manufacture_year: 2023,
                    capacity_per_hour: 2000, purchase_date: new Date()
                } as any));
            }
        }

        // Output Product config
        if (!await manager.findOne(OutputProduct, { where: { code: 'PK' } })) {
            await manager.save(OutputProduct, OutputProduct.create({
                id_factory: factory.id, code: 'PK', name: 'Pecah Kulit', is_active: true, display_order: 1
            } as any));
        }

        // Raw Material Categories
        if (!await manager.findOne(RawMaterialCategory, { where: { code: 'PADI' } })) {
            await manager.save(RawMaterialCategory, RawMaterialCategory.create({
                code: 'PADI', name: 'Padi/Gabah', is_active: true
            } as any));
        }

        // Varieties
        if (!await manager.findOne(RawMaterialVariety, { where: { code: 'IR64' } })) {
            await manager.save(RawMaterialVariety, RawMaterialVariety.create({
                code: 'IR64', name: 'IR 64', is_active: true
            } as any));
        }

        // Ensure Stocks exist (at 0)
        const allTypes = await manager.find(ProductType);
        for (const pt of allTypes) {
            if (!await manager.findOne(Stock, { where: { id_factory: factory.id, id_product_type: pt.id } })) {
                await manager.save(Stock, Stock.create({
                    id_factory: factory.id, id_product_type: pt.id, quantity: 0, unit: pt.unit
                } as any));
            }
        }
    }

    private static async setStock(manager: EntityManager, factory: Factory, pt: ProductType, qty: number, user: User, note: string) {
        let stock = await manager.findOne(Stock, { where: { id_factory: factory.id, id_product_type: pt.id } });
        if (!stock) {
            stock = await manager.save(Stock, Stock.create({
                id_factory: factory.id, id_product_type: pt.id, quantity: 0, unit: pt.unit
            } as any));
        }

        // Adjust diff
        const diff = qty - stock.quantity;
        if (diff !== 0) {
            const type = diff > 0 ? MovementType.IN : MovementType.OUT;
            await this.createMovement(manager, stock, user, type, Math.abs(diff), "ADJUSTMENT", 0, new Date(), note);

            stock.quantity = qty;
            await manager.save(Stock, stock); // Explicit save within transaction
        }
    }

    private static async createMovement(
        manager: EntityManager,
        stock: Stock,
        user: User,
        type: MovementType,
        qty: number,
        refType: string,
        refId: number,
        date: Date,
        note?: string
    ) {
        await manager.save(StockMovement, StockMovement.create({
            id_stock: stock.id,
            id_user: user.id,
            movement_type: type,
            quantity: qty,
            reference_type: refType,
            reference_id: refId,
            created_at: date,
            notes: note || ""
        } as any));

        // Note: We don't update Stock quantity here because we might strictly control it, 
        // OR we should. For generateAll, we want the final state to match the logic. 
        // In the loop above, we didn't update Stock object, so let's check.
        // Actually, for consistency in the loop, we should update the stock object too if we assume it tracks live.
        // However, for the 'dummy' generator, we can just set the final stock at the end or let the loop update it.
        // Let's rely on setStock for initial, and let the loop logic be just creating records. 
        // Wait, if we want "Stok akhir = stok awal + incoming - outgoing", strictly:
        // We set 50k, 20k INITIAL. Then we do transactions. We should update the stock quantity record to reflect the transactions.

        if (type === MovementType.IN) stock.quantity = Number(stock.quantity) + qty;
        else stock.quantity = Number(stock.quantity) - qty;

        await manager.save(Stock, stock);
    }
}
