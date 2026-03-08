import { WorkOrder, WorkOrder_status_enum, WorkOrder_priority_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { workOrderRepository, WorkOrderListParams } from '../repositories/work-order.repository';
import { NotFoundError, BusinessRuleError } from '../utils/errors';
import { auditService } from './audit.service';

export interface CreateWorkOrderDTO {
    id_factory: number;
    id_user: number;
    title: string;
    description?: string;
    priority?: string;
    id_production_line?: number;
    planned_start?: string;
    planned_end?: string;
    target_quantity?: number;
    notes?: string;
}

export interface UpdateWorkOrderDTO {
    id: number;
    title?: string;
    description?: string;
    priority?: string;
    id_production_line?: number;
    planned_start?: string;
    planned_end?: string;
    target_quantity?: number;
    notes?: string;
}

class WorkOrderService {
    private async generateWONumber(factoryId: number, tx: any): Promise<string> {
        const factory = await tx.factory.findUnique({ where: { id: factoryId } });
        if (!factory) throw new Error(`Factory with id ${factoryId} not found`);
        const factoryCode = factory.code || 'XX';
        const date = new Date();
        const yy = date.getFullYear().toString().slice(-2);
        const mm = (date.getMonth() + 1).toString().padStart(2, '0');
        const prefix = `WO-${factoryCode}-${yy}${mm}`;

        const lastWO = await tx.workOrder.findFirst({
            where: { work_order_number: { startsWith: prefix } },
            orderBy: { work_order_number: 'desc' }
        });

        let seq = 1;
        if (lastWO) {
            const parts = lastWO.work_order_number.split('-');
            const lastSeq = parseInt(parts[parts.length - 1]) || 0;
            seq = lastSeq + 1;
        }
        return `${prefix}-${seq.toString().padStart(4, '0')}`;
    }

    async createWorkOrder(dto: CreateWorkOrderDTO): Promise<WorkOrder> {
        return await prisma.$transaction(async (tx) => {
            const woNumber = await this.generateWONumber(dto.id_factory, tx);
            const workOrder = await tx.workOrder.create({
                data: {
                    id_factory: dto.id_factory,
                    id_user: dto.id_user,
                    work_order_number: woNumber,
                    title: dto.title,
                    description: dto.description,
                    priority: (dto.priority as WorkOrder_priority_enum) || WorkOrder_priority_enum.NORMAL,
                    id_production_line: dto.id_production_line ? Number(dto.id_production_line) : null,
                    planned_start: dto.planned_start ? new Date(dto.planned_start) : null,
                    planned_end: dto.planned_end ? new Date(dto.planned_end) : null,
                    target_quantity: dto.target_quantity ? Number(dto.target_quantity) : null,
                    notes: dto.notes,
                }
            });

            await auditService.log({
                userId: dto.id_user,
                action: 'CREATE',
                tableName: 'WorkOrder',
                recordId: workOrder.id,
                newValue: { work_order_number: woNumber, title: dto.title }
            }, tx);

            return workOrder;
        });
    }

    async updateWorkOrder(dto: UpdateWorkOrderDTO, userId: number): Promise<WorkOrder> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.workOrder.findUnique({ where: { id: dto.id } });
            if (!existing) throw new NotFoundError('WorkOrder', dto.id);
            if (existing.status !== WorkOrder_status_enum.PLANNED) {
                throw new BusinessRuleError('Work Order hanya bisa diedit saat status PLANNED');
            }

            const updateData: any = {};
            if (dto.title !== undefined) updateData.title = dto.title;
            if (dto.description !== undefined) updateData.description = dto.description;
            if (dto.priority !== undefined) updateData.priority = dto.priority;
            if (dto.id_production_line !== undefined) updateData.id_production_line = dto.id_production_line ? Number(dto.id_production_line) : null;
            if (dto.planned_start !== undefined) updateData.planned_start = dto.planned_start ? new Date(dto.planned_start) : null;
            if (dto.planned_end !== undefined) updateData.planned_end = dto.planned_end ? new Date(dto.planned_end) : null;
            if (dto.target_quantity !== undefined) updateData.target_quantity = dto.target_quantity ? Number(dto.target_quantity) : null;
            if (dto.notes !== undefined) updateData.notes = dto.notes;

            const updated = await tx.workOrder.update({ where: { id: dto.id }, data: updateData });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'WorkOrder',
                recordId: dto.id,
                oldValue: { title: existing.title, priority: existing.priority },
                newValue: updateData
            }, tx);

            return updated;
        });
    }

    async startWorkOrder(id: number, userId: number): Promise<WorkOrder> {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({ where: { id } });
            if (!wo) throw new NotFoundError('WorkOrder', id);
            if (wo.status !== WorkOrder_status_enum.PLANNED) {
                throw new BusinessRuleError('Work Order hanya bisa dimulai dari status PLANNED');
            }

            const updated = await tx.workOrder.update({
                where: { id },
                data: { status: WorkOrder_status_enum.IN_PROGRESS, actual_start: new Date() }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'WorkOrder',
                recordId: id,
                oldValue: { status: wo.status },
                newValue: { status: WorkOrder_status_enum.IN_PROGRESS }
            }, tx);

            return updated;
        });
    }

    async completeWorkOrder(id: number, userId: number, actualQuantity?: number): Promise<WorkOrder> {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({ where: { id } });
            if (!wo) throw new NotFoundError('WorkOrder', id);
            if (wo.status !== WorkOrder_status_enum.IN_PROGRESS) {
                throw new BusinessRuleError('Work Order hanya bisa diselesaikan dari status IN_PROGRESS');
            }

            const updateData: any = {
                status: WorkOrder_status_enum.COMPLETED,
                actual_end: new Date()
            };
            if (actualQuantity !== undefined) updateData.actual_quantity = Number(actualQuantity);

            const updated = await tx.workOrder.update({ where: { id }, data: updateData });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'WorkOrder',
                recordId: id,
                oldValue: { status: wo.status },
                newValue: { status: WorkOrder_status_enum.COMPLETED, actual_quantity: actualQuantity }
            }, tx);

            return updated;
        });
    }

    async cancelWorkOrder(id: number, userId: number, reason?: string): Promise<WorkOrder> {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({ where: { id } });
            if (!wo) throw new NotFoundError('WorkOrder', id);
            if (wo.status === WorkOrder_status_enum.COMPLETED || wo.status === WorkOrder_status_enum.CANCELLED) {
                throw new BusinessRuleError(`Work Order dengan status ${wo.status} tidak bisa dibatalkan`);
            }

            // Detach all worksheets from this WO
            await tx.worksheet.updateMany({
                where: { id_work_order: id },
                data: { id_work_order: null, step_number: null }
            });

            const updated = await tx.workOrder.update({
                where: { id },
                data: { status: WorkOrder_status_enum.CANCELLED, notes: reason ? `CANCELLED: ${reason}` : wo.notes }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'WorkOrder',
                recordId: id,
                oldValue: { status: wo.status },
                newValue: { status: WorkOrder_status_enum.CANCELLED, reason }
            }, tx);

            return updated;
        });
    }

    async deleteWorkOrder(id: number, userId: number): Promise<boolean> {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({ where: { id } });
            if (!wo) throw new NotFoundError('WorkOrder', id);
            if (wo.status !== WorkOrder_status_enum.PLANNED && wo.status !== WorkOrder_status_enum.CANCELLED) {
                throw new BusinessRuleError('Work Order hanya bisa dihapus saat status PLANNED atau CANCELLED');
            }

            // Detach worksheets
            await tx.worksheet.updateMany({
                where: { id_work_order: id },
                data: { id_work_order: null, step_number: null }
            });

            await tx.workOrder.delete({ where: { id } });

            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'WorkOrder',
                recordId: id,
                oldValue: { work_order_number: wo.work_order_number, title: wo.title }
            }, tx);

            return true;
        });
    }

    async addWorksheetToOrder(workOrderId: number, worksheetId: number, stepNumber: number, userId: number): Promise<void> {
        return await prisma.$transaction(async (tx) => {
            const wo = await tx.workOrder.findUnique({ where: { id: workOrderId } });
            if (!wo) throw new NotFoundError('WorkOrder', workOrderId);

            const ws = await tx.worksheet.findUnique({ where: { id: worksheetId } });
            if (!ws) throw new NotFoundError('Worksheet', worksheetId);

            if (ws.id_work_order && ws.id_work_order !== workOrderId) {
                throw new BusinessRuleError('Worksheet sudah ditugaskan ke Work Order lain');
            }

            await tx.worksheet.update({
                where: { id: worksheetId },
                data: { id_work_order: workOrderId, step_number: stepNumber }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'WorkOrder',
                recordId: workOrderId,
                newValue: { action: 'ADD_WORKSHEET', worksheetId, stepNumber }
            }, tx);
        });
    }

    async removeWorksheetFromOrder(workOrderId: number, worksheetId: number, userId: number): Promise<void> {
        return await prisma.$transaction(async (tx) => {
            const ws = await tx.worksheet.findUnique({ where: { id: worksheetId } });
            if (!ws) throw new NotFoundError('Worksheet', worksheetId);
            if (ws.id_work_order !== workOrderId) {
                throw new BusinessRuleError('Worksheet bukan bagian dari Work Order ini');
            }

            await tx.worksheet.update({
                where: { id: worksheetId },
                data: { id_work_order: null, step_number: null }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'WorkOrder',
                recordId: workOrderId,
                newValue: { action: 'REMOVE_WORKSHEET', worksheetId }
            }, tx);
        });
    }

    async getWorkOrderById(id: number): Promise<WorkOrder> {
        const wo = await workOrderRepository.findById(id);
        if (!wo) throw new NotFoundError('WorkOrder', id);
        return wo;
    }

    async getWorkOrders(params: WorkOrderListParams): Promise<{ workOrders: WorkOrder[], total: number }> {
        return await workOrderRepository.findWithFilters(params);
    }
}

export const workOrderService = new WorkOrderService();
