import { T_seedData } from "../types/api/T_seedData";
import { Factory } from "../types/model/table/Factory";
import { Customer } from "../types/model/table/Customer";
import { Employee } from "../types/model/table/Employee";
import { Machine } from "../types/model/table/Machine";
import { Stock } from "../types/model/table/Stock";
import { DailyExpense } from "../types/model/table/DailyExpense";
import { ExpenseCategory } from "../types/model/table/ExpenseCategory";
import { ProductType } from "../types/model/table/ProductType";
import { User } from "../types/model/table/User";
import { Worksheet } from "../types/model/table/Worksheet";
import { Invoice } from "../types/model/table/Invoice";
import { StockMovement } from "../types/model/table/StockMovement";
import { Attendance } from "../types/model/table/Attendance";
import { Maintenance } from "../types/model/table/Maintenance";
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
import { InvoiceStatus } from "../types/model/enum/InvoiceStatus";
import { MovementType } from "../types/model/enum/MovementType";
import { AttendanceStatus } from "../types/model/enum/AttendanceStatus";
import { MaintenanceType } from "../types/model/enum/MaintenanceType";
import { dummyFactories, dummyCategories, dummyCustomers, dummyEmployees, dummyMachines, dummySuppliers } from "./data/dummyData";

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

    // 4. Expense Category
    for (let i = 0; i < dummyCategories.length; i++) {
        const name = dummyCategories[i];
        const exists = await ExpenseCategory.findOne({ where: { name } });
        if (!exists) {
            await ExpenseCategory.save(ExpenseCategory.create({
                code: `EXP-${i + 1}`,
                name: name,
                description: `Kategori ${name}`
            } as any));
        }
    }

    // 5. Customers
    for (let i = 0; i < dummyCustomers.length; i++) {
        const c = dummyCustomers[i];
        const code = `CUST-${i + 1}`;
        if (!await Customer.findOne({ where: { code } })) {
            await Customer.save(Customer.create({
                ...c,
                code,
                is_active: true
            } as any));
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

    // Daily Expense
    const expenseCat = await ExpenseCategory.findOne({ where: { name: "Bahan Bakar" } });
    if (expenseCat && user) {
        const existingExpense = await DailyExpense.findOne({ where: { description: "Beli Solar Genset" } });
        if (!existingExpense) {
            await DailyExpense.save(DailyExpense.create({
                amount: 500000,
                expense_date: new Date(),
                description: "Beli Solar Genset",
                id_factory: factoryId1,
                id_user: userId,
                id_expense_category: expenseCat.id
            } as any));
        }
    }

    // Worksheets - skip if exists
    if (await Worksheet.count() === 0) {
        // Find dependencies
        const machine = await Machine.findOne({ where: { code: 'MSN-001' } }); // Husker
        const outputProduct = await OutputProduct.findOne({ where: { code: 'PK', id_factory: factoryId1 } });
        const stockGabah = await Stock.findOne({ where: { id_factory: factoryId1, id_product_type: (await ProductType.findOne({ where: { code: 'GKP' } }))?.id } });

        // Setup Worksheet
        const wsData: any = {
            id_factory: factoryId1,
            id_user: userId,
            worksheet_date: new Date(),
            shift: WorkshiftType.SHIFT_1,
            gabah_input: 1000,
            beras_output: 600,
            menir_output: 50,
            dedak_output: 100,
            sekam_output: 200,
            rendemen: 60.0,
            machine_hours: 8,
            downtime_hours: 0,
            notes: "Produksi lancar - PMD 1",
            // New Fields
            id_machine: machine?.id,
            id_output_product: outputProduct?.id,
            batch_code: `BATCH-${new Date().getTime()}`,
            production_cost: 500000,
            raw_material_cost: 6000000,
            side_product_revenue: 150000,
            hpp: 6350000,
            hpp_per_kg: 10583.33
        };
        const ws = await Worksheet.save(Worksheet.create(wsData));

        // 1. Input Batch
        if (stockGabah) {
            await WorksheetInputBatch.save(WorksheetInputBatch.create({
                id_worksheet: ws.id,
                id_stock: stockGabah.id,
                quantity: 1000,
                unit_price: 6000,
                total_cost: 6000000,
                batch_code: "IN-BATCH-001"
            } as any));
        }

        // 2. Side Products (Manual creation since no cascade)
        // Sekam
        await WorksheetSideProduct.save(WorksheetSideProduct.create({
            id_worksheet: ws.id,
            product_code: 'SKM',
            product_name: 'Sekam',
            quantity: 200,
            is_auto_calculated: true,
            auto_percentage: 20,
            product_price: 200, // Assuming price
            total_value: 40000
        } as any));

        // Dedak
        await WorksheetSideProduct.save(WorksheetSideProduct.create({
            id_worksheet: ws.id,
            product_code: 'DDK',
            product_name: 'Dedak',
            quantity: 100,
            is_auto_calculated: true,
            auto_percentage: 10,
            product_price: 1500,
            total_value: 150000
        } as any));
    }

    // Invoices
    const cust1 = await Customer.findOne({ where: { code: 'CUST-1' } });
    if (cust1 && await Invoice.count() === 0) {
        await Invoice.save(Invoice.create({
            id_factory: factoryId1,
            id_customer: cust1.id,
            id_user: userId,
            invoice_number: "INV/001/X/2023",
            invoice_date: new Date(),
            due_date: new Date(new Date().setDate(new Date().getDate() + 7)),
            subtotal: 10000000,
            tax: 1100000,
            discount: 0,
            total: 11100000,
            status: InvoiceStatus.PAID,
            notes: "Pembayaran lunas"
        } as any));
    }

    // Stock Movement
    if (stockRaw && await StockMovement.count() === 0) {
        await StockMovement.save(StockMovement.create({
            id_stock: stockRaw.id,
            id_user: userId,
            movement_type: MovementType.IN,
            quantity: 5000,
            reference_type: "PURCHASE",
            notes: "Stok awal"
        } as any));
    }

    // Attendance
    const emp1 = await Employee.findOne({ where: { employee_code: 'EMP-1' } });
    if (emp1 && await Attendance.count() === 0) {
        await Attendance.save(Attendance.create({
            id_employee: emp1.id,
            id_user: userId,
            attendance_date: new Date(),
            check_in_time: new Date(),
            status: AttendanceStatus.PRESENT,
            notes: "Hadir tepat waktu"
        } as any));
    }

    // Maintenance
    const mach1 = await Machine.findOne({ where: { code: 'MSN-001' } });
    if (mach1 && await Maintenance.count() === 0) {
        await Maintenance.save(Maintenance.create({
            id_machine: mach1.id,
            id_user: userId,
            maintenance_type: MaintenanceType.PREVENTIVE,
            maintenance_date: new Date(),
            cost: 150000,
            description: "Ganti oli dan cleaning filter"
        } as any));
    }

    return { message: "Dummy data generated successfully with Process Categories and Output Products" };
}
