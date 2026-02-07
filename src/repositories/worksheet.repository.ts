/**
 * Worksheet Repository
 * Handles all database operations for Worksheet entity
 */

import { BaseRepository } from './base.repository';
import { Worksheet } from '../../types/model/table/Worksheet';
import { FindManyOptions, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

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
    protected entity = Worksheet;

    /**
     * Find worksheet by ID with full relations
     */
    async findById(id: number): Promise<Worksheet | null> {
        return await Worksheet.findOne({
            where: { id },
            relations: [
                'otm_id_factory',
                'otm_id_user',
                'otm_id_output_product',
                'otm_id_machine',
                'input_batches',
                'input_batches.otm_id_stock',
                'input_batches.otm_id_stock.otm_id_product_type',
                'side_products'
            ]
        });
    }

    /**
     * Find worksheets by factory
     */
    async findByFactory(id_factory: number): Promise<Worksheet[]> {
        return await Worksheet.find({
            where: { id_factory },
            order: { worksheet_date: 'DESC' },
            relations: ['otm_id_factory', 'otm_id_user']
        });
    }

    /**
     * Find worksheets by date range
     */
    async findByDateRange(start: Date, end: Date, id_factory?: number): Promise<Worksheet[]> {
        const where: any = {
            worksheet_date: Between(start, end)
        };

        if (id_factory) {
            where.id_factory = id_factory;
        }

        return await Worksheet.find({
            where,
            order: { worksheet_date: 'DESC' },
            relations: ['otm_id_factory', 'otm_id_user']
        });
    }

    /**
     * Find all worksheets with filtering
     */
    async findWithFilters(params: WorksheetListParams): Promise<{ worksheets: Worksheet[], total: number }> {
        const options: FindManyOptions<Worksheet> = {
            take: params.limit || 20,
            skip: params.offset || 0,
            order: { worksheet_date: 'DESC', id: 'DESC' },
            relations: ['otm_id_factory', 'otm_id_user', 'otm_id_output_product', 'otm_id_machine', 'side_products']
        };

        const where: any = {};

        if (params.id_factory) {
            where.id_factory = params.id_factory;
        }

        if (params.id_user) {
            where.id_user = params.id_user;
        }

        if (params.shift) {
            where.shift = params.shift;
        }

        if (params.process_step) {
            where.process_step = params.process_step;
        }

        if (params.start_date && params.end_date) {
            where.worksheet_date = Between(params.start_date, params.end_date);
        } else if (params.start_date) {
            where.worksheet_date = MoreThanOrEqual(params.start_date);
        } else if (params.end_date) {
            where.worksheet_date = LessThanOrEqual(params.end_date);
        }

        if (Object.keys(where).length > 0) {
            options.where = where;
        }

        const [worksheets, total] = await Worksheet.findAndCount(options);
        return { worksheets, total };
    }

    /**
     * Get production statistics for a factory
     */
    async getProductionStats(id_factory: number, start_date?: Date, end_date?: Date): Promise<ProductionStats> {
        const query = this.entity.createQueryBuilder('worksheet')
            .select('COALESCE(SUM(worksheet.gabah_input), 0)', 'total_input')
            .addSelect('COALESCE(SUM(worksheet.beras_output), 0)', 'total_output')
            .addSelect('COALESCE(SUM(worksheet.menir_output), 0)', 'total_menir')
            .addSelect('COALESCE(SUM(worksheet.dedak_output), 0)', 'total_dedak')
            .addSelect('COALESCE(SUM(worksheet.sekam_output), 0)', 'total_sekam')
            .addSelect('COALESCE(AVG(NULLIF(worksheet.rendemen, 0)), 0)', 'avg_rendemen')
            .addSelect('COUNT(worksheet.id)', 'worksheet_count')
            .where('worksheet.id_factory = :id_factory', { id_factory });

        if (start_date && end_date) {
            query.andWhere('worksheet.worksheet_date BETWEEN :start_date AND :end_date', { start_date, end_date });
        }

        const result = await query.getRawOne();

        return {
            total_input: parseFloat(result.total_input),
            total_output: parseFloat(result.total_output),
            total_menir: parseFloat(result.total_menir),
            total_dedak: parseFloat(result.total_dedak),
            total_sekam: parseFloat(result.total_sekam),
            avg_rendemen: parseFloat(result.avg_rendemen),
            worksheet_count: parseInt(result.worksheet_count, 10)
        };
    }

    /**
     * Get worksheets by process step
     */
    async findByProcessStep(process_step: string, id_factory?: number): Promise<Worksheet[]> {
        const where: any = { process_step };

        if (id_factory) {
            where.id_factory = id_factory;
        }

        return await Worksheet.find({
            where,
            order: { worksheet_date: 'DESC' }
        });
    }
}

// Singleton instance
export const worksheetRepository = new WorksheetRepository();
