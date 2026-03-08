import { DowntimeEvent, DowntimeEvent_category_enum } from '@prisma/client';
import { prisma } from '../libs/prisma';
import { downtimeEventRepository, DowntimeEventListParams } from '../repositories/downtime-event.repository';
import { NotFoundError, BusinessRuleError } from '../utils/errors';
import { auditService } from './audit.service';

export interface CreateDowntimeEventDTO {
    id_machine: number;
    id_factory: number;
    id_user: number;
    start_time: string;
    end_time?: string;
    category: DowntimeEvent_category_enum;
    reason?: string;
}

export interface UpdateDowntimeEventDTO {
    id: number;
    id_machine?: number;
    start_time?: string;
    end_time?: string;
    category?: DowntimeEvent_category_enum;
    reason?: string;
}

export interface ResolveDowntimeEventDTO {
    id: number;
    end_time: string;
    resolution?: string;
}

class DowntimeEventService {
    async createDowntimeEvent(dto: CreateDowntimeEventDTO, userId: number): Promise<DowntimeEvent> {
        return await prisma.$transaction(async (tx) => {
            const startDate = new Date(dto.start_time);
            let duration_minutes: number | null = null;
            let endDate: Date | null = null;
            let status = 'OPEN';

            if (dto.end_time) {
                endDate = new Date(dto.end_time);
                duration_minutes = (endDate.getTime() - startDate.getTime()) / 60000;
                status = 'RESOLVED';
            }

            const downtimeEvent = await tx.downtimeEvent.create({
                data: {
                    id_machine: Number(dto.id_machine),
                    id_factory: Number(dto.id_factory),
                    id_user: Number(dto.id_user),
                    start_time: startDate,
                    end_time: endDate,
                    duration_minutes,
                    category: dto.category,
                    reason: dto.reason,
                    status
                }
            });

            await auditService.log({
                userId,
                action: 'CREATE',
                tableName: 'DowntimeEvent',
                recordId: downtimeEvent.id,
                newValue: {
                    id_machine: dto.id_machine,
                    start_time: dto.start_time,
                    category: dto.category
                }
            }, tx);

            return downtimeEvent;
        });
    }

    async updateDowntimeEvent(dto: UpdateDowntimeEventDTO, userId: number): Promise<DowntimeEvent> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.downtimeEvent.findUnique({ where: { id: dto.id } });
            if (!existing) throw new NotFoundError('DowntimeEvent', dto.id);

            const updateData: any = {};
            if (dto.id_machine !== undefined) updateData.id_machine = Number(dto.id_machine);
            if (dto.category !== undefined) updateData.category = dto.category;
            if (dto.reason !== undefined) updateData.reason = dto.reason;

            let startDate = existing.start_time;
            if (dto.start_time) {
                startDate = new Date(dto.start_time);
                updateData.start_time = startDate;
            }

            let endDate = existing.end_time;
            if (dto.end_time !== undefined) {
                endDate = dto.end_time ? new Date(dto.end_time) : null;
                updateData.end_time = endDate;
            }

            if (endDate) {
                updateData.duration_minutes = (endDate.getTime() - startDate.getTime()) / 60000;
                updateData.status = 'RESOLVED';
            } else {
                updateData.duration_minutes = null;
                updateData.status = 'OPEN';
            }

            const updated = await tx.downtimeEvent.update({
                where: { id: dto.id },
                data: updateData
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'DowntimeEvent',
                recordId: dto.id,
                oldValue: {
                    status: existing.status,
                    duration_minutes: existing.duration_minutes
                },
                newValue: updateData
            }, tx);

            return updated;
        });
    }

    async resolveDowntimeEvent(dto: ResolveDowntimeEventDTO, userId: number): Promise<DowntimeEvent> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.downtimeEvent.findUnique({ where: { id: dto.id } });
            if (!existing) throw new NotFoundError('DowntimeEvent', dto.id);
            if (existing.status === 'RESOLVED') {
                throw new BusinessRuleError('DowntimeEvent is already resolved.');
            }

            const endDate = new Date(dto.end_time);
            const duration_minutes = (endDate.getTime() - existing.start_time.getTime()) / 60000;

            if (duration_minutes < 0) {
                throw new BusinessRuleError('End time cannot be earlier than start time.');
            }

            const updated = await tx.downtimeEvent.update({
                where: { id: dto.id },
                data: {
                    end_time: endDate,
                    duration_minutes,
                    resolution: dto.resolution,
                    status: 'RESOLVED'
                }
            });

            await auditService.log({
                userId,
                action: 'UPDATE',
                tableName: 'DowntimeEvent',
                recordId: dto.id,
                oldValue: { status: existing.status },
                newValue: { status: 'RESOLVED', resolution: dto.resolution, duration_minutes }
            }, tx);

            return updated;
        });
    }

    async deleteDowntimeEvent(id: number, userId: number): Promise<boolean> {
        return await prisma.$transaction(async (tx) => {
            const existing = await tx.downtimeEvent.findUnique({ where: { id } });
            if (!existing) throw new NotFoundError('DowntimeEvent', id);

            await tx.downtimeEvent.delete({ where: { id } });

            await auditService.log({
                userId,
                action: 'DELETE',
                tableName: 'DowntimeEvent',
                recordId: id,
                oldValue: { id_machine: existing.id_machine, start_time: existing.start_time }
            }, tx);

            return true;
        });
    }

    async getDowntimeEventById(id: number): Promise<DowntimeEvent> {
        const item = await downtimeEventRepository.findById(id);
        if (!item) throw new NotFoundError('DowntimeEvent', id);
        return item;
    }

    async getDowntimeEvents(params: DowntimeEventListParams): Promise<{ downtimeEvents: DowntimeEvent[], total: number }> {
        return await downtimeEventRepository.findWithFilters(params);
    }
}

export const downtimeEventService = new DowntimeEventService();
