import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductClassificationService {

    /**
     * Generate SKU code from level + variety + brand (optional)
     * Example: "BRS-PREMIUM-IR-WALEMU" or "BRS-MEDIUM-MUNCUL"
     */
    static generateSKUCode(levelCode: string, varietyCode: string, brandCode?: string): string {
        const parts = ['BRS', levelCode.toUpperCase(), varietyCode.toUpperCase()];
        if (brandCode && brandCode.trim()) {
            parts.push(brandCode.trim().toUpperCase());
        }
        return parts.join('-');
    }

    /**
     * Find or create ProductType for SKU combination
     */
    static async getOrCreateSKU(idRiceLevel: number, idVariety: number, idRiceBrand?: number, idFactory?: number, category: string = 'FINISHED_RICE') {
        const level = await prisma.riceLevel.findUniqueOrThrow({ where: { id: idRiceLevel } });
        const variety = await prisma.riceVariety.findUniqueOrThrow({ where: { id: idVariety } });

        // Brand is optional
        const brand = idRiceBrand ? await prisma.riceBrand.findUnique({ where: { id: idRiceBrand } }) : null;

        const code = this.generateSKUCode(level.code, variety.code, brand?.code);

        // Name: "PREMIUM - IR - WALEMU" or "MEDIUM - IR"
        const nameParts = [level.name, variety.name];
        if (brand) nameParts.push(brand.name);
        const name = nameParts.join(' - ');

        // Check for existing by code
        let product = await prisma.productType.findFirst({
            where: {
                code,
                category: category as any
            }
        });

        if (!product) {
            product = await prisma.productType.create({
                data: {
                    code,
                    name,
                    category: category as any,
                    id_rice_level: idRiceLevel,
                    id_variety: idVariety,
                    id_rice_brand: idRiceBrand || null,
                    unit: 'kg',
                    is_active: true
                },
            });
        }

        // If idFactory is provided, ensure it's in the factory material config as output
        if (idFactory && product) {
            await prisma.factoryMaterialConfig.upsert({
                where: {
                    id_factory_id_product_type: {
                        id_factory: idFactory,
                        id_product_type: product.id
                    }
                },
                update: {
                    is_output: true
                },
                create: {
                    id_factory: idFactory,
                    id_product_type: product.id,
                    is_input: false,
                    is_output: true
                }
            });
        }

        return product;
    }

    /**
     * Get materials allowed for a specific factory
     */
    static async getFactoryMaterials(factoryId: number) {
        const configs = await prisma.factoryMaterialConfig.findMany({
            where: { id_factory: factoryId },
            include: {
                ProductType: {
                    include: {
                        RiceVariety: true,
                        RiceLevel: true,
                        RiceBrand: true
                    }
                }
            },
        });

        return {
            inputs: configs.filter(c => c.is_input).map(c => c.ProductType),
            outputs: configs.filter(c => c.is_output).map(c => c.ProductType),
        };
    }

    /**
     * Get 5 standard side products
     */
    static async getStandardSideProducts() {
        return prisma.productType.findMany({
            where: { category: 'SIDE_PRODUCT', is_active: true },
            orderBy: { code: 'asc' },
        });
    }
}
