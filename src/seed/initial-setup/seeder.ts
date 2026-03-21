/**
 * INITIAL SETUP SEEDER
 * ====================
 * Seeds all initial/master data that should always exist in the system.
 * Called after hard reset to restore essential data.
 */

import bcrypt from 'bcrypt';
import {
    INITIAL_FACTORIES,
    INITIAL_USERS,
    INITIAL_RAW_MATERIAL_CATEGORIES,
    INITIAL_RICE_VARIETIES,
    INITIAL_RICE_LEVELS,
    INITIAL_RICE_BRANDS,
    INITIAL_BY_PRODUCTS,
    INITIAL_QUALITY_PARAMETERS,
} from './data';

export async function seedInitialData(tx: any): Promise<Record<string, number>> {
    const stats: Record<string, number> = {};

    // 1. Factories
    stats.factories = 0;
    for (const f of INITIAL_FACTORIES) {
        const existing = await tx.factory.findFirst({ where: { code: f.code } });
        if (!existing) {
            await tx.factory.create({ data: f });
            stats.factories++;
        }
    }

    // 2. Users
    stats.users = 0;
    const factory = await tx.factory.findFirst({ where: { code: 'PMD-1' } });
    for (const u of INITIAL_USERS) {
        const existing = await tx.user.findFirst({ where: { email: u.email } });
        if (!existing) {
            const hashed = await bcrypt.hash(u.password, 10);
            await tx.user.create({
                data: {
                    email: u.email,
                    password_hash: hashed,
                    fullname: u.fullname,
                    role: u.role as any,
                    is_active: true,
                    id_factory: factory?.id || 1,
                }
            });
            stats.users++;
        }
    }

    // 3. Raw Material Categories
    stats.categories = 0;
    for (const c of INITIAL_RAW_MATERIAL_CATEGORIES) {
        const existing = await tx.rawMaterialCategory.findFirst({ where: { code: c.code } });
        if (!existing) {
            await tx.rawMaterialCategory.create({ data: c });
            stats.categories++;
        }
    }

    // 4. Rice Varieties
    stats.varieties = 0;
    for (const v of INITIAL_RICE_VARIETIES) {
        const existing = await tx.riceVariety.findFirst({ where: { code: v.code } });
        if (!existing) {
            await tx.riceVariety.create({ data: v });
            stats.varieties++;
        }
    }

    // 5. Rice Levels
    stats.levels = 0;
    for (const l of INITIAL_RICE_LEVELS) {
        const existing = await tx.riceLevel.findFirst({ where: { code: l.code } });
        if (!existing) {
            await tx.riceLevel.create({ data: l });
            stats.levels++;
        }
    }

    // 6. Rice Brands
    stats.brands = 0;
    for (const b of INITIAL_RICE_BRANDS) {
        const existing = await tx.riceBrand.findFirst({ where: { code: b.code } });
        if (!existing) {
            await tx.riceBrand.create({ data: b });
            stats.brands++;
        }
    }

    // 7. By Products (as ProductType with side_product_type)
    stats.by_products = 0;
    for (const bp of INITIAL_BY_PRODUCTS) {
        const existing = await tx.productType.findFirst({ where: { code: bp.code } });
        if (!existing) {
            await tx.productType.create({
                data: {
                    code: bp.code,
                    name: bp.name,
                    description: bp.description,
                    unit: 'kg',
                    category: 'SIDE_PRODUCT',
                }
            });
            stats.by_products++;
        }
    }

    // 8. Quality Parameters
    stats.quality_params = 0;
    const existingParams = await tx.qualityParameter.count();
    if (existingParams === 0) {
        const result = await tx.qualityParameter.createMany({ data: INITIAL_QUALITY_PARAMETERS });
        stats.quality_params = result.count;
    }

    // 9. Suppliers
    stats.suppliers = 0;
    const existingSupplier = await tx.supplier.findFirst({ where: { code: 'SUP001' } });
    if (!existingSupplier) {
        await tx.supplier.create({
            data: {
                code: 'SUP001',
                name: 'PADI UMUM',
                contact_person: 'Umum',
                phone: '-',
                is_active: true
            }
        });
        stats.suppliers++;
    }

    return stats;
}
