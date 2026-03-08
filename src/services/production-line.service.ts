import { ProductionLine } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { Prisma } from '@prisma/client';
import { auditService } from './audit.service';
import { productionLineRepository } from '../repositories/production-line.repository';

class ProductionLineService {
    async create(data: {
        id_factory: number;
        code: string;
        name: string;
        description?: string;
        capacity_per_hour?: number;
    }, userId: number): Promise<ProductionLine> {
        return await prisma.$transaction(async (tx) => {
            // Validate unique code
            const existing = await tx.productionLine.findUnique({ where: { code: data.code } });
            if (existing) throw new Error('Production line code already exists');

            const line = await tx.productionLine.create({
                data: {
                    id_factory: Number(data.id_factory),
                    code: data.code,
                    name: data.name,
                    description: data.description || null,
                    capacity_per_hour: data.capacity_per_hour ? Number(data.capacity_per_hour) : null,
                }
            });

            await auditService.log({
                userId,
                action: 'CREATE',
                tableName: 'ProductionLine',
                recordId: line.id,
                newValue: line,
            }, tx);

            return line;
        });
    }

    async update(id: number, data: {
        code?: string;
        name?: string;
        description?: string;
        is_active?: boolean;
        capacity_per_hour?: number;
    }, userId: number): Promise<ProductionLine> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.productionLine.findUnique({ where: { id } });
            if (!existing) throw new Error('Production line not found');

            // Check unique code if changing
            if (data.code && data.code !== existing.code) {
                const dup = await tx.productionLine.findUnique({ where: { code: data.code } });
                if (dup) throw new Error('Production line code already exists');
            }

            const updateData: any = {};
            if (data.code !== undefined) updateData.code = data.code;
            if (data.name !== undefined) updateData.name = data.name;
            if (data.description !== undefined) updateData.description = data.description;
            if (data.is_active !== undefined) updateData.is_active = data.is_active;
            if (data.capacity_per_hour !== undefined) updateData.capacity_per_hour = data.capacity_per_hour ? Number(data.capacity_per_hour) : null;

            const updated = await tx.productionLine.update({ where: { id }, data: updateData });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'ProductionLine',
                recordId: id,
                oldValue: existing,
                newValue: updated,
            }, tx);

            return updated;
        });
    }

    async delete(id: number, userId: number): Promise<boolean> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.productionLine.findUnique({
                where: { id },
                include: { _count: { select: { Worksheet: true } } }
            });
            if (!existing) throw new Error('Production line not found');

            // Unlink machines first
            await tx.machine.updateMany({
                where: { id_production_line: id },
                data: { id_production_line: null, sequence_order: null }
            });

            await tx.productionLine.delete({ where: { id } });

            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'ProductionLine',
                recordId: id,
                oldValue: existing,
            }, tx);

            return true;
        });
    }

    async assignMachine(lineId: number, machineId: number, sequenceOrder: number, userId: number): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const line = await tx.productionLine.findUnique({ where: { id: lineId } });
            if (!line) throw new Error('Production line not found');

            const machine = await tx.machine.findUnique({ where: { id: machineId } });
            if (!machine) throw new Error('Machine not found');

            if (machine.id_factory !== line.id_factory) {
                throw new Error('Machine and production line must be in the same factory');
            }

            await tx.machine.update({
                where: { id: machineId },
                data: { id_production_line: lineId, sequence_order: sequenceOrder }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'Machine',
                recordId: machineId,
                oldValue: { id_production_line: machine.id_production_line, sequence_order: machine.sequence_order },
                newValue: { id_production_line: lineId, sequence_order: sequenceOrder },
            }, tx);
        });
    }

    async removeMachine(lineId: number, machineId: number, userId: number): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const machine = await tx.machine.findUnique({ where: { id: machineId } });
            if (!machine) throw new Error('Machine not found');
            if (machine.id_production_line !== lineId) {
                throw new Error('Machine is not assigned to this production line');
            }

            await tx.machine.update({
                where: { id: machineId },
                data: { id_production_line: null, sequence_order: null }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'Machine',
                recordId: machineId,
                oldValue: { id_production_line: lineId, sequence_order: machine.sequence_order },
                newValue: { id_production_line: null, sequence_order: null },
            }, tx);
        });
    }
}

export const productionLineService = new ProductionLineService();
