/**
 * Batch Numbering Service
 * Generates standardized batch codes following the specification:
 *   Raw Material:  {Pabrik}-{Jenis}-{Varietas}-{DDMMYY}-{NomorUrut3digit}
 *   Production:    {Pabrik}-{Jenis}-{Level}-{DDMMYY}-{NomorUrut3digit} (Tanpa Varietas)
 *   Side Product:  {Pabrik}-{Jenis}-{DDMMYY}-{NomorUrut3digit} (Tanpa Varietas)
 *
 * Sequence numbers reset daily and are atomically incremented to prevent race conditions.
 */

import { prisma } from "../libs/prisma";
import { Prisma } from "@prisma/client";



const FALLBACK_JENIS_MAP: Record<string, string> = {
    'RAW_MATERIAL': 'PD',
    'INTERMEDIATE_PK': 'PK',
    'INTERMEDIATE_GLS': 'GLS',
    'FINISHED_RICE': 'BRS',
};

const FALLBACK_VARIETAS_MAP: Record<string, string> = {
    'IR64': 'IR',
    'INTERNATIONAL_RICE': 'IR',
    'CIHERANG': 'CHR',
    'INPARI': 'INP',
    'MUNCUL': 'MCL',
    'KEBO': 'KB',
    'PANDAN_WANGI': 'PW',
    'PANDAN-WANGI': 'PW',
    'MALAYSIA_RACE': 'MR',
    'KETAN': 'KTN',
};

const FALLBACK_LEVEL_MAP: Record<string, string> = {
    'MEDIUM': 'M',
    'MEDIUM_SUPER': 'MS',
    'PREMIUM': 'P',
    'PREMIUM_SUPER': 'PS',
    'PECAH-KULIT': 'PK',
    'PECAH KULIT': 'PK',
};

const SIDE_PRODUCT_CODE_MAP: Record<string, string> = {
    'BEKATUL': 'BKT',
    'BROKEN': 'BRK',
    'MENIR': 'MNR',
    'SEKAM': 'SKM',
    'REJECT': 'RJT',
};

export class BatchNumberingService {

    /**
     * Generate batch code for Raw Material (Bahan Baku)
     * Format: {Pabrik}-{Jenis}-{Varietas}-{DDMMYY}-{NomorUrut}
     * Example: P1-PD-IR-160226-001
     */
    static async generateRawMaterialBatch(
        factoryCode: string,
        productTypeId: number,
        date: Date,
        tx?: Prisma.TransactionClient
    ): Promise<string> {
        const db = tx || prisma;
        const factoryBatch = await this.getFactoryBatchCode(factoryCode, db);
        const { jenisCode, varietasCode } = await this.resolveProductCodes(productTypeId, db);
        const dateStr = this.formatDate(date);

        const prefix = `${factoryBatch}-${jenisCode}-${varietasCode}`;
        const sequenceKey = `${prefix}-${dateStr}`;
        const seq = await this.getNextSequence(sequenceKey, date, db);

        return `${prefix}-${dateStr}-${seq}`;
    }

    /**
     * Generate batch code for Finished Good (Beras Jadi)
     * Format: {Pabrik}-{Jenis}-{Varietas}-{Level}-{DDMMYY}-{NomorUrut}
     * Example: P1-BRS-IR-M-160226-001
     */
    static async generateFinishedGoodBatch(
        factoryCode: string,
        productTypeId: number,
        date: Date,
        tx?: Prisma.TransactionClient
    ): Promise<string> {
        const db = tx || prisma;
        const factoryBatch = await this.getFactoryBatchCode(factoryCode, db);
        const { jenisCode, levelCode } = await this.resolveProductCodes(productTypeId, db);
        const dateStr = this.formatDate(date);

        const parts = [factoryBatch, jenisCode];
        if (levelCode) parts.push(levelCode);
        const prefix = parts.join('-');
        const sequenceKey = `${prefix}-${dateStr}`;
        const seq = await this.getNextSequence(sequenceKey, date, db);

        return `${prefix}-${dateStr}-${seq}`;
    }

    /**
     * Generate batch code for Side Product
     * Format: {Pabrik}-{SideCode}-{Varietas}-{DDMMYY}-{NomorUrut}
     * Example: P1-DDK-IR-160226-001
     */
    static async generateSideProductBatch(
        factoryCode: string,
        sideProductCode: string,
        varietyCode: string, // Kept in signature for compatibility but ignored in prefix
        date: Date,
        tx?: Prisma.TransactionClient
    ): Promise<string> {
        const db = tx || prisma;
        const factoryBatch = await this.getFactoryBatchCode(factoryCode, db);
        const dateStr = this.formatDate(date);

        // Map side product type code to batch code
        const sideCode = SIDE_PRODUCT_CODE_MAP[sideProductCode] || sideProductCode.substring(0, 3).toUpperCase();

        const prefix = `${factoryBatch}-${sideCode}`;
        const sequenceKey = `${prefix}-${dateStr}`;
        const seq = await this.getNextSequence(sequenceKey, date, db);

        return `${prefix}-${dateStr}-${seq}`;
    }

    /**
     * Generate batch code for intermediate products (PK, Glosor)
     * Format: {Pabrik}-{Jenis}-{Varietas}-{DDMMYY}-{NomorUrut}
     * Example: P1-PK-IR-160226-001
     */
    static async generateIntermediateBatch(
        factoryCode: string,
        productTypeId: number,
        date: Date,
        tx?: Prisma.TransactionClient
    ): Promise<string> {
        const db = tx || prisma;
        const factoryBatch = await this.getFactoryBatchCode(factoryCode, db);
        const { jenisCode, levelCode } = await this.resolveProductCodes(productTypeId, db);
        const dateStr = this.formatDate(date);

        const parts = [factoryBatch, jenisCode];
        if (levelCode) parts.push(levelCode); // Intermediate sometimes used as level (PK)

        const prefix = parts.join('-');
        const sequenceKey = `${prefix}-${dateStr}`;
        const seq = await this.getNextSequence(sequenceKey, date, db);

        return `${prefix}-${dateStr}-${seq}`;
    }

    /**
     * Auto-detect product category and generate the appropriate batch code
     */
    static async generateBatchForProduct(
        factoryCode: string,
        productTypeId: number,
        date: Date,
        tx?: Prisma.TransactionClient
    ): Promise<string> {
        const db = tx || prisma;
        const product = await db.productType.findUnique({
            where: { id: productTypeId },
            include: { RiceVariety: true, RiceLevel: true }
        });

        if (!product) {
            throw new Error(`ProductType ${productTypeId} not found`);
        }

        switch (product.category) {
            case 'RAW_MATERIAL':
                return this.generateRawMaterialBatch(factoryCode, productTypeId, date, tx);
            case 'INTERMEDIATE':
                return this.generateIntermediateBatch(factoryCode, productTypeId, date, tx);
            case 'FINISHED_RICE':
                return this.generateFinishedGoodBatch(factoryCode, productTypeId, date, tx);
            case 'SIDE_PRODUCT':
                const varietyCode = product.RiceVariety?.code || 'UNK';
                const sideCode = product.side_product_type || product.code;
                return this.generateSideProductBatch(factoryCode, sideCode, varietyCode, date, tx);
            default:
                // Fallback: use a generic format
                return this.generateRawMaterialBatch(factoryCode, productTypeId, date, tx);
        }
    }

    // ==================== INTERNAL HELPERS ====================

    /**
     * Atomically increment and return the next sequence number for a given key+date.
     * Uses upsert to handle race conditions safely.
     */
    private static async getNextSequence(
        sequenceKey: string,
        date: Date,
        db: any
    ): Promise<string> {
        const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

        const result = await db.batchSequence.upsert({
            where: {
                sequence_key_sequence_date: {
                    sequence_key: sequenceKey,
                    sequence_date: dateOnly
                }
            },
            update: {
                last_number: { increment: 1 }
            },
            create: {
                sequence_key: sequenceKey,
                sequence_date: dateOnly,
                last_number: 1
            }
        });

        return String(result.last_number).padStart(3, '0');
    }

    /**
     * Look up a mapping from the BatchCodeMapping table, with fallback
     */
    private static async getMapping(
        paramType: string,
        paramKey: string,
        db: any
    ): Promise<string | null> {
        try {
            const mapping = await db.batchCodeMapping.findUnique({
                where: {
                    param_type_param_key: {
                        param_type: paramType,
                        param_key: paramKey
                    }
                }
            });
            return mapping?.batch_code || null;
        } catch {
            return null;
        }
    }

    /**
     * Map factory code (e.g. 'PMD-1') to batch code (e.g. 'P1')
     */
    private static async getFactoryBatchCode(factoryCode: string, db: any): Promise<string> {
        // 1. Ambil langsung dari Factory record
        const factory = await db.factory.findFirst({
            where: { code: factoryCode },
            select: { batch_code_prefix: true }
        });
        if (factory?.batch_code_prefix) return factory.batch_code_prefix;

        // 2. Fallback ke BatchCodeMapping table (backward compat)
        const mapped = await this.getMapping('FACTORY', factoryCode, db);
        if (mapped) return mapped;

        // 3. Last resort: generic dari kode factory
        return factoryCode.replace(/[^A-Z0-9]/gi, '').substring(0, 4).toUpperCase();
    }

    /**
     * Resolve a ProductType into its jenis, varietas, and level batch codes
     */
    private static async resolveProductCodes(
        productTypeId: number,
        db: any
    ): Promise<{ jenisCode: string; varietasCode: string; levelCode?: string }> {
        const product = await db.productType.findUnique({
            where: { id: productTypeId },
            include: {
                RiceVariety: true,
                RiceLevel: true
            }
        });

        if (!product) {
            throw new Error(`ProductType ${productTypeId} not found`);
        }

        // Determine jenis code based on category + product code patterns
        let jenisCode = 'UNK';
        const category = product.category || '';
        const code = product.code || '';

        if (category === 'RAW_MATERIAL') {
            jenisCode = await this.getMapping('JENIS', 'RAW_MATERIAL', db) || FALLBACK_JENIS_MAP['RAW_MATERIAL'];
        } else if (category === 'INTERMEDIATE') {
            if (code.includes('PK') || code.includes('PECAH')) {
                jenisCode = await this.getMapping('JENIS', 'INTERMEDIATE_PK', db) || FALLBACK_JENIS_MAP['INTERMEDIATE_PK'];
            } else if (code.includes('GLO') || code.includes('GLOSOR')) {
                jenisCode = await this.getMapping('JENIS', 'INTERMEDIATE_GLS', db) || FALLBACK_JENIS_MAP['INTERMEDIATE_GLS'];
            } else {
                jenisCode = 'INT';
            }
        } else if (category === 'FINISHED_RICE') {
            jenisCode = await this.getMapping('JENIS', 'FINISHED_RICE', db) || FALLBACK_JENIS_MAP['FINISHED_RICE'];
        } else if (category === 'SIDE_PRODUCT') {
            jenisCode = SIDE_PRODUCT_CODE_MAP[product.side_product_type || ''] || code.substring(0, 3).toUpperCase();
        }

        // Determine varietas code
        let varietasCode = 'UNK';
        if (product.RiceVariety) {
            const varietyKey = product.RiceVariety.code;
            varietasCode = await this.getMapping('VARIETAS', varietyKey, db) || FALLBACK_VARIETAS_MAP[varietyKey] || varietyKey.substring(0, 3).toUpperCase();
        }

        // Determine level code (only for finished goods)
        let levelCode: string | undefined;
        if (product.RiceLevel) {
            const levelKey = product.RiceLevel.code;
            levelCode = await this.getMapping('LEVEL', levelKey, db) || FALLBACK_LEVEL_MAP[levelKey] || levelKey.substring(0, 2).toUpperCase();
        }

        return { jenisCode, varietasCode, levelCode };
    }

    /**
     * Format date as DDMMYY
     */
    private static formatDate(date: Date): string {
        const dd = String(date.getDate()).padStart(2, '0');
        const mm = String(date.getMonth() + 1).padStart(2, '0');
        const yy = String(date.getFullYear()).slice(-2);
        return `${dd}${mm}${yy}`;
    }

    /**
     * Seed default BatchCodeMapping entries if the table is empty
     */
    static async seedDefaultMappings(): Promise<number> {
        const count = await prisma.batchCodeMapping.count();
        if (count > 0) return 0;

        const mappings = [
            // Jenis
            { param_type: 'JENIS', param_key: 'RAW_MATERIAL', batch_code: 'PD' },
            { param_type: 'JENIS', param_key: 'INTERMEDIATE_PK', batch_code: 'PK' },
            { param_type: 'JENIS', param_key: 'INTERMEDIATE_GLS', batch_code: 'GLS' },
            { param_type: 'JENIS', param_key: 'FINISHED_RICE', batch_code: 'BRS' },
            { param_type: 'JENIS', param_key: 'BEKATUL', batch_code: 'BKT' },
            { param_type: 'JENIS', param_key: 'SEKAM', batch_code: 'SKM' },
            { param_type: 'JENIS', param_key: 'BROKEN', batch_code: 'BRK' },
            { param_type: 'JENIS', param_key: 'MENIR', batch_code: 'MNR' },
            { param_type: 'JENIS', param_key: 'REJECT', batch_code: 'RJT' },
            // Varietas
            { param_type: 'VARIETAS', param_key: 'IR64', batch_code: 'IR' },
            { param_type: 'VARIETAS', param_key: 'INTERNATIONAL_RICE', batch_code: 'IR' },
            { param_type: 'VARIETAS', param_key: 'CIHERANG', batch_code: 'CHR' },
            { param_type: 'VARIETAS', param_key: 'INPARI', batch_code: 'INP' },
            { param_type: 'VARIETAS', param_key: 'MUNCUL', batch_code: 'MCL' },
            { param_type: 'VARIETAS', param_key: 'KEBO', batch_code: 'KB' },
            { param_type: 'VARIETAS', param_key: 'PANDAN_WANGI', batch_code: 'PW' },
            { param_type: 'VARIETAS', param_key: 'PANDAN-WANGI', batch_code: 'PW' },
            { param_type: 'VARIETAS', param_key: 'MALAYSIA_RACE', batch_code: 'MR' },
            { param_type: 'VARIETAS', param_key: 'KETAN', batch_code: 'KTN' },
            // Level
            { param_type: 'LEVEL', param_key: 'MEDIUM', batch_code: 'M' },
            { param_type: 'LEVEL', param_key: 'MEDIUM_SUPER', batch_code: 'MS' },
            { param_type: 'LEVEL', param_key: 'PREMIUM', batch_code: 'P' },
            { param_type: 'LEVEL', param_key: 'PREMIUM_SUPER', batch_code: 'PS' },
            { param_type: 'LEVEL', param_key: 'PECAH-KULIT', batch_code: 'PK' },
            { param_type: 'LEVEL', param_key: 'PECAH KULIT', batch_code: 'PK' },
        ];

        for (const m of mappings) {
            await prisma.batchCodeMapping.upsert({
                where: {
                    param_type_param_key: {
                        param_type: m.param_type as any,
                        param_key: m.param_key
                    }
                },
                update: { batch_code: m.batch_code },
                create: { ...m, is_active: true }
            });
        }
        return mappings.length;
    }
}
