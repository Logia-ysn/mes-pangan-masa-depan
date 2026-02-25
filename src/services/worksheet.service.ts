/**
 * Worksheet Service
 * Handles production worksheet business logic using Prisma
 * 
 * Workflow: DRAFT → SUBMITTED → COMPLETED (via Approve)
 *                            → REJECTED → DRAFT (edit & resubmit)
 * Cancel: DRAFT/SUBMITTED/COMPLETED → CANCELLED (COMPLETED triggers stock reversal)
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
    Worksheet_status_enum,
    StockMovement_movement_type_enum
} from '@prisma/client';
import { prisma } from '../libs/prisma';
import { worksheetRepository, ProductionStats } from '../repositories/worksheet.repository';
import { stockRepository } from '../repositories/stock.repository';
import { NotFoundError, BusinessRuleError } from '../utils/errors';
import { BatchNumberingService } from './batch-numbering.service';
import { auditService } from './audit.service';
export interface InputBatchDTO {
    id_stock: number;
    quantity: number;
    unit_price?: number;
    batch_code?: string;
}

export interface SideProductDTO {
    id_product_type?: number;
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
    id_input_product_type?: number;
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
     * Create new worksheet as DRAFT — NO stock movement yet
     * Stock only moves when Supervisor approves (approveWorksheet)
     */
    async createWorksheet(dto: CreateWorksheetDTO): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            // 0. Get Factory for batch code generation
            const factory = await tx.factory.findUnique({ where: { id: dto.id_factory } });
            const factoryCode = factory?.code || 'PMD-1';
            const wsDate = new Date(dto.worksheet_date);

            // 1. Auto-generate batch code for output if not provided
            let batchCode = dto.batch_code;
            if (!batchCode && dto.id_output_product) {
                batchCode = await BatchNumberingService.generateBatchForProduct(
                    factoryCode,
                    dto.id_output_product,
                    wsDate,
                    tx
                );
            }

            // 2. Create Worksheet as DRAFT — NO stock movement
            const worksheetData: any = this.mapDtoToWorksheetData(dto);
            worksheetData.rendemen = this.calculateRendemen(dto.gabah_input, dto.beras_output);
            worksheetData.batch_code = batchCode || worksheetData.batch_code;
            worksheetData.status = Worksheet_status_enum.DRAFT;

            const savedWorksheet = await tx.worksheet.create({
                data: worksheetData
            });

            // 3. Save Input Batches as DATA ONLY (no stock movement)
            if (dto.input_batches && dto.input_batches.length > 0) {
                for (const batchDto of dto.input_batches) {
                    await tx.worksheetInputBatch.create({
                        data: {
                            id_worksheet: savedWorksheet.id,
                            id_stock: batchDto.id_stock,
                            quantity: batchDto.quantity,
                            unit_price: batchDto.unit_price || 0,
                            total_cost: batchDto.quantity * (batchDto.unit_price || 0),
                            batch_code: batchDto.batch_code
                        }
                    });
                }
            }

            // 4. Save Side Products as DATA ONLY (no stock movement)
            if (dto.side_products && dto.side_products.length > 0) {
                let inputVarietyCode = 'UNK';
                if (dto.id_input_product_type) {
                    const inputPt = await tx.productType.findUnique({
                        where: { id: dto.id_input_product_type },
                        include: { RiceVariety: true }
                    });
                    if (inputPt?.RiceVariety) inputVarietyCode = (inputPt.RiceVariety as any).code;
                }

                for (const spDto of dto.side_products) {
                    let spBatchCode: string | undefined;
                    const sideType = spDto.product_code?.toUpperCase() || '';
                    let sideProductType = sideType;
                    if (sideType === 'SKM' || sideType.includes('SEKAM')) sideProductType = 'SEKAM';
                    else if (sideType === 'DDK' || sideType.includes('DEDAK') || sideType.includes('BEKATUL')) sideProductType = 'BEKATUL';
                    else if (sideType === 'MNR' || sideType.includes('MENIR')) sideProductType = 'MENIR';
                    else if (sideType.includes('BROKEN')) sideProductType = 'BROKEN';

                    try {
                        spBatchCode = await BatchNumberingService.generateSideProductBatch(
                            factoryCode, sideProductType, inputVarietyCode, wsDate, tx
                        );
                    } catch (e) {
                        console.warn('Failed to generate side product batch code:', e);
                    }

                    await tx.worksheetSideProduct.create({
                        data: {
                            id_worksheet: savedWorksheet.id,
                            id_product_type: spDto.id_product_type,
                            product_code: spDto.product_code,
                            product_name: spDto.product_name,
                            quantity: spDto.quantity,
                            unit_price: spDto.unit_price,
                            total_value: spDto.quantity * (spDto.unit_price || 0),
                            is_auto_calculated: spDto.is_auto_calculated,
                            auto_percentage: spDto.auto_percentage,
                            batch_code: spBatchCode || null
                        }
                    });
                }
            }

            // Audit Log: CREATE
            await auditService.log({
                userId: dto.id_user,
                action: 'CREATE',
                tableName: 'Worksheet',
                recordId: savedWorksheet.id,
                newValue: {
                    batch_code: savedWorksheet.batch_code,
                    factory: dto.id_factory,
                    gabah_input: dto.gabah_input
                }
            }, tx);

            // NOTE: No stock movement — will happen when Supervisor approves
            return savedWorksheet;
        });
    }

    /**
     * Submit worksheet for approval: DRAFT/REJECTED → SUBMITTED
     */
    async submitWorksheet(id: number, userId: number): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({
                where: { id },
                include: { WorksheetInputBatch: true, WorksheetSideProduct: true }
            });

            if (!worksheet) throw new NotFoundError('Worksheet', id);

            if (worksheet.status !== Worksheet_status_enum.DRAFT && worksheet.status !== Worksheet_status_enum.REJECTED) {
                throw new BusinessRuleError(
                    `Worksheet hanya bisa di-submit dari status DRAFT atau REJECTED. Status saat ini: ${worksheet.status}`
                );
            }
            if (worksheet.id_user !== userId) {
                throw new BusinessRuleError('Hanya pembuat worksheet yang bisa men-submit');
            }
            if (!worksheet.WorksheetInputBatch || worksheet.WorksheetInputBatch.length === 0) {
                throw new BusinessRuleError('Input batches wajib diisi sebelum submit');
            }
            if (!worksheet.id_output_product) {
                throw new BusinessRuleError('Output product (SKU) wajib dipilih sebelum submit');
            }
            if (Number(worksheet.beras_output) <= 0) {
                throw new BusinessRuleError('Output quantity harus lebih dari 0');
            }

            const updatedWorksheet = await tx.worksheet.update({
                where: { id },
                data: {
                    status: Worksheet_status_enum.SUBMITTED,
                    submitted_at: new Date(),
                    submitted_by: userId,
                    rejected_at: null,
                    rejected_by: null,
                    rejection_reason: null
                }
            });

            // Audit Log: UPDATE (SUBMIT)
            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'Worksheet',
                recordId: id,
                oldValue: { status: worksheet.status },
                newValue: { status: Worksheet_status_enum.SUBMITTED }
            }, tx);

            return updatedWorksheet;
        });
    }

    /**
     * Approve worksheet — THIS IS WHERE STOCK MOVES
     * SUBMITTED → COMPLETED (stok IN untuk output, OUT untuk input)
     */
    async approveWorksheet(id: number, approverId: number): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({
                where: { id },
                include: {
                    WorksheetInputBatch: {
                        include: { Stock: { include: { ProductType: true } } }
                    },
                    WorksheetSideProduct: true
                }
            });

            if (!worksheet) throw new NotFoundError('Worksheet', id);
            if (worksheet.status !== Worksheet_status_enum.SUBMITTED) {
                throw new BusinessRuleError(
                    `Worksheet hanya bisa di-approve dari status SUBMITTED. Status saat ini: ${worksheet.status}`
                );
            }

            // 1. Process Input Batches → Stock OUT
            for (const batch of worksheet.WorksheetInputBatch) {
                if (batch.Stock?.ProductType) {
                    await this.createStockMovementTransactional(
                        tx,
                        batch.id_stock,
                        approverId,
                        StockMovement_movement_type_enum.OUT,
                        Number(batch.quantity),
                        'WORKSHEET',
                        worksheet.id,
                        JSON.stringify({
                            type: 'PRODUCTION_INPUT_BATCH',
                            productCode: (batch.Stock.ProductType as any).code,
                            batch_id: batch.id,
                            output_batch_code: worksheet.batch_code,
                            input_batch_code: batch.batch_code
                        }),
                        batch.batch_code || null
                    );
                }
            }

            // 2. Process Main Output + Side Products → Stock IN
            await this.addOutputStocksTransactional(tx, worksheet as any, approverId, worksheet.WorksheetSideProduct);

            // 3. Calculate HPP server-side
            const rawMaterialCost = worksheet.WorksheetInputBatch.reduce(
                (sum, b) => sum + Number(b.quantity) * Number(b.unit_price || 0), 0
            );
            const sideProductRevenue = worksheet.WorksheetSideProduct.reduce(
                (sum, sp) => sum + Number(sp.quantity) * Number(sp.unit_price || 0), 0
            );
            const productionCost = Number(worksheet.production_cost || 0);
            const hpp = rawMaterialCost + productionCost - sideProductRevenue;
            const berasOutput = Number(worksheet.beras_output);
            const hppPerKg = berasOutput > 0 ? hpp / berasOutput : 0;

            // 4. Update worksheet to COMPLETED
            const completedWorksheet = await tx.worksheet.update({
                where: { id },
                data: {
                    status: Worksheet_status_enum.COMPLETED,
                    approved_at: new Date(),
                    approved_by: approverId,
                    completed_at: new Date(),
                    raw_material_cost: rawMaterialCost,
                    side_product_revenue: sideProductRevenue,
                    hpp,
                    hpp_per_kg: hppPerKg
                }
            });

            // Audit Log: UPDATE (APPROVE)
            await auditService.log({
                userId: approverId,
                action: 'UPDATE',
                tableName: 'Worksheet',
                recordId: id,
                oldValue: { status: worksheet.status },
                newValue: {
                    status: Worksheet_status_enum.COMPLETED,
                    hpp,
                    hpp_per_kg: hppPerKg
                }
            }, tx);

            return completedWorksheet;
        });
    }

    /**
     * Reject worksheet: SUBMITTED → REJECTED
     */
    async rejectWorksheet(id: number, rejectorId: number, reason: string): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({ where: { id } });
            if (!worksheet) throw new NotFoundError('Worksheet', id);
            if (worksheet.status !== Worksheet_status_enum.SUBMITTED) {
                throw new BusinessRuleError(
                    `Worksheet hanya bisa di-reject dari status SUBMITTED. Status saat ini: ${worksheet.status}`
                );
            }
            if (!reason || reason.trim().length === 0) {
                throw new BusinessRuleError('Alasan penolakan wajib diisi');
            }

            const rejectedWorksheet = await tx.worksheet.update({
                where: { id },
                data: {
                    status: Worksheet_status_enum.REJECTED,
                    rejected_at: new Date(),
                    rejected_by: rejectorId,
                    rejection_reason: reason.trim()
                }
            });

            // Audit Log: UPDATE (REJECT)
            await auditService.log({
                userId: rejectorId,
                action: 'UPDATE',
                tableName: 'Worksheet',
                recordId: id,
                oldValue: { status: worksheet.status },
                newValue: {
                    status: Worksheet_status_enum.REJECTED,
                    rejection_reason: reason.trim()
                }
            }, tx);

            return rejectedWorksheet;
        });
    }

    /**
     * Cancel worksheet:
     * - DRAFT/SUBMITTED → CANCELLED (no stock effect)
     * - COMPLETED → CANCELLED (with stock reversal)
     */
    async cancelWorksheet(id: number, userId: number, reason?: string): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({
                where: { id },
                include: {
                    WorksheetInputBatch: { include: { Stock: { include: { ProductType: true } } } },
                    WorksheetSideProduct: true
                }
            });

            if (!worksheet) throw new NotFoundError('Worksheet', id);

            const allowedStatuses: Worksheet_status_enum[] = [
                Worksheet_status_enum.DRAFT,
                Worksheet_status_enum.SUBMITTED,
                Worksheet_status_enum.COMPLETED
            ];
            if (!allowedStatuses.includes(worksheet.status as Worksheet_status_enum)) {
                throw new BusinessRuleError(
                    `Worksheet tidak bisa di-cancel dari status ${worksheet.status}`
                );
            }

            // If COMPLETED → reverse stock movements
            if (worksheet.status === Worksheet_status_enum.COMPLETED) {
                // Reverse input batches (add back to stock)
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
                            `Reversal: cancel approved worksheet #${worksheet.id}`
                        );
                    }
                }
                // Reverse output stocks
                await this.revertOutputStocksTransactional(tx, worksheet.id);
            }

            const newNotes = reason
                ? `${worksheet.notes || ''}\n[CANCELLED] ${reason}`.trim()
                : worksheet.notes;

            const cancelledWorksheet = await tx.worksheet.update({
                where: { id },
                data: { status: Worksheet_status_enum.CANCELLED, notes: newNotes }
            });

            // Audit Log: UPDATE (CANCEL)
            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'Worksheet',
                recordId: id,
                oldValue: { status: worksheet.status },
                newValue: { status: Worksheet_status_enum.CANCELLED, cancel_reason: reason }
            }, tx);

            return cancelledWorksheet;
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
            raw_material_cost: 0,
            side_product_revenue: 0,
            hpp: 0,
            hpp_per_kg: 0,
            process_steps: dto.process_steps,
            id_machines: dto.id_machines || null,
            id_operators: dto.id_operators || null,
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
                    total_cost: batchDto.quantity * (batchDto.unit_price || 0),
                    batch_code: batchDto.batch_code
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
                        output_batch_code: worksheet.batch_code,
                        input_batch_code: batchDto.batch_code
                    }),
                    batchDto.batch_code || null
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
        notes: string,
        batchCode?: string | null
    ) {
        await tx.stockMovement.create({
            data: {
                id_stock: stockId,
                id_user: userId,
                movement_type: type,
                quantity: qty,
                reference_type: refType,
                reference_id: refId,
                batch_code: batchCode || null,
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
        if (!productType) {
            console.error(`Production Fallback Error: ProductType ${inputProductCode} not found for Worksheet ${worksheet.id}`);
            return;
        }

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
                    }),
                    worksheet.batch_code
                );
            }
        }

        // 2. Side Products
        for (const sp of sideProducts) {
            if (Number(sp.quantity) > 0) {
                let pt = null;
                if (sp.id_product_type) {
                    pt = await tx.productType.findUnique({ where: { id: sp.id_product_type } });
                } else {
                    pt = await tx.productType.findFirst({ where: { code: sp.product_code } });
                }

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
                            batch_code: (sp as any).batch_code || worksheet.batch_code
                        }),
                        (sp as any).batch_code || worksheet.batch_code
                    );
                }
            }
        }
    }

    calculateRendemen(input: number, output: number): number {
        if (input <= 0) return 0;
        return (output / input) * 100;
    }

    /**
     * Update worksheet — only allowed for DRAFT or REJECTED status
     * No stock movements since stock only moves on approve
     */
    async updateWorksheet(dto: UpdateWorksheetDTO): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            const worksheet = await tx.worksheet.findUnique({ where: { id: dto.id } });
            if (!worksheet) {
                throw new NotFoundError('Worksheet', dto.id);
            }

            // Status guard: only DRAFT or REJECTED can be edited
            if (worksheet.status !== Worksheet_status_enum.DRAFT && worksheet.status !== Worksheet_status_enum.REJECTED) {
                throw new BusinessRuleError(
                    `Worksheet hanya bisa diedit pada status DRAFT atau REJECTED. Status saat ini: ${worksheet.status}`
                );
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

            // Update input batches data (no stock movement)
            if (dto.input_batches !== undefined) {
                await tx.worksheetInputBatch.deleteMany({ where: { id_worksheet: worksheet.id } });
                for (const batchDto of dto.input_batches) {
                    await tx.worksheetInputBatch.create({
                        data: {
                            id_worksheet: worksheet.id,
                            id_stock: batchDto.id_stock,
                            quantity: batchDto.quantity,
                            unit_price: batchDto.unit_price || 0,
                            total_cost: batchDto.quantity * (batchDto.unit_price || 0),
                            batch_code: batchDto.batch_code
                        }
                    });
                }
            }

            // Update side products data (no stock movement)
            if (dto.side_products !== undefined) {
                await tx.worksheetSideProduct.deleteMany({ where: { id_worksheet: worksheet.id } });
                for (const spDto of dto.side_products) {
                    await tx.worksheetSideProduct.create({
                        data: {
                            id_worksheet: worksheet.id,
                            id_product_type: spDto.id_product_type,
                            product_code: spDto.product_code,
                            product_name: spDto.product_name,
                            quantity: spDto.quantity,
                            unit_price: spDto.unit_price,
                            total_value: spDto.quantity * (spDto.unit_price || 0),
                            is_auto_calculated: spDto.is_auto_calculated,
                            auto_percentage: spDto.auto_percentage
                        }
                    });
                }
            }

            // Audit Log: UPDATE
            await auditService.log({
                userId: worksheet.id_user,
                action: 'UPDATE',
                tableName: 'Worksheet',
                recordId: dto.id,
                oldValue: { gabah_input: worksheet.gabah_input, beras_output: worksheet.beras_output },
                newValue: updateData
            }, tx);

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
     * Delete worksheet
     * Only DRAFT, REJECTED, or CANCELLED can be deleted directly
     * COMPLETED must be cancelled first
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

            // Only DRAFT, REJECTED, CANCELLED can be deleted
            if (
                worksheet.status !== Worksheet_status_enum.DRAFT &&
                worksheet.status !== Worksheet_status_enum.REJECTED &&
                worksheet.status !== Worksheet_status_enum.CANCELLED
            ) {
                throw new BusinessRuleError(
                    `Worksheet hanya bisa dihapus pada status DRAFT, REJECTED, atau CANCELLED. ` +
                    `Status saat ini: ${worksheet.status}. Gunakan Cancel untuk membatalkan worksheet yang sudah approved.`
                );
            }

            // For DRAFT/REJECTED: no stock movement to reverse
            // For CANCELLED: stock was already reversed during cancel

            // Delete related records
            await tx.worksheetInputBatch.deleteMany({ where: { id_worksheet: id } });
            await tx.worksheetSideProduct.deleteMany({ where: { id_worksheet: id } });
            await tx.worksheet.delete({ where: { id } });

            // Audit Log: DELETE
            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'Worksheet',
                recordId: id,
                oldValue: { batch_code: worksheet.batch_code, status: worksheet.status }
            }, tx);

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
        status?: string;
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
