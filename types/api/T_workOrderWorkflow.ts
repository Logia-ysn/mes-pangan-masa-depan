import { IsNumber, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_workOrderWorkflow_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number
}

export class T_workOrderWorkflow_body {
    @IsString()
    action!: string // 'start' | 'complete' | 'cancel'

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber()
    actual_quantity?: number

    @IsOptional()
    @IsString()
    reason?: string
}

export type T_workOrderWorkflow = (request: {
    params: T_workOrderWorkflow_params,
    body: T_workOrderWorkflow_body,
    headers: { authorization: string }
}) => Promise<{
    message: string,
    data: any
}>

export const method = 'POST';
export const url_path = '/work-orders/:id/workflow';
export const alias = 't_workOrderWorkflow';
