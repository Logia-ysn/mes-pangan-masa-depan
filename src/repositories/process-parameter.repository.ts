import { Prisma, ProcessParameterLog } from '@prisma/client';
import { prisma } from '../libs/prisma';

class ProcessParameterRepository {
    async create(data: Prisma.ProcessParameterLogUncheckedCreateInput): Promise<ProcessParameterLog> {
        return prisma.processParameterLog.create({
            data,
        });
    }

    async findAll(params: {
        skip?: number;
        take?: number;
        where?: Prisma.ProcessParameterLogWhereInput;
        orderBy?: Prisma.ProcessParameterLogOrderByWithRelationInput;
    }): Promise<ProcessParameterLog[]> {
        return prisma.processParameterLog.findMany({
            skip: params.skip,
            take: params.take,
            where: params.where,
            orderBy: params.orderBy,
            include: {
                Machine: { select: { name: true, code: true } },
                Factory: { select: { name: true } },
                User: { select: { fullname: true } },
            }
        });
    }

    async findById(id: number): Promise<ProcessParameterLog | null> {
        return prisma.processParameterLog.findUnique({
            where: { id },
            include: {
                Machine: { select: { name: true, code: true } },
            }
        });
    }

    async getAggregateStats(id_machine: number, startDate: Date, endDate: Date) {
        return prisma.processParameterLog.aggregate({
            where: {
                id_machine,
                recorded_at: {
                    gte: startDate,
                    lte: endDate
                }
            },
            _avg: {
                temperature: true,
                humidity: true,
                pressure: true,
                motor_speed: true,
                ampere: true
            },
            _min: {
                temperature: true,
                humidity: true,
                pressure: true,
                motor_speed: true,
                ampere: true
            },
            _max: {
                temperature: true,
                humidity: true,
                pressure: true,
                motor_speed: true,
                ampere: true
            }
        });
    }
}

export const processParameterRepository = new ProcessParameterRepository();
