/**
 * Worksheet Workflow Service
 * Extracted from worksheet.service.ts — handles state machine transitions
 * 
 * Workflow: DRAFT → SUBMITTED → COMPLETED (via Approve)
 *                             → REJECTED → DRAFT (edit & resubmit)
 * Cancel: DRAFT/SUBMITTED/COMPLETED → CANCELLED (COMPLETED triggers stock reversal)
 */

import {
    Worksheet,
    Worksheet_status_enum,
} from '@prisma/client';
import { prisma } from '../../../../libs/prisma';
import { NotFoundError, BusinessRuleError } from '../../../../utils/errors';
import { auditService } from '../../../../services/audit.service';
import { worksheetStockService } from '../stock/worksheet-stock.service';
import { hppCalculator } from '../hpp/hpp-calculator.service';
import type { WorksheetWithRelations } from '../worksheet.types';

export class WorksheetWorkflowService {
    /**
     * Submit worksheet for approval: DRAFT/REJECTED → SUBMITTED
     */
    async submit(id: number, userId: number): Promise<Worksheet> {
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
     * SUBMITTED → COMPLETED (stock IN for output, OUT for input)
     */
    async approve(id: number, approverId: number): Promise<Worksheet> {
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

            // 1. Process Input Batches → Stock OUT (validates availability)
            await worksheetStockService.processInputStockOut(
                tx, worksheet, worksheet.WorksheetInputBatch, approverId
            );

            // 2. Process Main Output + Side Products → Stock IN
            await worksheetStockService.processOutputStockIn(
                tx, worksheet, approverId, worksheet.WorksheetSideProduct
            );

            // 3. Calculate HPP server-side
            const hppResult = hppCalculator.calculate({
                inputBatches: worksheet.WorksheetInputBatch.map(b => ({
                    quantity: Number(b.quantity),
                    unit_price: Number(b.unit_price || 0)
                })),
                sideProducts: worksheet.WorksheetSideProduct.map(sp => ({
                    quantity: Number(sp.quantity),
                    unit_price: Number(sp.unit_price || 0)
                })),
                productionCost: Number(worksheet.production_cost || 0),
                berasOutput: Number(worksheet.beras_output)
            });

            // 4. Update worksheet to COMPLETED
            const completedWorksheet = await tx.worksheet.update({
                where: { id },
                data: {
                    status: Worksheet_status_enum.COMPLETED,
                    approved_at: new Date(),
                    approved_by: approverId,
                    completed_at: new Date(),
                    raw_material_cost: hppResult.rawMaterialCost,
                    side_product_revenue: hppResult.sideProductRevenue,
                    hpp: hppResult.hpp,
                    hpp_per_kg: hppResult.hppPerKg
                }
            });

            await auditService.log({
                userId: approverId,
                action: 'UPDATE',
                tableName: 'Worksheet',
                recordId: id,
                oldValue: { status: worksheet.status },
                newValue: {
                    status: Worksheet_status_enum.COMPLETED,
                    hpp: hppResult.hpp,
                    hpp_per_kg: hppResult.hppPerKg
                }
            }, tx);

            return completedWorksheet;
        });
    }

    /**
     * Reject worksheet: SUBMITTED → REJECTED
     */
    async reject(id: number, rejectorId: number, reason: string): Promise<Worksheet> {
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
    async cancel(id: number, userId: number, reason?: string): Promise<Worksheet> {
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

            // If COMPLETED → reverse ALL stock movements
            if (worksheet.status === Worksheet_status_enum.COMPLETED) {
                await worksheetStockService.reverseAllMovements(tx, worksheet.id, userId);
            }

            const newNotes = reason
                ? `${worksheet.notes || ''}\n[CANCELLED] ${reason}`.trim()
                : worksheet.notes;

            const cancelledWorksheet = await tx.worksheet.update({
                where: { id },
                data: { status: Worksheet_status_enum.CANCELLED, notes: newNotes }
            });

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
}

export const worksheetWorkflowService = new WorksheetWorkflowService();
