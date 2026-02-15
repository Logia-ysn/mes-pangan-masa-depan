/**
 * Worksheet Service
 * Handles production worksheet business logic using Prisma
 */

import {
    Worksheet,
    WorksheetInputBatch,
    WorksheetSideProduct,
    OutputProduct,
    StockMovement,
    Stock,
    ProductType,
    Worksheet_shift_enum,
    StockMovement_movement_type_enum
} from '@prisma/client';
import { prisma } from '../libs/prisma';
import { worksheetRepository, ProductionStats } from '../repositories/worksheet.repository';
import { stockRepository } from '../repositories/stock.repository';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

export interface InputBatchDTO {
    id_stock: number;
    quantity: number;
    unit_price?: number;
}

export interface SideProductDTO {
    product_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_value: number;
    is_auto_calculated: boolean;
    auto_percentage?: number;
}

export interface CreateWorksheetDTO {
    id_factory: number;
    id_user: number;
    worksheet_date: string;
    shift: Worksheet_shift_enum;
    gabah_input: number;
    beras_output: number;
    menir_output?: number;
    dedak_output?: number;
    sekam_output?: number;
    machine_hours?: number;
    downtime_hours?: number;
    downtime_reason?: string;
    notes?: string;
    // New PMD 1 fields
    input_batch_id?: number;
    id_machine?: number;
    input_category_code?: string;
    process_step?: string;
    production_cost?: number;
    // Enhancement fields (HPP Calculation)
    id_output_product?: number;
    process_steps?: string;
    batch_code?: string;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    input_batches?: InputBatchDTO[];
    side_products?: SideProductDTO[];
    id_machines?: number[];
    id_operators?: number[];
}

export interface UpdateWorksheetDTO extends Partial<CreateWorksheetDTO> {
    id: number;
}

// Process step constants for PMD 1
export const PROCESS_STEPS = {
    DRYING: 'DRYING',           // Pengeringan: GKP -> GKG
    HUSKING: 'HUSKING',         // Penggilingan: GKG -> PK + Sekam
    STONE_POLISHING: 'STONE_POLISHING'  // Poles: PK -> Glosor + Bekatul
} as const;

class WorksheetService {
    /**
     * Create new worksheet and update stock
     */
    async createWorksheet(dto: CreateWorksheetDTO): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            // 1. Create and Save Worksheet
            const worksheetData: any = this.mapDtoToWorksheetData(dto);
            worksheetData.rendemen = this.calculateRendemen(dto.gabah_input, dto.beras_output);

            const savedWorksheet = await tx.worksheet.create({
                data: worksheetData
            });

            // 2. Handle Input Batches
            if (dto.input_batches && dto.input_batches.length > 0) {
                await this.handleInputBatches(tx, savedWorksheet, dto.input_batches, dto.id_user);
            } else {
                await this.updateStockFromProductionTransactional(tx, savedWorksheet, dto.id_user);
            }

            // 3. Handle Side Products
            const savedSideProducts: WorksheetSideProduct[] = [];
            if (dto.side_products && dto.side_products.length > 0) {
                for (const spDto of dto.side_products) {
                    const sp = await tx.worksheetSideProduct.create({
                        data: {
                            id_worksheet: savedWorksheet.id,
                            product_code: spDto.product_code,
                            product_name: spDto.product_name,
                            quantity: spDto.quantity,
                            unit_price: spDto.unit_price,
                            total_value: spDto.quantity * (spDto.unit_price || 0),
                            is_auto_calculated: spDto.is_auto_calculated,
                            auto_percentage: spDto.auto_percentage
                        }
                    });
                    savedSideProducts.push(sp);
                }
            }

            // 4. Handle Output Stocks
            await this.addOutputStocksTransactional(tx, savedWorksheet, dto.id_user, savedSideProducts);

            return savedWorksheet;
        });
    }

    private mapDtoToWorksheetData(dto: CreateWorksheetDTO): any {
        return {
            id_factory: dto.id_factory,
            id_user: dto.id_user,
            worksheet_date: new Date(dto.worksheet_date),
            shift: dto.shift,
            gabah_input: dto.gabah_input,
            beras_output: dto.beras_output,
            menir_output: dto.menir_output || 0,
            dedak_output: dto.dedak_output || 0,
            sekam_output: dto.sekam_output || 0,
            machine_hours: dto.machine_hours || 0,
            downtime_hours: dto.downtime_hours || 0,
            downtime_reason: dto.downtime_reason,
            notes: dto.notes,
            id_machine: dto.id_machine,
            process_step: dto.process_step,
            id_output_product: dto.id_output_product,
            batch_code: dto.batch_code,
            raw_material_cost: dto.raw_material_cost || 0,
            side_product_revenue: dto.side_product_revenue || 0,
            hpp: dto.hpp || 0,
            hpp_per_kg: dto.hpp_per_kg || 0,
            process_steps: dto.process_steps,
            id_machines: dto.id_machines ? JSON.stringify(dto.id_machines) : null,
            id_operators: dto.id_operators ? JSON.stringify(dto.id_operators) : null,
        };
    }

    private async handleInputBatches(
        tx: any,
        worksheet: Worksheet,
        batches: InputBatchDTO[],
        userId: number
    ) {
        for (const batchDto of batches) {
            const batch = await tx.worksheetInputBatch.create({
                data: {
                    id_worksheet: worksheet.id,
                    id_stock: batchDto.id_stock,
                    quantity: batchDto.quantity,
                    unit_price: batchDto.unit_price || 0,
                    total_cost: batchDto.quantity * (batchDto.unit_price || 0)
                }
            });

            const stock = await tx.stock.findUnique({
                where: { id: batchDto.id_stock },
                include: { ProductType: true }
            });

            if (stock && stock.ProductType) {
                await this.createStockMovementTransactional(
                    tx,
                    stock.id,
                    userId,
                    StockMovement_movement_type_enum.OUT,
                    batchDto.quantity,
                    'WORKSHEET',
                    worksheet.id,
                    JSON.stringify({
                        type: 'PRODUCTION_INPUT_BATCH',
                        productCode: stock.ProductType.code,
                        batch_id: batch.id,
                        batch_code: worksheet.batch_code
                    })
                );
            }
        }
    }

    private async createStockMovementTransactional(
        tx: any,
        stockId: number,
        userId: number,
        type: StockMovement_movement_type_enum,
        qty: number,
        refType: string,
        refId: number | bigint,
        notes: string
    ) {
        await tx.stockMovement.create({
            data: {
                id_stock: stockId,
                id_user: userId,
                movement_type: type,
                quantity: qty,
                reference_type: refType,
                reference_id: refId,
                notes: notes
            }
        });

        // Update Stock Quantity
        await tx.stock.update({
            where: { id: stockId },
            data: {
                quantity: type === StockMovement_movement_type_enum.IN
                    ? { increment: qty }
                    : { decrement: qty }
            }
        });
    }

    private async updateStockFromProductionTransactional(tx: any, worksheet: Worksheet, userId: number) {
        // Fallback for non-batch production
        const inputProductCode = (worksheet as any).input_category_code || 'GKP';
        const productType = await tx.productType.findFirst({ where: { code: inputProductCode } });
        if (!productType) return;

        const stock = await tx.stock.findFirst({
            where: {
                id_factory: worksheet.id_factory,
                id_product_type: productType.id
            }
        });

        if (stock) {
            await this.createStockMovementTransactional(
                tx,
                stock.id,
                userId,
                StockMovement_movement_type_enum.OUT,
                Number(worksheet.gabah_input),
                'WORKSHEET',
                worksheet.id,
                JSON.stringify({
                    type: 'PRODUCTION_INPUT',
                    productCode: inputProductCode,
                    process_step: (worksheet as any).process_step
                })
            );
        }
    }

    private async addOutputStocksTransactional(
        tx: any,
        worksheet: Worksheet,
        userId: number,
        sideProducts: WorksheetSideProduct[]
    ) {
        // 1. Main Output
        let outputCode = '';
        if (worksheet.id_output_product && Number(worksheet.beras_output) > 0) {
            const op = await tx.productType.findUnique({ where: { id: worksheet.id_output_product } });
            if (op) outputCode = op.code;
        } else if (Number(worksheet.beras_output) > 0) {
            outputCode = worksheet.process_step === PROCESS_STEPS.DRYING ? 'GKG' :
                worksheet.process_step === PROCESS_STEPS.HUSKING ? 'PK' :
                    worksheet.process_step === PROCESS_STEPS.STONE_POLISHING ? 'GLOSOR' : 'BRS-P';
        }

        if (outputCode) {
            const pt = await tx.productType.findFirst({ where: { code: outputCode } });
            if (pt) {
                let stock = await tx.stock.findFirst({
                    where: {
                        id_factory: worksheet.id_factory,
                        id_product_type: pt.id
                    }
                });

                if (!stock) {
                    stock = await tx.stock.create({
                        data: {
                            id_factory: worksheet.id_factory,
                            id_product_type: pt.id,
                            quantity: 0,
                            unit: pt.unit
                        }
                    });
                }

                await this.createStockMovementTransactional(
                    tx,
                    stock.id,
                    userId,
                    StockMovement_movement_type_enum.IN,
                    Number(worksheet.beras_output),
                    'WORKSHEET',
                    worksheet.id,
                    JSON.stringify({
                        type: 'PRODUCTION_OUTPUT',
                        productCode: outputCode,
                        output_type: 'main',
                        batch_code: worksheet.batch_code
                    })
                );
            }
        }

        // 2. Side Products
        for (const sp of sideProducts) {
            if (Number(sp.quantity) > 0) {
                const pt = await tx.productType.findFirst({ where: { code: sp.product_code } });
                if (pt) {
                    let stock = await tx.stock.findFirst({
                        where: {
                            id_factory: worksheet.id_factory,
                            id_product_type: pt.id
                        }
                    });

                    if (!stock) {
                        stock = await tx.stock.create({
                            data: {
                                id_factory: worksheet.id_factory,
                                id_product_type: pt.id,
                                quantity: 0,
                                unit: pt.unit
                            }
                        });
                    }

                    await this.createStockMovementTransactional(
                        tx,
                        stock.id,
                        userId,
                        StockMovement_movement_type_enum.IN,
                        Number(sp.quantity),
                        'WORKSHEET',
                        worksheet.id,
                        JSON.stringify({
                            type: 'PRODUCTION_OUTPUT',
                            productCode: sp.product_code,
                            output_type: 'side_product',
                            batch_code: worksheet.batch_code
                        })
                    );
                }
            }
        }
    }

    calculateRendemen(input: number, output: number): number {
        if (input <= 0) return 0;
        return (output / input) * 100;
    }

    async updateWorksheet(dto: UpdateWorksheetDTO): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({ where: { id: dto.id } });
            if (!worksheet) {
                throw new NotFoundError('Worksheet', dto.id);
            }

            const updateData: any = {};
            if (dto.worksheet_date) updateData.worksheet_date = new Date(dto.worksheet_date);
            if (dto.shift) updateData.shift = dto.shift;
            if (dto.gabah_input !== undefined) updateData.gabah_input = dto.gabah_input;
            if (dto.beras_output !== undefined) updateData.beras_output = dto.beras_output;
            if (dto.menir_output !== undefined) updateData.menir_output = dto.menir_output;
            if (dto.dedak_output !== undefined) updateData.dedak_output = dto.dedak_output;
            if (dto.sekam_output !== undefined) updateData.sekam_output = dto.sekam_output;
            if (dto.machine_hours !== undefined) updateData.machine_hours = dto.machine_hours;
            if (dto.downtime_hours !== undefined) updateData.downtime_hours = dto.downtime_hours;
            if (dto.downtime_reason !== undefined) updateData.downtime_reason = dto.downtime_reason;
            if (dto.notes !== undefined) updateData.notes = dto.notes;
            if (dto.id_machine !== undefined) updateData.id_machine = dto.id_machine;
            if (dto.id_output_product !== undefined) updateData.id_output_product = dto.id_output_product;
            if (dto.batch_code !== undefined) updateData.batch_code = dto.batch_code;
            if (dto.raw_material_cost !== undefined) updateData.raw_material_cost = dto.raw_material_cost;
            if (dto.side_product_revenue !== undefined) updateData.side_product_revenue = dto.side_product_revenue;
            if (dto.hpp !== undefined) updateData.hpp = dto.hpp;
            if (dto.hpp_per_kg !== undefined) updateData.hpp_per_kg = dto.hpp_per_kg;
            if (dto.process_steps !== undefined) updateData.process_steps = dto.process_steps;
            if (dto.id_machines !== undefined) updateData.id_machines = dto.id_machines ? JSON.stringify(dto.id_machines) : null;
            if (dto.id_operators !== undefined) updateData.id_operators = dto.id_operators ? JSON.stringify(dto.id_operators) : null;

            if (dto.gabah_input !== undefined || dto.beras_output !== undefined) {
                updateData.rendemen = this.calculateRendemen(
                    dto.gabah_input ?? Number(worksheet.gabah_input),
                    dto.beras_output ?? Number(worksheet.beras_output)
                );
            }

            const updatedWorksheet = await tx.worksheet.update({
                where: { id: dto.id },
                data: updateData
            });

            if (dto.side_products) {
                await this.revertOutputStocksTransactional(tx, worksheet.id);
                await tx.worksheetSideProduct.deleteMany({ where: { id_worksheet: worksheet.id } });

                const savedSideProducts: WorksheetSideProduct[] = [];
                for (const spDto of dto.side_products) {
                    const sp = await tx.worksheetSideProduct.create({
                        data: {
                            id_worksheet: worksheet.id,
                            product_code: spDto.product_code,
                            product_name: spDto.product_name,
                            quantity: spDto.quantity,
                            unit_price: spDto.unit_price,
                            total_value: spDto.quantity * (spDto.unit_price || 0),
                            is_auto_calculated: spDto.is_auto_calculated,
                            auto_percentage: spDto.auto_percentage
                        }
                    });
                    savedSideProducts.push(sp);
                }

                await this.addOutputStocksTransactional(tx, updatedWorksheet, worksheet.id_user, savedSideProducts);
            }

            return updatedWorksheet;
        });
    }

    private async revertOutputStocksTransactional(tx: any, worksheetId: number): Promise<void> {
        const movements = await tx.stockMovement.findMany({
            where: {
                reference_type: 'WORKSHEET',
                reference_id: worksheetId,
                movement_type: StockMovement_movement_type_enum.IN
            }
        });

        for (const move of movements) {
            await tx.stock.update({
                where: { id: move.id_stock },
                data: {
                    quantity: { decrement: move.quantity },
                }
            });
            await tx.stockMovement.delete({ where: { id: move.id } });
        }
    }

    /**
     * Delete worksheet and reverse all stock movements
     */
    async deleteWorksheet(id: number, userId: number): Promise<boolean> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({
                where: { id },
                include: {
                    WorksheetInputBatch: { include: { Stock: { include: { ProductType: true } } } },
                    WorksheetSideProduct: true
                }
            });

            if (!worksheet) {
                throw new NotFoundError('Worksheet', id);
            }

            // 1. Reverse Input Stock
            // If it used batches
            for (const batch of worksheet.WorksheetInputBatch) {
                if (batch.Stock?.ProductType) {
                    await this.createStockMovementTransactional(
                        tx,
                        batch.id_stock,
                        userId,
                        StockMovement_movement_type_enum.IN,
                        Number(batch.quantity),
                        'WORKSHEET_REVERSAL',
                        worksheet.id,
                        `Reversal input batch ${batch.id} from worksheet deletion`
                    );
                }
            }

            // If it used simple input (fallback)
            if (worksheet.WorksheetInputBatch.length === 0) {
                const inputProductCode = (worksheet as any).input_category_code || 'GKP';
                const pt = await tx.productType.findFirst({ where: { code: inputProductCode } });
                if (pt) {
                    const stock = await tx.stock.findFirst({
                        where: { id_factory: worksheet.id_factory, id_product_type: pt.id }
                    });
                    if (stock) {
                        await this.createStockMovementTransactional(
                            tx,
                            stock.id,
                            userId,
                            StockMovement_movement_type_enum.IN,
                            Number(worksheet.gabah_input),
                            'WORKSHEET_REVERSAL',
                            worksheet.id,
                            `Reversal input from worksheet deletion`
                        );
                    }
                }
            }

            // 2. Reverse Output Stock (Main + Side Products)
            await this.revertOutputStocksTransactional(tx, worksheet.id);

            // 3. Delete related records
            await tx.worksheetInputBatch.deleteMany({ where: { id_worksheet: id } });
            await tx.worksheetSideProduct.deleteMany({ where: { id_worksheet: id } });

            // 4. Delete worksheet
            await tx.worksheet.delete({ where: { id } });

            return true;
        });
    }

    async getWorksheetById(id: number): Promise<Worksheet> {
        const worksheet = await worksheetRepository.findById(id);
        if (!worksheet) {
            throw new NotFoundError('Worksheet', id);
        }
        return worksheet;
    }

    async getWorksheets(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        start_date?: string;
        end_date?: string;
    }): Promise<{ worksheets: Worksheet[], total: number }> {
        return await worksheetRepository.findWithFilters({
            ...params,
            start_date: params.start_date ? new Date(params.start_date) : undefined,
            end_date: params.end_date ? new Date(params.end_date) : undefined
        });
    }

    async getProductionStats(
        factoryId: number,
        startDate?: string,
        endDate?: string
    ): Promise<ProductionStats> {
        return await worksheetRepository.getProductionStats(
            factoryId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );
    }
}

export const worksheetService = new WorksheetService();
