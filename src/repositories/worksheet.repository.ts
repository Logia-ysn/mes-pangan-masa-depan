/**
 * Worksheet Repository
 * Handles all database operations for Worksheet entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { Worksheet, Worksheet_shift_enum } from '@prisma/client';

export interface WorksheetListParams {
    limit?: number;
    offset?: number;
    id_factory?: number;
    id_user?: number;
    shift?: string;
    process_step?: string;
    start_date?: Date;
    end_date?: Date;
}

export interface ProductionStats {
    total_input: number;
    total_output: number;
    total_menir: number;
    total_dedak: number;
    total_sekam: number;
    avg_rendemen: number;
    worksheet_count: number;
}

export class WorksheetRepository extends BaseRepository<Worksheet> {
    protected modelName = 'Worksheet';

    /**
     * Find worksheet by ID with full relations
     */
    async findById(id: number): Promise<Worksheet | null> {
        return await this.model.findUnique({
            where: { id },
            include: {
                Factory: true,
                User: true,
                ProductType: true,
                Machine: true,
                WorksheetInputBatch: {
                    include: {
                        Stock: {
                            include: {
                                ProductType: true
                            }
                        }
                    }
                },
                WorksheetSideProduct: true
            }
        });
    }

    /**
     * Find worksheets by factory
     */
    async findByFactory(id_factory: number): Promise<Worksheet[]> {
        return await this.model.findMany({
            where: { id_factory },
            orderBy: { worksheet_date: 'desc' },
            include: {
                Factory: true,
                User: true
            }
        });
    }

    /**
     * Find worksheets by date range
     */
    async findByDateRange(start: Date, end: Date, id_factory?: number): Promise<Worksheet[]> {
        const where: any = {
            worksheet_date: {
                gte: start,
                lte: end
            }
        };

        if (id_factory) {
            where.id_factory = id_factory;
        }

        return await this.model.findMany({
            where,
            orderBy: { worksheet_date: 'desc' },
            include: {
                Factory: true,
                User: true
            }
        });
    }

    /**
     * Find all worksheets with filtering
     */
    async findWithFilters(params: WorksheetListParams): Promise<{ worksheets: Worksheet[], total: number }> {
        const where: any = {};

        if (params.id_factory) {
            where.id_factory = params.id_factory;
        }

        if (params.id_user) {
            where.id_user = params.id_user;
        }

        if (params.shift) {
            where.shift = params.shift as Worksheet_shift_enum;
        }

        if (params.start_date || params.end_date) {
            where.worksheet_date = {};
            if (params.start_date) where.worksheet_date.gte = params.start_date;
            if (params.end_date) where.worksheet_date.lte = params.end_date;
        }

        const [worksheets, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: [
                    { worksheet_date: 'desc' },
                    { id: 'desc' }
                ],
                include: {
                    Factory: true,
                    User: true,
                    ProductType: true,
                    Machine: true,
                    WorksheetSideProduct: true
                }
            }),
            this.model.count({ where })
        ]);

        return { worksheets, total };
    }

    /**
     * Get production statistics for a factory
     */
    async getProductionStats(id_factory: number, start_date?: Date, end_date?: Date): Promise<ProductionStats> {
        const where: any = { id_factory };

        if (start_date || end_date) {
            where.worksheet_date = {};
            if (start_date) where.worksheet_date.gte = start_date;
            if (end_date) where.worksheet_date.lte = end_date;
        }

        const stats = await this.model.aggregate({
            where,
            _sum: {
                gabah_input: true,
                beras_output: true,
                menir_output: true,
                dedak_output: true,
                sekam_output: true
            },
            _avg: {
                rendemen: true
            },
            _count: {
                id: true
            }
        });

        return {
            total_input: Number(stats._sum.gabah_input || 0),
            total_output: Number(stats._sum.beras_output || 0),
            total_menir: Number(stats._sum.menir_output || 0),
            total_dedak: Number(stats._sum.dedak_output || 0),
            total_sekam: Number(stats._sum.sekam_output || 0),
            avg_rendemen: Number(stats._avg.rendemen || 0),
            worksheet_count: stats._count.id
        };
    }
}

// Singleton instance
export const worksheetRepository = new WorksheetRepository();
