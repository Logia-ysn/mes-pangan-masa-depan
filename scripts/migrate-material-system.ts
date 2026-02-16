import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting data migration for material restructuring...');

    // 1. Seed RiceVariety dari RawMaterialVariety yang ada
    const rawVarieties = await prisma.rawMaterialVariety.findMany();
    for (const rv of rawVarieties) {
        await prisma.riceVariety.upsert({
            where: { code: rv.code },
            update: {},
            create: {
                code: rv.code,
                name: rv.name,
                description: rv.description,
                is_active: rv.is_active,
            },
        });
    }
    console.log(`✅ Seeded ${rawVarieties.length} rice varieties`);

    // 2. Seed RiceLevel (4 level standar)
    const levels = [
        { code: 'MEDIUM', name: 'Medium', sort_order: 1 },
        { code: 'MEDIUM_SUPER', name: 'Medium Super', sort_order: 2 },
        { code: 'PREMIUM', name: 'Premium', sort_order: 3 },
        { code: 'PREMIUM_SUPER', name: 'Premium Super', sort_order: 4 },
    ];
    for (const level of levels) {
        await prisma.riceLevel.upsert({
            where: { code: level.code },
            update: {},
            create: level,
        });
    }
    console.log('✅ Seeded 4 rice levels');

    // 3. Seed RiceBrand awal
    const brands = [
        { code: 'WALEMU', name: 'Walemu' },
    ];
    for (const brand of brands) {
        await prisma.riceBrand.upsert({
            where: { code: brand.code },
            update: {},
            create: brand,
        });
    }
    console.log(`✅ Seeded ${brands.length} rice brands`);

    // 4. Klasifikasi ProductType existing berdasarkan code
    const allPT = await prisma.productType.findMany();
    for (const pt of allPT) {
        let category: any = null;
        let sideProductType: any = null;

        const code = pt.code.toUpperCase();
        if (['GKP', 'GKG'].includes(code)) {
            category = 'RAW_MATERIAL';
        } else if (['PK', 'GLOSOR'].includes(code)) {
            category = 'INTERMEDIATE';
        } else if (code.startsWith('BRS')) {
            category = 'FINISHED_RICE';
        } else if (['BEKATUL', 'BROKEN', 'MENIR', 'SEKAM', 'REJECT'].includes(code)) {
            category = 'SIDE_PRODUCT';
            sideProductType = code;
        } else if (['MENIR_JITAY', 'MENIR_GULA'].includes(code)) {
            category = 'SIDE_PRODUCT';
            sideProductType = 'MENIR';
        }

        if (category) {
            await prisma.productType.update({
                where: { id: pt.id },
                data: {
                    category: category,
                    side_product_type: sideProductType,
                },
            });
        }
    }
    console.log('✅ Classified existing product types');

    // 5. Buat 5 side product standar jika belum ada
    const sideProducts = [
        { code: 'BEKATUL', name: 'Bekatul', side_product_type: 'BEKATUL' },
        { code: 'BROKEN', name: 'Broken', side_product_type: 'BROKEN' },
        { code: 'MENIR', name: 'Menir', side_product_type: 'MENIR' },
        { code: 'SEKAM', name: 'Sekam', side_product_type: 'SEKAM' },
        { code: 'REJECT', name: 'Reject', side_product_type: 'REJECT' },
    ];
    for (const sp of sideProducts) {
        const existing = await prisma.productType.findFirst({ where: { code: sp.code } });
        if (!existing) {
            await prisma.productType.create({
                data: {
                    code: sp.code,
                    name: sp.name,
                    category: 'SIDE_PRODUCT' as any,
                    side_product_type: sp.side_product_type as any,
                    unit: 'kg',
                },
            });
        } else {
            // Ensure category is set if it was existing but flat
            await prisma.productType.update({
                where: { id: existing.id },
                data: {
                    category: 'SIDE_PRODUCT',
                    side_product_type: sp.side_product_type as any
                }
            });
        }
    }
    console.log('✅ Ensured 5 standard side products exist');

    // 6. Seed FactoryMaterialConfig
    const factories = await prisma.factory.findMany();
    const productTypes = await prisma.productType.findMany();
    const ptMap: Record<string, number> = Object.fromEntries(productTypes.map(pt => [pt.code.toUpperCase(), pt.id]));

    for (const f of factories) {
        const code = f.code.toUpperCase().replace('-', '');
        let inputs: string[] = [];
        let outputs: string[] = [];

        if (code === 'PMD1') {
            inputs = ['GKP', 'GKG'];
            outputs = ['PK', 'GLOSOR', 'BEKATUL', 'BROKEN', 'MENIR', 'SEKAM', 'REJECT'];
        } else if (code === 'PMD2') {
            inputs = ['PK', 'GLOSOR'];
            outputs = ['BEKATUL', 'BROKEN', 'MENIR', 'SEKAM', 'REJECT'];
        }

        for (const ptCode of inputs) {
            if (ptMap[ptCode]) {
                await prisma.factoryMaterialConfig.upsert({
                    where: {
                        id_factory_id_product_type: { id_factory: f.id, id_product_type: ptMap[ptCode] },
                    },
                    update: { is_input: true },
                    create: { id_factory: f.id, id_product_type: ptMap[ptCode], is_input: true, is_output: false },
                });
            }
        }
        for (const ptCode of outputs) {
            if (ptMap[ptCode]) {
                await prisma.factoryMaterialConfig.upsert({
                    where: {
                        id_factory_id_product_type: { id_factory: f.id, id_product_type: ptMap[ptCode] },
                    },
                    update: { is_output: true },
                    create: { id_factory: f.id, id_product_type: ptMap[ptCode], is_input: false, is_output: true },
                });
            }
        }
    }
    console.log('✅ Seeded factory material configs');

    // 7. Backfill WorksheetSideProduct.id_product_type
    const wsps = await prisma.worksheetSideProduct.findMany();
    for (const wsp of wsps) {
        const pt = await prisma.productType.findFirst({ where: { code: wsp.product_code } });
        if (pt) {
            await prisma.worksheetSideProduct.update({
                where: { id: wsp.id },
                data: { id_product_type: pt.id },
            });
        }
    }
    console.log(`✅ Backfilled ${wsps.length} worksheet side product FK refs`);

    // 8. Backfill QualityParameter id_variety -> RiceVariety
    const riceVarieties = await prisma.riceVariety.findMany();
    const rvMap = new Map<string, number>();
    for (const rv of rawVarieties) {
        const match = riceVarieties.find(r => r.code === rv.code);
        if (match) rvMap.set(String(rv.id), match.id);
    }
    const qps = await prisma.qualityParameter.findMany({ where: { id_variety: { not: null } } });
    for (const qp of qps) {
        const newId = rvMap.get(String(qp.id_variety));
        if (newId && newId !== qp.id_variety) {
            await prisma.qualityParameter.update({
                where: { id: qp.id },
                data: { id_variety: newId },
            });
        }
    }
    console.log('✅ Remapped quality parameter variety references');

    console.log('🎉 Data migration complete!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
