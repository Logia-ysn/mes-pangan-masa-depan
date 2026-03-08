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
    Prisma,
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
// Phase 2: Extracted services
import { worksheetWorkflowService } from '../modules/production/worksheet/workflow/worksheet-workflow.service';
import { hppCalculator } from '../modules/production/worksheet/hpp/hpp-calculator.service';
// DTOs re-exported from shared types for backward compatibility
import type { InputBatchDTO, SideProductDTO, CreateWorksheetDTO, UpdateWorksheetDTO } from '../modules/production/worksheet/worksheet.types';
export type { InputBatchDTO, SideProductDTO, CreateWorksheetDTO, UpdateWorksheetDTO };

// PROCESS_STEPS re-exported from shared constants for backward compatibility
export { PROCESS_STEPS } from '../modules/production/worksheet/worksheet.constants';

class WorksheetService {
    /**
     * Create new worksheet as DRAFT — NO stock movement yet
     * Stock only moves when Supervisor approves (approveWorksheet)
     */
    async createWorksheet(dto: CreateWorksheetDTO): Promise<Worksheet> {
        return await prisma.$transaction(async (tx) => {
            // 0. Get Factory for batch code generation
            const factory = await tx.factory.findUnique({ where: { id: dto.id_factory } });
            if (!factory) throw new Error(`Factory with id ${dto.id_factory} not found`);
            const factoryCode = factory.code;
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
            const worksheetData = this.mapDtoToWorksheetData(dto);
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
     * Delegates to WorksheetWorkflowService
     */
    async submitWorksheet(id: number, userId: number): Promise<Worksheet> {
        return worksheetWorkflowService.submit(id, userId);
    }

    /**
     * Approve worksheet — THIS IS WHERE STOCK MOVES
     * Delegates to WorksheetWorkflowService
     */
    async approveWorksheet(id: number, approverId: number): Promise<Worksheet> {
        return worksheetWorkflowService.approve(id, approverId);
    }

    /**
     * Reject worksheet: SUBMITTED → REJECTED
     * Delegates to WorksheetWorkflowService
     */
    async rejectWorksheet(id: number, rejectorId: number, reason: string): Promise<Worksheet> {
        return worksheetWorkflowService.reject(id, rejectorId, reason);
    }

    /**
     * Cancel worksheet:
     * Delegates to WorksheetWorkflowService
     */
    async cancelWorksheet(id: number, userId: number, reason?: string): Promise<Worksheet> {
        return worksheetWorkflowService.cancel(id, userId, reason);
    }

    private mapDtoToWorksheetData(dto: CreateWorksheetDTO): Prisma.WorksheetUncheckedCreateInput {
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
            id_machines: dto.id_machines ? dto.id_machines : Prisma.JsonNull,
            id_operators: dto.id_operators ? dto.id_operators : Prisma.JsonNull,
            id_production_line: dto.id_production_line ? Number(dto.id_production_line) : null,
        };
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

            const updateData: Prisma.WorksheetUncheckedUpdateInput = {};
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
            if (dto.id_machines !== undefined) updateData.id_machines = dto.id_machines ? dto.id_machines : Prisma.JsonNull;
            if (dto.id_operators !== undefined) updateData.id_operators = dto.id_operators ? dto.id_operators : Prisma.JsonNull;

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

    calculateRendemen(input: number, output: number): number {
        return hppCalculator.calculateRendemen(input, output);
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
