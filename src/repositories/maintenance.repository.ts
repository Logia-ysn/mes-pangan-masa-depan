/**
 * Maintenance Repository
 * Handles all database operations for Maintenance entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { Maintenance } from '@prisma/client';

export class MaintenanceRepository extends BaseRepository<Maintenance> {
    protected modelName = 'Maintenance';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_machine?: number;
        maintenance_type?: string;
        start_date?: Date;
        end_date?: Date;
    }) {
        const where: any = {};
        if (params.id_machine) where.id_machine = params.id_machine;
        if (params.maintenance_type) where.maintenance_type = params.maintenance_type;
        if (params.start_date || params.end_date) {
            where.maintenance_date = {};
            if (params.start_date) where.maintenance_date.gte = params.start_date;
            if (params.end_date) where.maintenance_date.lte = params.end_date;
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 10,
                skip: params.offset || 0,
                orderBy: { maintenance_date: 'desc' },
                include: {
                    Machine: true
                }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const maintenanceRepository = new MaintenanceRepository();
