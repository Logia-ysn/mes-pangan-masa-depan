/**
 * Stock Movement Repository
 * Handles all database operations for StockMovement entity
 */

import { BaseRepository } from './base.repository';
import { StockMovement } from '../../types/model/table/StockMovement';
import { FindManyOptions, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';

export interface StockMovementListParams {
    limit?: number;
    offset?: number;
    id_stock?: number;
    movement_type?: string;
    reference_type?: string;
    start_date?: Date;
    end_date?: Date;
}

export class StockMovementRepository extends BaseRepository<StockMovement> {
    protected entity = StockMovement;

    /**
     * Find movements by stock ID
     */
    async findByStock(id_stock: number): Promise<StockMovement[]> {
        return await StockMovement.find({
            where: { id_stock },
            order: { created_at: 'DESC' }
        });
    }

    /**
     * Find movements by reference
     */
    async findByReference(reference_type: string, reference_id: number): Promise<StockMovement[]> {
        return await StockMovement.find({
            where: { reference_type, reference_id }
        });
    }

    /**
     * Find all movements with filtering
     */
    async findWithFilters(params: StockMovementListParams): Promise<{ movements: StockMovement[], total: number }> {
        const options: FindManyOptions<StockMovement> = {
            take: params.limit || 20,
            skip: params.offset || 0,
            order: { created_at: 'DESC' },
            relations: ['otm_id_stock', 'otm_id_user']
        };

        const where: any = {};

        if (params.id_stock) {
            where.id_stock = params.id_stock;
        }

        if (params.movement_type) {
            where.movement_type = params.movement_type;
        }

        if (params.reference_type) {
            where.reference_type = params.reference_type;
        }

        if (params.start_date && params.end_date) {
            where.created_at = Between(params.start_date, params.end_date);
        } else if (params.start_date) {
            where.created_at = MoreThanOrEqual(params.start_date);
        } else if (params.end_date) {
            where.created_at = LessThanOrEqual(params.end_date);
        }

        if (Object.keys(where).length > 0) {
            options.where = where;
        }

        const [movements, total] = await StockMovement.findAndCount(options);
        return { movements, total };
    }

    /**
     * Create movement record
     */
    async createMovement(data: {
        id_stock: number;
        id_user: number;
        movement_type: string;
        quantity: number;
        reference_type?: string;
        reference_id?: number;
        notes?: string;
    }): Promise<StockMovement> {
        const movement = new StockMovement();
        movement.id_stock = data.id_stock;
        movement.id_user = data.id_user;
        movement.movement_type = data.movement_type as any;
        movement.quantity = data.quantity;
        movement.reference_type = data.reference_type;
        movement.reference_id = data.reference_id;
        movement.notes = data.notes;
        await movement.save();
        return movement;
    }
}

// Singleton instance
export const stockMovementRepository = new StockMovementRepository();
