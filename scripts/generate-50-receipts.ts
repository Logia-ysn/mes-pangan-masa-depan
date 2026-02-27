import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Starting to generate 50 sample material receipts...");

    const factory = await prisma.factory.findFirst({ where: { code: 'PMD-1' } });
    if (!factory) throw new Error("Factory PMD-1 not found");

    const user = await prisma.user.findFirst({ where: { is_active: true } });
    if (!user) throw new Error("No active user found");

    const supplier = await prisma.supplier.findFirst();
    if (!supplier) throw new Error("No supplier found");

    const productType = await prisma.productType.findFirst({ where: { code: 'PK-IR64' } }); // Use a raw material product type available in PMD-2
    if (!productType) {
        // If not found, use first RAW_MATERIAL
        const firstRaw = await prisma.productType.findFirst({ where: { category: 'RAW_MATERIAL' } });
        if (!firstRaw) throw new Error("No raw material product type found");
        // We ensure stock exists for it in PMD-2
        let stock = await prisma.stock.findFirst({ where: { id_factory: factory.id, id_product_type: firstRaw.id } });
        if (!stock) {
            stock = await prisma.stock.create({
                data: { id_factory: factory.id, id_product_type: firstRaw.id, quantity: 0, unit: firstRaw.unit }
            });
        }
    }

    const typeToUse = productType || (await prisma.productType.findFirst({ where: { category: 'RAW_MATERIAL' } }));

    const stock = await prisma.stock.findFirst({
        where: { id_factory: factory.id, id_product_type: typeToUse!.id }
    });
    if (!stock) throw new Error("Stock not found for PMD-2");

    // Clean up old DUMMY2 data first
    await prisma.rawMaterialQualityAnalysis.deleteMany({
        where: { batch_id: { startsWith: 'BATCH-DUMMY2' } }
    });
    await prisma.materialReceipt.deleteMany({
        where: { notes: { startsWith: '[DUMMY] 50 sample data' } }
    });
    await prisma.stockMovement.deleteMany({
        where: { batch_code: { startsWith: 'BATCH-DUMMY2' } }
    });


    const grades = ['KW 1', 'KW 2', 'KW 2:3', 'KW 3', 'REJECT'];

    let count = 0;
    for (let i = 1; i <= 50; i++) {
        const date = new Date();
        date.setDate(date.getDate() - Math.floor(Math.random() * 30)); // random within last 30 days
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

        const receiptNumber = `MR-DUMMY2-${dateStr}-${String(i).padStart(4, '0')}`;
        const batchCode = `BATCH-DUMMY2-${dateStr}-${i}`;
        const qty = 5000 + Math.floor(Math.random() * 2000);
        const price = 6000 + Math.floor(Math.random() * 500);

        const grade = grades[Math.floor(Math.random() * grades.length)];
        const moisture = 14 + (Math.random() * 4) - 2; // 12 - 16
        const density = 56 + (Math.random() * 5) - 2; // 54 - 61
        const green = Math.random() * 2; // 0-2%
        const yellow = Math.random() * 5; // 0-5%

        const movement = await prisma.stockMovement.create({
            data: {
                id_stock: stock.id,
                id_user: user.id,
                movement_type: 'IN',
                quantity: qty,
                reference_type: 'RAW_MATERIAL_RECEIPT',
                batch_code: batchCode,
                notes: JSON.stringify({
                    batchId: batchCode,
                    supplier: supplier.id,
                    qualityGrade: grade,
                    moistureContent: moisture,
                    density: density,
                    pricePerKg: price,
                    isDummy: true,
                    tag: '[DUMMY]'
                }),
                created_at: date
            }
        });

        await prisma.materialReceipt.create({
            data: {
                receipt_number: receiptNumber,
                id_stock_movement: movement.id,
                id_supplier: supplier.id,
                id_factory: factory.id,
                id_user: user.id,
                id_product_type: typeToUse!.id,
                receipt_date: date,
                batch_code: batchCode,
                quantity: qty,
                unit_price: price,
                total_amount: qty * price,
                status: 'APPROVED',
                notes: `[DUMMY] 50 sample data`,
                approved_by: user.id,
                approved_at: date,
            }
        });

        await prisma.rawMaterialQualityAnalysis.create({
            data: {
                batch_id: batchCode,
                id_stock_movement: movement.id,
                analysis_date: date,
                final_grade: grade,
                moisture_value: moisture,
                density_value: density,
                green_percentage: green,
                yellow_percentage: yellow,
                created_at: date,
                updated_at: date,
                moisture_grade: grade,
                density_grade: grade,
                color_grade: grade
            }
        });

        await prisma.stock.update({
            where: { id: stock.id },
            data: { quantity: { increment: qty } }
        });

        count++;
    }

    console.log(`Successfully generated ${count} dummy material receipts and QC analysis.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
