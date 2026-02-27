import { prisma } from '../libs/prisma';
import { auditService } from './audit.service';
import { BusinessRuleError, NotFoundError } from '../utils/errors';
import { DryingLog } from '@prisma/client';

export interface CreateDryingLogDTO {
    id_factory: number;
    id_user: number;
    batch_code: string;
    drying_date: string;
    method: string;
    initial_weight: number;
    final_weight: number;
    initial_moisture?: number;
    final_moisture?: number;
    downtime_hours?: number;
    notes?: string;
}

export interface UpdateDryingLogDTO extends Partial<CreateDryingLogDTO> {
    id: number;
}

class DryingLogService {
    async create(dto: CreateDryingLogDTO): Promise<DryingLog> {
        return await prisma.$transaction(async (tx) => {
            // Validation
            if (dto.final_weight > dto.initial_weight) {
                throw new BusinessRuleError('Berat akhir tidak boleh lebih besar dari berat awal (penyusutan negatif)');
            }

            const shrinkage_kg = dto.initial_weight - dto.final_weight;
            const shrinkage_pct = dto.initial_weight > 0 ? (shrinkage_kg / dto.initial_weight) * 100 : 0;

            const dryingLog = await tx.dryingLog.create({
                data: {
                    id_factory: dto.id_factory,
                    id_user: dto.id_user,
                    batch_code: dto.batch_code,
                    drying_date: new Date(dto.drying_date),
                    method: dto.method,
                    initial_weight: dto.initial_weight,
                    final_weight: dto.final_weight,
                    initial_moisture: dto.initial_moisture,
                    final_moisture: dto.final_moisture,
                    downtime_hours: dto.downtime_hours,
                    shrinkage_kg: shrinkage_kg,
                    shrinkage_pct: shrinkage_pct,
                    notes: dto.notes
                }
            });

            await auditService.log({
                userId: dto.id_user,
                action: 'CREATE',
                tableName: 'DryingLog',
                recordId: dryingLog.id,
                newValue: dryingLog
            }, tx);

            return dryingLog;
        });
    }

    async update(dto: UpdateDryingLogDTO): Promise<DryingLog> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.dryingLog.findUnique({ where: { id: dto.id } });
            if (!existing) throw new NotFoundError('DryingLog', dto.id);

            const initial_weight = dto.initial_weight ?? Number(existing.initial_weight);
            const final_weight = dto.final_weight ?? Number(existing.final_weight);

            if (final_weight > initial_weight) {
                throw new BusinessRuleError('Berat akhir tidak boleh lebih besar dari berat awal');
            }

            const shrinkage_kg = initial_weight - final_weight;
            const shrinkage_pct = initial_weight > 0 ? (shrinkage_kg / initial_weight) * 100 : 0;

            const updateData: any = {
                ...dto,
                shrinkage_kg,
                shrinkage_pct,
                drying_date: dto.drying_date ? new Date(dto.drying_date) : undefined
            };
            delete updateData.id;

            const updated = await tx.dryingLog.update({
                where: { id: dto.id },
                data: updateData
            });

            await auditService.log({
                userId: dto.id_user || 0, // Fallback if user id not provided in update
                action: 'UPDATE',
                tableName: 'DryingLog',
                recordId: dto.id,
                oldValue: existing,
                newValue: updated
            }, tx);

            return updated;
        });
    }

    async delete(id: number, userId: number): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.dryingLog.findUnique({ where: { id } });
            if (!existing) throw new NotFoundError('DryingLog', id);

            await tx.dryingLog.delete({ where: { id } });

            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'DryingLog',
                recordId: id,
                oldValue: existing
            }, tx);
        });
    }
}

export const dryingLogService = new DryingLogService();
