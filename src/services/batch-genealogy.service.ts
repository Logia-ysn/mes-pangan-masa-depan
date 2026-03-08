import { prisma } from '../libs/prisma';

export interface GenealogyNode {
    batch_code: string;
    type: 'RECEIPT' | 'PRODUCTION' | 'UNKNOWN' | 'DELIVERY';
    product_name?: string;
    quantity?: number;
    date?: Date;
    details?: any;
    children: GenealogyNode[];
}

export class BatchGenealogyService {

    async traceBackward(batchCode: string, depth = 0): Promise<GenealogyNode> {
        if (depth > 10) return { batch_code: batchCode, type: 'UNKNOWN', children: [] };

        const worksheetAsMain = await prisma.worksheet.findFirst({
            where: { batch_code: batchCode },
            include: {
                ProductType: true,
                Factory: true,
                WorksheetInputBatch: {
                    include: { Stock: { include: { ProductType: true } } }
                }
            }
        });

        if (worksheetAsMain) {
            const children = await Promise.all(
                worksheetAsMain.WorksheetInputBatch.map(async (input) => {
                    return this.traceBackward(input.batch_code || `Unknown-Stock-${input.id_stock}`, depth + 1);
                })
            );

            return {
                batch_code: batchCode,
                type: 'PRODUCTION',
                product_name: worksheetAsMain.ProductType?.name,
                quantity: Number(worksheetAsMain.beras_output),
                date: worksheetAsMain.worksheet_date,
                details: {
                    worksheet_id: worksheetAsMain.id,
                    factory: worksheetAsMain.Factory.name,
                    shift: worksheetAsMain.shift
                },
                children
            };
        }

        const worksheetSide = await prisma.worksheetSideProduct.findFirst({
            where: { batch_code: batchCode },
            include: {
                Worksheet: {
                    include: {
                        Factory: true,
                        WorksheetInputBatch: {
                            include: { Stock: { include: { ProductType: true } } }
                        }
                    }
                }
            }
        });

        if (worksheetSide) {
            const children = await Promise.all(
                worksheetSide.Worksheet.WorksheetInputBatch.map(async (input) => {
                    return this.traceBackward(input.batch_code || `Unknown-Stock-${input.id_stock}`, depth + 1);
                })
            );

            return {
                batch_code: batchCode,
                type: 'PRODUCTION',
                product_name: worksheetSide.product_name,
                quantity: Number(worksheetSide.quantity),
                date: worksheetSide.Worksheet.worksheet_date,
                details: {
                    worksheet_id: worksheetSide.id_worksheet,
                    factory: worksheetSide.Worksheet.Factory.name,
                    is_side_product: true
                },
                children
            };
        }

        const receipt = await prisma.stockMovement.findFirst({
            where: { batch_code: batchCode, movement_type: 'IN', reference_type: 'PO' },
            include: { Stock: { include: { ProductType: true } } }
        });

        if (receipt) {
            return {
                batch_code: batchCode,
                type: 'RECEIPT',
                product_name: receipt.Stock.ProductType.name,
                quantity: Number(receipt.quantity),
                date: receipt.created_at,
                details: {
                    reference_id: receipt.reference_id,
                    notes: receipt.notes
                },
                children: []
            };
        }

        return {
            batch_code: batchCode,
            type: 'UNKNOWN',
            children: []
        };
    }

    async traceForward(batchCode: string, depth = 0): Promise<GenealogyNode> {
        if (depth > 10) return { batch_code: batchCode, type: 'UNKNOWN', children: [] };

        const usages = await prisma.worksheetInputBatch.findMany({
            where: { batch_code: batchCode },
            include: {
                Worksheet: {
                    include: {
                        ProductType: true,
                        WorksheetSideProduct: true
                    }
                },
                Stock: {
                    include: { ProductType: true }
                }
            }
        });

        if (usages.length === 0) {
            const sales = await prisma.stockMovement.findFirst({
                where: { batch_code: batchCode, movement_type: 'OUT', reference_type: 'INVOICE' },
                include: { Stock: { include: { ProductType: true } } }
            });

            if (sales) {
                return {
                    batch_code: batchCode,
                    type: 'DELIVERY',
                    product_name: sales.Stock.ProductType.name,
                    quantity: Number(sales.quantity),
                    date: sales.created_at,
                    details: {
                        invoice_id: sales.reference_id
                    },
                    children: []
                };
            }

            return {
                batch_code: batchCode,
                type: 'UNKNOWN',
                details: { status: 'IN_STOCK' },
                children: []
            };
        }

        const firstUsageStock = usages[0].Stock;

        let initialQty = 0;
        const receipt = await prisma.stockMovement.findFirst({
            where: { batch_code: batchCode, movement_type: 'IN' }
        });
        if (receipt) initialQty = Number(receipt.quantity);

        const node: GenealogyNode = {
            batch_code: batchCode,
            type: depth === 0 ? 'RECEIPT' : 'PRODUCTION',
            product_name: firstUsageStock?.ProductType?.name,
            quantity: initialQty || undefined,
            children: []
        };

        for (const usage of usages) {
            const w = usage.Worksheet;
            if (w.batch_code) {
                const childMain = await this.traceForward(w.batch_code, depth + 1);
                node.children.push({
                    ...childMain,
                });
            }

            for (const sp of w.WorksheetSideProduct) {
                if (sp.batch_code) {
                    const childSP = await this.traceForward(sp.batch_code, depth + 1);
                    node.children.push(childSP);
                }
            }
        }

        return node;
    }
}

export const batchGenealogyService = new BatchGenealogyService();
