/**
 * Stock Movement Repository
 * Handles all database operations for StockMovement entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { StockMovement, StockMovement_movement_type_enum } from '@prisma/client';

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
    protected modelName = 'StockMovement';

    /**
     * Find movements by stock ID
     */
    async findByStock(id_stock: number): Promise<StockMovement[]> {
        return await this.model.findMany({
            where: { id_stock },
            orderBy: { created_at: 'desc' }
        });
    }

    /**
     * Find movements by reference
     */
    async findByReference(reference_type: string, reference_id: number): Promise<StockMovement[]> {
        return await this.model.findMany({
            where: { reference_type, reference_id }
        });
    }

    /**
     * Find all movements with filtering
     */
    async findWithFilters(params: StockMovementListParams): Promise<{ movements: StockMovement[], total: number }> {
        const where: any = {};

        if (params.id_stock) {
            where.id_stock = params.id_stock;
        }

        if (params.movement_type) {
            where.movement_type = params.movement_type as StockMovement_movement_type_enum;
        }

        if (params.reference_type) {
            where.reference_type = params.reference_type;
        }

        if (params.start_date || params.end_date) {
            where.created_at = {};
            if (params.start_date) where.created_at.gte = params.start_date;
            if (params.end_date) where.created_at.lte = params.end_date;
        }

        console.log('StockMovementRepository.findWithFilters called with:', params);
        const [movements, total] = await Promise.all([
            this.model.findMany({
                where,
                take: params.limit || 20,
                skip: params.offset || 0,
                orderBy: { created_at: 'desc' },
                include: {
                    Stock: {
                        include: {
                            Factory: true,
                            ProductType: true
                        }
                    },
                    User: true
                }
            }),
            this.model.count({ where })
        ]);

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
        reference_id?: number | bigint;
        notes?: string;
    }): Promise<StockMovement> {
        return await this.model.create({
            data: {
                id_stock: data.id_stock,
                id_user: data.id_user,
                movement_type: data.movement_type as StockMovement_movement_type_enum,
                quantity: data.quantity,
                reference_type: data.reference_type,
                reference_id: data.reference_id,
                notes: data.notes
            }
        });
    }
}

// Singleton instance
export const stockMovementRepository = new StockMovementRepository();
