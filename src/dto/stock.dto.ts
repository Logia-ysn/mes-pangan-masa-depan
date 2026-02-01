/**
 * Stock DTOs
 * Data Transfer Objects for Stock operations
 */

import { MovementType } from '../../types/model/enum/MovementType';

export interface CreateStockDTO {
    id_factory: number;
    id_product_type: number;
    quantity: number;
    unit: string;
}

export interface UpdateStockDTO {
    quantity?: number;
    unit?: string;
}

export interface StockMovementDTO {
    factoryId: number;
    productCode: string;
    quantity: number;
    movementType: MovementType;
    referenceType?: string;
    referenceId?: number;
    notes?: string;
}

export interface StockTransferDTO {
    fromFactoryId: number;
    toFactoryId: number;
    productCode: string;
    quantity: number;
}

export interface StockFilterDTO {
    limit?: number;
    offset?: number;
    id_factory?: number;
    id_product_type?: number;
}
