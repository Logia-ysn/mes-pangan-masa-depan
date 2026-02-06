import { T_seedData } from "../types/api/T_seedData";
import { Factory } from "../types/model/table/Factory";
import { User } from "../types/model/table/User";
import { Worksheet } from "../types/model/table/Worksheet";
import { StockMovement } from "../types/model/table/StockMovement";
import { Maintenance } from "../types/model/table/Maintenance";
import { Employee } from "../types/model/table/Employee";
import { Machine } from "../types/model/table/Machine";
import { Stock } from "../types/model/table/Stock";
import { ProductType } from "../types/model/table/ProductType";
import { RawMaterialCategory } from "../types/model/table/RawMaterialCategory";
import { RawMaterialVariety } from "../types/model/table/RawMaterialVariety";
import { Supplier } from "../types/model/table/Supplier";
import { ProcessCategory } from "../types/model/table/ProcessCategory";
import { OutputProduct } from "../types/model/table/OutputProduct";
import { Gender } from "../types/model/enum/Gender";
import { EmploymentStatus } from "../types/model/enum/EmploymentStatus";
import { MachineStatus } from "../types/model/enum/MachineStatus";
import { WorkshiftType } from "../types/model/enum/WorkshiftType";
import { WorksheetSideProduct } from "../types/model/table/WorksheetSideProduct";
import { WorksheetInputBatch } from "../types/model/table/WorksheetInputBatch";
import { MaintenanceType } from "../types/model/enum/MaintenanceType";
import { MovementType } from "../types/model/enum/MovementType";
import { dummyFactories, dummyEmployees, dummyMachines, dummySuppliers } from "./data/dummyData";

export const t_seedData: T_seedData = async (req, res) => {
    // 1. Factory - Create PMD 1 and PMD 2
    let factory1: Factory | null = null;
    let factory2: Factory | null = null;

    for (const factoryData of dummyFactories) {
        const exists = await Factory.findOne({ where: { code: factoryData.code } });
        if (!exists) {
            await Factory.save(Factory.create(factoryData as any));
        }
    }

    factory1 = await Factory.findOne({ where: { code: 'PMD-1' } });
    factory2 = await Factory.findOne({ where: { code: 'PMD-2' } });

    if (!factory1) throw new Error("Failed to initialize Factory PMD 1");
    const factoryId1 = factory1.id;
    const factoryId2 = factory2?.id || factoryId1;

    // 1b. User (Needed for expenses)
    const user = await User.findOne({ where: {} });
    const userId = user ? user.id : 1;

    // 2. Process Categories - Main processes that appear in worksheet
    const processCategories = [
        { code: "DRYING", name: "Drying (Pengeringan)", is_main_process: true, display_order: 1 },
        { code: "HUSKING", name: "Husking (Pecah Kulit)", is_main_process: true, display_order: 2 },
        { code: "STONER_POLISHER_1", name: "Stoner Polisher 1", is_main_process: true, display_order: 3 },
        { code: "STONER_POLISHER_2", name: "Stoner Polisher 2", is_main_process: true, display_order: 4 },
        { code: "GRADING", name: "Grading (Pemilahan)", is_main_process: true, display_order: 5 },
        { code: "PACKING", name: "Packing (Pengemasan)", is_main_process: true, display_order: 6 },
        // Secondary processes - don't show in worksheet
        { code: "AYAKAN", name: "Ayakan", is_main_process: false, display_order: 10 },
        { code: "DESTONER", name: "Destoner", is_main_process: false, display_order: 11 },
    ];

    for (const cat of processCategories) {
        const exists = await ProcessCategory.findOne({ where: { code: cat.code } });
        if (!exists) {
            await ProcessCategory.save(ProcessCategory.create({ ...cat, is_active: true } as any));
        }
    }

    // Get process categories for machines
    const procDrying = await ProcessCategory.findOne({ where: { code: 'DRYING' } });
    const procHusking = await ProcessCategory.findOne({ where: { code: 'HUSKING' } });
    const procStoner1 = await ProcessCategory.findOne({ where: { code: 'STONER_POLISHER_1' } });

    // 3. Output Products - Factory specific
    // PMD 1: Pecah Kulit, Glosor
    const pmd1Products = [
        { code: "PK", name: "Pecah Kulit", display_order: 1 },
        { code: "GLOSOR", name: "Glosor", display_order: 2 },
    ];
    for (const prod of pmd1Products) {
        const exists = await OutputProduct.findOne({ where: { id_factory: factoryId1, code: prod.code } });
        if (!exists) {
            await OutputProduct.save(OutputProduct.create({ ...prod, id_factory: factoryId1, is_active: true } as any));
        }
    }

    // PMD 2: Beras Medium, Medium Super, Premium, Premium Super, Custom
    const pmd2Products = [
        { code: "BRS_MEDIUM", name: "Beras Medium", display_order: 1 },
        { code: "BRS_MEDIUM_SUPER", name: "Beras Medium Super", display_order: 2 },
        { code: "BRS_PREMIUM", name: "Beras Premium", display_order: 3 },
        { code: "BRS_PREMIUM_SUPER", name: "Beras Premium Super", display_order: 4 },
        { code: "BRS_CUSTOM", name: "Beras Custom", display_order: 5 },
    ];
    for (const prod of pmd2Products) {
        const exists = await OutputProduct.findOne({ where: { id_factory: factoryId2, code: prod.code } });
        if (!exists) {
            await OutputProduct.save(OutputProduct.create({ ...prod, id_factory: factoryId2, is_active: true } as any));
        }
    }

    // 6. Employees - Distribute between factories
    for (let i = 0; i < dummyEmployees.length; i++) {
        const e = dummyEmployees[i];
        const employee_code = `EMP-${i + 1}`;
        const assignedFactory = i % 2 === 0 ? factoryId1 : factoryId2;
        if (!await Employee.findOne({ where: { employee_code } })) {
            await Employee.save(Employee.create({
                ...e,
                id_factory: assignedFactory,
                employee_code,
                employment_status: EmploymentStatus.PERMANENT,
                join_date: new Date(),
                salary: 3000000,
                is_active: true
            } as any));
        }
    }

    // 7. Suppliers
    for (const sup of dummySuppliers) {
        const exists = await Supplier.findOne({ where: { code: sup.code } });
        if (!exists) {
            await Supplier.save(Supplier.create({
                ...sup,
                is_active: true
            } as any));
        }
    }

    const supplier1 = await Supplier.findOne({ where: { code: 'SUP-001' } });
    const vendorId = supplier1?.id;

    // 8. Machines - Create with process categories
    for (let i = 0; i < dummyMachines.length; i++) {
        const m = dummyMachines[i];
        const assignedFactory = i % 2 === 0 ? factoryId1 : factoryId2;
        const exists = await Machine.findOne({ where: { code: m.code } });
        if (!exists) {
            // Assign process category based on machine type
            let processCategoryId = null;
            if (m.machine_type === 'Husker') processCategoryId = procHusking?.id;
            else if (m.machine_type === 'Polisher') processCategoryId = procStoner1?.id;
            else if (m.machine_type === 'Separator') processCategoryId = procDrying?.id;

            await Machine.save(Machine.create({
                code: m.code,
                name: m.name,
                id_factory: assignedFactory,
                status: MachineStatus.ACTIVE,
                machine_type: m.machine_type,
                serial_number: m.serial_number,
                manufacture_year: m.manufacture_year,
                capacity_per_hour: m.capacity_per_hour,
                purchase_date: new Date(m.manufacture_year, 0, 15),
                vendor_id: vendorId,
                purchase_price: 50000000 + (i * 10000000),
                warranty_months: 12,
                id_process_category: processCategoryId
            } as any));
        }
    }

    // 9. Raw Material Categories
    const rawMaterialCategories = [
        { code: "PADI", name: "Padi/Gabah", description: "Bahan baku berupa padi/gabah" },
        { code: "PK", name: "Pecah Kulit (PK)", description: "Beras pecah kulit" },
        { code: "GLOSOR", name: "Glosor", description: "Beras glosor/setengah jadi" },
        { code: "BERAS", name: "Beras", description: "Beras jadi" },
        { code: "MENIR", name: "Menir", description: "Beras patah/menir" },
        { code: "DEDAK", name: "Dedak", description: "Dedak/bekatul" },
    ];

    for (const cat of rawMaterialCategories) {
        const exists = await RawMaterialCategory.findOne({ where: { code: cat.code } });
        if (!exists) {
            await RawMaterialCategory.save(RawMaterialCategory.create({ ...cat, is_active: true } as any));
        }
    }

    // 10. Raw Material Varieties
    const rawMaterialVarieties = [
        { code: "IR64", name: "IR 64", description: "Varietas IR 64" },
        { code: "IR42", name: "IR 42", description: "Varietas IR 42" },
        { code: "CIHERANG", name: "Ciherang", description: "Varietas Ciherang" },
        { code: "MEKONGGA", name: "Mekongga", description: "Varietas Mekongga" },
        { code: "KEBO", name: "Kebo/Pera", description: "Varietas Kebo/Pera" },
        { code: "KETAN", name: "Ketan", description: "Varietas Ketan" },
        { code: "ROJOLELE", name: "Rojo Lele", description: "Varietas Rojo Lele" },
        { code: "PANDAN", name: "Pandan Wangi", description: "Varietas Pandan Wangi" },
    ];

    for (const variety of rawMaterialVarieties) {
        const exists = await RawMaterialVariety.findOne({ where: { code: variety.code } });
        if (!exists) {
            await RawMaterialVariety.save(RawMaterialVariety.create({ ...variety, is_active: true } as any));
        }
    }

    // 11. ProductType & Stock
    const rawMaterialTypes = [
        { code: "GKP", name: "Gabah Kering Panen", unit: "kg" },
        { code: "GKG", name: "Gabah Kering Giling", unit: "kg" },
        { code: "GKS", name: "Gabah Kering Sawah", unit: "kg" },
        { code: "GBH", name: "Gabah Basah", unit: "kg" },
    ];

    for (const rt of rawMaterialTypes) {
        let pType = await ProductType.findOne({ where: { code: rt.code } });
        if (!pType) {
            pType = await ProductType.save(ProductType.create(rt as any));
        }
        if (pType) {
            const stockExists1 = await Stock.findOne({ where: { id_factory: factoryId1, id_product_type: pType.id } });
            if (!stockExists1) {
                await Stock.save(Stock.create({
                    id_factory: factoryId1,
                    id_product_type: pType.id,
                    quantity: 10000,
                    unit: "kg"
                } as any));
            }
            const stockExists2 = await Stock.findOne({ where: { id_factory: factoryId2, id_product_type: pType.id } });
            if (!stockExists2) {
                await Stock.save(Stock.create({
                    id_factory: factoryId2,
                    id_product_type: pType.id,
                    quantity: 8000,
                    unit: "kg"
                } as any));
            }
        }
    }

    // Finished products
    const finishedProductTypes = [
        { code: "BRS-P", name: "Beras Premium", unit: "kg" },
        { code: "BRS-M", name: "Beras Medium", unit: "kg" },
        { code: "MNR", name: "Menir", unit: "kg" },
        { code: "DDK", name: "Dedak", unit: "kg" },
        { code: "SKM", name: "Sekam", unit: "kg" },
    ];

    for (const ft of finishedProductTypes) {
        let pType = await ProductType.findOne({ where: { code: ft.code } });
        if (!pType) {
            pType = await ProductType.save(ProductType.create(ft as any));
        }
    }

    const pTypeRaw = await ProductType.findOne({ where: { code: "GKP" } });
    if (!pTypeRaw) throw new Error("Failed to initialize Product Type");

    const stockRaw = await Stock.findOne({ where: { id_factory: factoryId1, id_product_type: pTypeRaw.id } });

    // --- RICH DUMMY DATA GENERATION (30 Days) ---

    // Stats counter
    const stats = {
        worksheets: 0,
        movements: 0,
        maintenance: 0,
        days_covered: 30
    };

    // Only generate if no worksheets exist (to avoid duplication on multiple runs without clear)
    if (await Worksheet.count() === 0) {
        console.log("Generating 30 days of dummy data...");

        const machineHusker = await Machine.findOne({ where: { code: 'MSN-001' } });
        const machinePolisher = await Machine.findOne({ where: { code: 'MSN-003' } }); // Assuming 003 is Polisher
        const outputProductPmd1 = await OutputProduct.findOne({ where: { code: 'PK', id_factory: factoryId1 } });

        // Product Types for Stock Movement
        const ptGabah = await ProductType.findOne({ where: { code: 'GKP' } });
        const ptBeras = await ProductType.findOne({ where: { code: 'BRS-P' } });
        const ptSekam = await ProductType.findOne({ where: { code: 'SKM' } });
        const ptDedak = await ProductType.findOne({ where: { code: 'DDK' } });

        // Get Stocks objects
        const stockGabah = await Stock.findOne({ where: { id_factory: factoryId1, id_product_type: ptGabah?.id } });
        const stockBeras = await Stock.findOne({ where: { id_factory: factoryId1, id_product_type: ptBeras?.id } });

        const today = new Date();

        // Loop last 30 days
        for (let i = 30; i >= 0; i--) {
            const currentDate = new Date(today);
            currentDate.setDate(today.getDate() - i);

            // Skip Sundays for realism
            if (currentDate.getDay() === 0) continue;

            // Random 1-3 shifts per day
            const shifts = Math.floor(Math.random() * 3) + 1;

            for (let s = 1; s <= shifts; s++) {
                // Random Input: 5 to 15 tons
                const inputQty = Math.floor(Math.random() * (15000 - 5000 + 1)) + 5000;

                // Random Rendemen: 58% - 64%
                const rendemen = 58 + Math.random() * 6;
                const outputQty = Math.round(inputQty * (rendemen / 100));

                // Byproducts approx
                const sekamQty = Math.round(inputQty * 0.20);
                const dedakQty = Math.round(inputQty * 0.10);
                const menirQty = Math.round(inputQty * 0.05);

                const shiftName = s === 1 ? WorkshiftType.SHIFT_1 : s === 2 ? WorkshiftType.SHIFT_2 : WorkshiftType.SHIFT_3;

                // Create Worksheet
                const ws = await Worksheet.save(Worksheet.create({
                    id_factory: factoryId1,
                    id_user: userId,
                    worksheet_date: currentDate,
                    shift: shiftName,
                    id_machine: machineHusker?.id,
                    id_output_product: outputProductPmd1?.id,
                    batch_code: `BATCH-${currentDate.getFullYear()}${currentDate.getMonth()}${currentDate.getDate()}-${s}`,

                    gabah_input: inputQty,
                    beras_output: outputQty,
                    menir_output: menirQty,
                    dedak_output: dedakQty,
                    sekam_output: sekamQty,
                    rendemen: parseFloat(rendemen.toFixed(2)),

                    machine_hours: 7 + Math.random(), // 7-8 hours
                    downtime_hours: Math.random() > 0.8 ? Math.random() * 2 : 0, // 20% chance of downtime
                    notes: `Auto-generated production data`,

                    production_cost: inputQty * 100, // Dummy calc
                    raw_material_cost: inputQty * 6000,
                    side_product_revenue: (sekamQty * 200) + (dedakQty * 1500),
                    hpp: (inputQty * 6000) + (inputQty * 100) - ((sekamQty * 200) + (dedakQty * 1500)),
                    hpp_per_kg: 0 // Calc later
                } as any));

                stats.worksheets++;

                // Input Batch
                if (stockGabah) {
                    await WorksheetInputBatch.save(WorksheetInputBatch.create({
                        id_worksheet: ws.id,
                        id_stock: stockGabah.id,
                        quantity: inputQty,
                        unit_price: 6000,
                        total_cost: inputQty * 6000,
                        batch_code: `IN-${ws.batch_code}`
                    } as any));

                    // STOCK MOVEMENT OUT (Raw Material)
                    await StockMovement.save(StockMovement.create({
                        id_stock: stockGabah.id,
                        id_user: userId,
                        movement_type: MovementType.OUT,
                        quantity: inputQty,
                        reference_type: "PRODUCTION_INPUT",
                        reference_id: ws.id,
                        created_at: currentDate
                    } as any));
                    stats.movements++;
                }

                // STOCK MOVEMENT IN (Finished Good)
                if (stockBeras) {
                    await StockMovement.save(StockMovement.create({
                        id_stock: stockBeras.id,
                        id_user: userId,
                        movement_type: MovementType.IN,
                        quantity: outputQty,
                        reference_type: "PRODUCTION_OUTPUT",
                        reference_id: ws.id,
                        created_at: currentDate
                    } as any));
                    stats.movements++;
                }

                // Random Maintenance Log (5% chance per shift)
                if (Math.random() < 0.05 && machineHusker) {
                    await Maintenance.save(Maintenance.create({
                        id_machine: machineHusker.id,
                        id_user: userId,
                        maintenance_type: Math.random() > 0.5 ? MaintenanceType.PREVENTIVE : MaintenanceType.CORRECTIVE,
                        maintenance_date: currentDate,
                        cost: 150000 + Math.floor(Math.random() * 500000),
                        description: "Routine maintenance / minor repair",
                        status: "COMPLETED"
                    } as any));
                    stats.maintenance++;
                }
            }
        }

        // Update Final Stock Levels to realistic values
        // Instead of calculating net movement, we just set a "current stock" that makes sense for the dashboard
        if (stockGabah) {
            stockGabah.quantity = 25000 + Math.floor(Math.random() * 10000); // 25-35 tons
            await stockGabah.save();
        }
        if (stockBeras) {
            stockBeras.quantity = 10000 + Math.floor(Math.random() * 5000); // 10-15 tons
            await stockBeras.save();
        }
    }

    return {
        message: "Rich dummy data generated successfully",
        stats: stats
    };
}
