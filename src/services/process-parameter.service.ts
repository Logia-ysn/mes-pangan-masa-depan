import { ProcessParameterLog, Prisma } from '@prisma/client';
import { processParameterRepository } from '../repositories/process-parameter.repository';
import { auditService } from './audit.service';

export class ProcessParameterService {
    async createLog(
        data: Prisma.ProcessParameterLogUncheckedCreateInput,
        userId: number
    ): Promise<ProcessParameterLog> {
        const log = await processParameterRepository.create(data);

        await auditService.log({
            userId,
            action: 'CREATE',
            tableName: 'ProcessParameterLog',
            recordId: log.id,
            newValue: log as any,
        });

        return log;
    }

    async getLogs(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        id_machine?: number;
        batch_code?: string;
        startDate?: string;
        endDate?: string;
    }) {
        const where: Prisma.ProcessParameterLogWhereInput = {};
        if (params.id_factory) where.id_factory = params.id_factory;
        if (params.id_machine) where.id_machine = params.id_machine;
        if (params.batch_code) where.batch_code = params.batch_code;

        if (params.startDate || params.endDate) {
            where.recorded_at = {};
            if (params.startDate) where.recorded_at.gte = new Date(params.startDate);
            if (params.endDate) where.recorded_at.lte = new Date(params.endDate);
        }

        return await processParameterRepository.findAll({
            skip: params.offset || 0,
            take: params.limit || 50,
            where,
            orderBy: { recorded_at: 'desc' }
        });
    }

    async getMachineTrend(id_machine: number, startDate: Date, endDate: Date) {
        const stats = await processParameterRepository.getAggregateStats(id_machine, startDate, endDate);

        const logs = await processParameterRepository.findAll({
            where: {
                id_machine,
                recorded_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            orderBy: { recorded_at: 'asc' },
            take: 200
        });

        return { stats, logs };
    }
}

export const processParameterService = new ProcessParameterService();
