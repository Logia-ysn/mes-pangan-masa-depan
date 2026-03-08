/**
 * Worksheet Types
 * Centralized type definitions for worksheet module (Backend)
 * Replaces scattered DTOs and `any` types across worksheet.service.ts
 * 
 * @module worksheet.types
 */

import {
    Worksheet,
    WorksheetInputBatch,
    WorksheetSideProduct,
    Worksheet_shift_enum,
    Worksheet_status_enum,
    StockMovement_movement_type_enum
} from '@prisma/client';

// Re-export Prisma enums for convenience
export { Worksheet_shift_enum, Worksheet_status_enum, StockMovement_movement_type_enum };

// ─── Input Batch DTO ────────────────────────────────────────────
export interface InputBatchDTO {
    id_stock: number;
    quantity: number;
    unit_price?: number;
    batch_code?: string;
}

// ─── Side Product DTO ───────────────────────────────────────────
export interface SideProductDTO {
    id_product_type?: number;
    product_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_value: number;
    is_auto_calculated: boolean;
    auto_percentage?: number;
}

// ─── Create Worksheet DTO ───────────────────────────────────────
export interface CreateWorksheetDTO {
    id_factory: number;
    id_user: number;
    worksheet_date: string;
    shift: Worksheet_shift_enum;
    gabah_input: number;
    beras_output: number;
    menir_output?: number;
    dedak_output?: number;
    sekam_output?: number;
    machine_hours?: number;
    downtime_hours?: number;
    downtime_reason?: string;
    notes?: string;
    // PMD 1 fields
    /** @deprecated Use id_machines[] instead */
    input_batch_id?: number;
    id_machine?: number;
    /** @deprecated Legacy field */
    input_category_code?: string;
    process_step?: string;
    production_cost?: number;
    // Enhancement fields (HPP Calculation)
    id_output_product?: number;
    process_steps?: string;
    batch_code?: string;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    input_batches?: InputBatchDTO[];
    side_products?: SideProductDTO[];
    id_machines?: number[];
    id_operators?: number[];
    id_input_product_type?: number;
    id_production_line?: number;
}

// ─── Update Worksheet DTO ───────────────────────────────────────
export interface UpdateWorksheetDTO extends Partial<CreateWorksheetDTO> {
    id: number;
}

// ─── HPP Calculation ────────────────────────────────────────────
export interface HPPCalculationInput {
    inputBatches: Array<{ quantity: number; unit_price: number }>;
    sideProducts: Array<{ quantity: number; unit_price: number }>;
    productionCost: number;
    berasOutput: number;
}

export interface HPPResult {
    rawMaterialCost: number;
    sideProductRevenue: number;
    productionCost: number;
    hpp: number;
    hppPerKg: number;
}

// ─── Worksheet with Relations ───────────────────────────────────
// Extends the Prisma Worksheet type with common includes
export interface WorksheetWithRelations extends Worksheet {
    WorksheetInputBatch: (WorksheetInputBatch & {
        Stock?: {
            id: number;
            quantity: number;
            ProductType?: { id: number; code: string; name: string };
        };
    })[];
    WorksheetSideProduct: WorksheetSideProduct[];
    Factory?: { id: number; code: string; name: string };
    User?: { id: number; fullname: string };
    OutputProduct?: { id: number; code: string; name: string };
}

// ─── Stock Movement Params ──────────────────────────────────────
export interface StockMovementParams {
    stockId: number;
    userId: number;
    type: StockMovement_movement_type_enum;
    quantity: number;
    referenceType: string;
    referenceId: number | bigint;
    notes: string;
    batchCode?: string | null;
}

// ─── Worksheet List Params ──────────────────────────────────────
export interface WorksheetListParams {
    limit?: number;
    offset?: number;
    id_factory?: number;
    status?: string;
    start_date?: string;
    end_date?: string;
    id_production_line?: number;
}

// ─── Worksheet List Result ──────────────────────────────────────
export interface WorksheetListResult {
    worksheets: Worksheet[];
    total: number;
}
