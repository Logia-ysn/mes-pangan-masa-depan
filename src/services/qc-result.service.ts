import { prisma } from '../libs/prisma';
import { auditService } from './audit.service';
import { BusinessRuleError, NotFoundError } from '../utils/errors';
import { QCResult } from '@prisma/client';

export interface CreateQCResultDTO {
    id_factory: number;
    id_user: number;
    qc_date: string;
    batch_code?: string;
    id_worksheet?: number;
    moisture_content?: number;
    broken_percentage?: number;
    whiteness_degree?: number;
    grade?: string;
    notes?: string;
}

export interface UpdateQCResultDTO extends Partial<CreateQCResultDTO> {
    id: number;
}

class QCResultService {
    async create(dto: CreateQCResultDTO): Promise<QCResult> {
        return await prisma.$transaction(async (tx) => {
            // Business Rule: One of batch_code or id_worksheet must be present
            if (!dto.batch_code && !dto.id_worksheet) {
                throw new BusinessRuleError('Batch code atau ID Worksheet harus diisi untuk pencatatan QC');
            }

            const qcResult = await tx.qCResult.create({
                data: {
                    id_factory: dto.id_factory,
                    id_user: dto.id_user,
                    qc_date: new Date(dto.qc_date),
                    batch_code: dto.batch_code || null,
                    id_worksheet: dto.id_worksheet || null,
                    moisture_content: dto.moisture_content,
                    broken_percentage: dto.broken_percentage,
                    whiteness_degree: dto.whiteness_degree,
                    grade: dto.grade,
                    notes: dto.notes
                }
            });

            await auditService.log({
                userId: dto.id_user,
                action: 'CREATE',
                tableName: 'QCResult',
                recordId: qcResult.id,
                newValue: qcResult
            }, tx);

            return qcResult;
        });
    }

    async update(dto: UpdateQCResultDTO): Promise<QCResult> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.qCResult.findUnique({ where: { id: dto.id } });
            if (!existing) throw new NotFoundError('QCResult', dto.id);

            const updateData: any = {
                ...dto,
                qc_date: dto.qc_date ? new Date(dto.qc_date) : undefined
            };
            delete updateData.id;

            const updated = await tx.qCResult.update({
                where: { id: dto.id },
                data: updateData
            });

            await auditService.log({
                userId: dto.id_user || 0,
                action: 'UPDATE',
                tableName: 'QCResult',
                recordId: dto.id,
                oldValue: existing,
                newValue: updated
            }, tx);

            return updated;
        });
    }

    async delete(id: number, userId: number): Promise<void> {
        await prisma.$transaction(async (tx) => {
            const existing = await tx.qCResult.findUnique({ where: { id } });
            if (!existing) throw new NotFoundError('QCResult', id);

            await tx.qCResult.delete({ where: { id } });

            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'QCResult',
                recordId: id,
                oldValue: existing
            }, tx);
        });
    }
}

export const qcResultService = new QCResultService();
