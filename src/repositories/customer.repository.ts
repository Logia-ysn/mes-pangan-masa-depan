import { BaseRepository } from './base.repository';
import { Customer } from '@prisma/client';

export class CustomerRepository extends BaseRepository<Customer> {
    protected modelName = 'Customer';

    async findWithFilters(params: {
        limit?: number;
        offset?: number;
        search?: string;
        is_active?: boolean;
    }) {
        const where: any = {};
        if (params.search) {
            where.OR = [
                { name: { contains: params.search, mode: 'insensitive' } },
                { code: { contains: params.search, mode: 'insensitive' } }
            ];
        }
        if (params.is_active !== undefined) {
            where.is_active = params.is_active;
        }

        const [data, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 100,
                skip: params.offset || 0,
                orderBy: { name: 'asc' }
            }),
            this.model.count({ where })
        ]);

        return { data, total };
    }
}

export const customerRepository = new CustomerRepository();
