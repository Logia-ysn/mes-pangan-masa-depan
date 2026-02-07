/**
 * Worksheet DTOs
 * Data Transfer Objects for Worksheet operations
 */

import { WorkshiftType } from '../../types/model/enum/WorkshiftType';

// Process step constants
export const PROCESS_STEPS = {
    DRYING: 'DRYING',
    HUSKING: 'HUSKING',
    STONE_POLISHING: 'STONE_POLISHING'
} as const;

export type ProcessStep = typeof PROCESS_STEPS[keyof typeof PROCESS_STEPS];

export interface CreateWorksheetDTO {
    id_factory: number;
    worksheet_date: string;
    shift: WorkshiftType;
    gabah_input: number;
    beras_output: number;
    menir_output?: number;
    dedak_output?: number;
    sekam_output?: number;
    machine_hours?: number;
    downtime_hours?: number;
    downtime_reason?: string;
    notes?: string;
    input_batch_id?: number;
    input_category_code?: string;
    process_step?: ProcessStep;
    production_cost?: number;
    // Extended fields
    id_output_product?: number;
    process_steps?: string;
    batch_code?: string;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    input_batches?: any[];
    side_products?: any[];
    id_machine?: number; // Added missing field
    id_user: number; // Added missing field
}

import { IsNumber, IsString, IsDateString, IsOptional, IsEnum, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

// DTO Classes for Nested Validation
export class InputBatchDTO {
    @IsNumber()
    id_stock!: number;

    @IsNumber()
    quantity!: number;

    @IsOptional()
    @IsNumber()
    unit_price?: number;
}

export class SideProductDTO {
    @IsString()
    product_code!: string;

    @IsString()
    product_name!: string;

    @IsNumber()
    quantity!: number;

    @IsNumber()
    unit_price!: number;

    @IsNumber()
    total_value!: number;

    @IsOptional()
    is_auto_calculated!: boolean;

    @IsOptional()
    @IsNumber()
    auto_percentage?: number;
}

export class CreateWorksheetSchema implements CreateWorksheetDTO {
    @IsNumber()
    id_factory!: number;

    @IsNumber()
    id_user!: number;

    @IsDateString()
    worksheet_date!: string;

    @IsEnum(WorkshiftType)
    shift!: WorkshiftType;

    @IsNumber()
    gabah_input!: number;

    @IsNumber()
    beras_output!: number;

    @IsOptional()
    @IsNumber()
    menir_output?: number;

    @IsOptional()
    @IsNumber()
    dedak_output?: number;

    @IsOptional()
    @IsNumber()
    sekam_output?: number;

    @IsOptional()
    @IsNumber()
    machine_hours?: number;

    @IsOptional()
    @IsNumber()
    downtime_hours?: number;

    @IsOptional()
    @IsString()
    downtime_reason?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    // Extended fields
    @IsOptional()
    @IsNumber()
    input_batch_id?: number;

    @IsOptional()
    @IsString()
    input_category_code?: string;

    @IsOptional()
    @IsString()
    process_step?: ProcessStep;

    @IsOptional()
    @IsNumber()
    production_cost?: number;

    @IsOptional()
    @IsNumber()
    id_output_product?: number;

    @IsOptional()
    @IsString()
    process_steps?: string;

    @IsOptional()
    @IsString()
    batch_code?: string;

    @IsOptional()
    @IsNumber()
    raw_material_cost?: number;

    @IsOptional()
    @IsNumber()
    side_product_revenue?: number;

    @IsOptional()
    @IsNumber()
    hpp?: number;

    @IsOptional()
    @IsNumber()
    hpp_per_kg?: number;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InputBatchDTO)
    input_batches?: InputBatchDTO[];

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => SideProductDTO)
    side_products?: SideProductDTO[];

    @IsOptional()
    @IsNumber()
    id_machine?: number;
}

export interface UpdateWorksheetDTO extends Partial<CreateWorksheetDTO> {
    id: number;
}

export interface WorksheetFilterDTO {
    limit?: number;
    offset?: number;
    id_factory?: number;
    start_date?: string;
    end_date?: string;
    shift?: string;
    process_step?: string;
}
