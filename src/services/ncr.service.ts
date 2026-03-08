import { NonConformanceReport, Prisma } from '@prisma/client';
import { ncrRepository } from '../repositories/ncr.repository';
import { auditService } from './audit.service';
import { sequenceService } from '../services/sequence.service';

import { productionEventBus, EVENTS } from '../events/production-event-bus';

export class NonConformanceReportService {
    private async generateReportNumber(id_factory: number, date: Date): Promise<string> {
        const sequenceKey = `NCR-${id_factory}`;
        const nextNumber = await sequenceService.getNextSequence(sequenceKey, date);
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        return `NCR-${id_factory}-${dateStr}-${nextNumber.toString().padStart(4, '0')}`;
    }

    async createReport(
        data: Omit<Prisma.NonConformanceReportUncheckedCreateInput, 'report_number'>,
        userId: number
    ): Promise<NonConformanceReport> {
        const report_number = await this.generateReportNumber(data.id_factory, new Date());

        const ncr = await ncrRepository.create({
            ...data,
            report_number,
        });

        await auditService.log({
            userId,
            action: 'CREATE',
            tableName: 'NonConformanceReport',
            recordId: ncr.id,
            newValue: ncr as any,
        });

        productionEventBus.emitNCREvent(EVENTS.NCR_CREATED, {
            ncrId: ncr.id,
            reportNumber: ncr.report_number,
            severity: ncr.severity,
            userId
        });

        return ncr;
    }

    async updateReport(
        id: number,
        data: Prisma.NonConformanceReportUncheckedUpdateInput,
        userId: number
    ): Promise<NonConformanceReport> {
        const existing = await ncrRepository.findById(id);
        if (!existing) throw new Error('NCR not found');

        const ncr = await ncrRepository.update(id, data);

        await auditService.log({
            userId,
            action: 'UPDATE',
            tableName: 'NonConformanceReport',
            recordId: ncr.id,
            oldValue: existing as any,
            newValue: ncr as any,
        });

        return ncr;
    }

    async resolveReport(
        id: number,
        data: { action_plan: string, action_taken: string, status: 'ACTION_TAKEN' | 'CLOSED' },
        userId: number
    ): Promise<NonConformanceReport> {
        const existing = await ncrRepository.findById(id);
        if (!existing) throw new Error('NCR not found');

        const updateData: Prisma.NonConformanceReportUncheckedUpdateInput = {
            action_plan: data.action_plan,
            action_taken: data.action_taken,
            status: data.status,
            resolved_by: userId,
            resolved_at: new Date()
        };

        const ncr = await ncrRepository.update(id, updateData);

        await auditService.log({
            userId,
            action: 'RESOLVE',
            tableName: 'NonConformanceReport',
            recordId: ncr.id,
            oldValue: existing as any,
            newValue: ncr as any,
        });

        productionEventBus.emitNCREvent(EVENTS.NCR_RESOLVED, {
            ncrId: ncr.id,
            reportNumber: ncr.report_number,
            severity: ncr.severity,
            userId
        });

        return ncr;
    }

    async deleteReport(id: number, userId: number): Promise<void> {
        const existing = await ncrRepository.findById(id);
        if (!existing) throw new Error('NCR not found');

        await ncrRepository.delete(id);

        await auditService.log({
            userId,
            action: 'DELETE',
            tableName: 'NonConformanceReport',
            recordId: id,
            oldValue: existing as any,
        });
    }

    async getReports(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        status?: string;
        severity?: string;
    }) {
        const where: Prisma.NonConformanceReportWhereInput = {};
        if (params.id_factory) where.id_factory = params.id_factory;
        if (params.status) where.status = params.status as any;
        if (params.severity) where.severity = params.severity as any;

        return await ncrRepository.findAll({
            skip: params.offset || 0,
            take: params.limit || 15,
            where,
            orderBy: { created_at: 'desc' }
        });
    }

    async getReportById(id: number) {
        return await ncrRepository.findById(id);
    }
}

export const ncrService = new NonConformanceReportService();
