const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
    console.log('Seeding initial data...');

    // Categories
    for (const c of [{ code: 'GKP', name: 'Padi Basah' }, { code: 'GKG', name: 'Padi Kering' }]) {
        const e = await p.rawMaterialCategory.findFirst({ where: { code: c.code } });
        if (!e) { await p.rawMaterialCategory.create({ data: { ...c, is_active: true } }); console.log('+ Cat:', c.code) }
        else console.log('= Cat:', c.code)
    }

    // Varieties
    for (const v of [{ code: '32', name: '32' }, { code: '64', name: '64' }, { code: 'KEBO', name: 'Kebo' }, { code: 'MUNCUL', name: 'Muncul' }, { code: 'KETAN', name: 'Ketan' }, { code: 'MR', name: 'MR' }]) {
        const e = await p.riceVariety.findFirst({ where: { code: v.code } });
        if (!e) { await p.riceVariety.create({ data: v }); console.log('+ Var:', v.code) }
        else console.log('= Var:', v.code)
    }

    // Levels
    for (const l of [{ code: 'PK', name: 'Pecah Kulit', sort_order: 6 }, { code: 'GLO', name: 'Glosor', sort_order: 5 }, { code: 'MED', name: 'Medium', sort_order: 4 }, { code: 'MED-S', name: 'Medium Super', sort_order: 3 }, { code: 'PRM', name: 'Premium', sort_order: 2 }, { code: 'PRM-S', name: 'Premium Super', sort_order: 1 }]) {
        const e = await p.riceLevel.findFirst({ where: { code: l.code } });
        if (!e) { await p.riceLevel.create({ data: l }); console.log('+ Lvl:', l.code) }
        else console.log('= Lvl:', l.code)
    }

    // Brands
    for (const b of [{ code: 'WLM', name: 'Walemu' }, { code: 'CR', name: 'Cruise' }, { code: 'DK', name: 'Doa Kyai' }, { code: 'PJ', name: 'Pagi Jaya' }]) {
        const e = await p.riceBrand.findFirst({ where: { code: b.code } });
        if (!e) { await p.riceBrand.create({ data: b }); console.log('+ Brand:', b.code) }
        else console.log('= Brand:', b.code)
    }

    // By Products
    for (const bp of [{ code: 'BRK-B', name: 'Broken Besar' }, { code: 'BRK-K', name: 'Broken Kecil' }, { code: 'BKT', name: 'Bekatul' }, { code: 'RJC', name: 'Riject' }, { code: 'SKM-BP', name: 'Sekam' }]) {
        const e = await p.productType.findFirst({ where: { code: bp.code } });
        if (!e) { await p.productType.create({ data: { ...bp, unit: 'kg', category: 'SIDE_PRODUCT' } }); console.log('+ BP:', bp.code) }
        else console.log('= BP:', bp.code)
    }

    console.log('Done!');
}

main().then(() => p.$disconnect()).catch(e => { console.error(e); p.$disconnect(); process.exit(1); });
