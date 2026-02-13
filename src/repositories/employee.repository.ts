/**
 * Employee Repository
 * Handles all database operations for Employee entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { Employee } from '@prisma/client';

export class EmployeeRepository extends BaseRepository<Employee> {
    protected modelName = 'Employee';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        search?: string;
        department?: string;
        employment_status?: string;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.id_factory) where.id_factory = params.id_factory;
        if (params.search) {
            where.fullname = { contains: params.search, mode: 'insensitive' };
        }
        if (params.department) where.department = params.department;
        if (params.employment_status) where.employment_status = params.employment_status;
        if (params.is_active !== undefined) where.is_active = params.is_active;

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 10,
                skip: params.offset || 0,
                orderBy: { created_at: 'desc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const employeeRepository = new EmployeeRepository();
