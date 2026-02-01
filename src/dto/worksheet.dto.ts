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
