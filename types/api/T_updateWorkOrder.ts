import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_updateWorkOrder_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number
}

export class T_updateWorkOrder_body {
    @IsOptional()
    @IsString()
    title?: string

    @IsOptional()
    @IsString()
    description?: string

    @IsOptional()
    @IsString()
    priority?: string

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber()
    id_production_line?: number

    @IsOptional()
    @IsString()
    planned_start?: string

    @IsOptional()
    @IsString()
    planned_end?: string

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber()
    target_quantity?: number

    @IsOptional()
    @IsString()
    notes?: string
}

export type T_updateWorkOrder = (request: {
    params: T_updateWorkOrder_params,
    body: T_updateWorkOrder_body,
    headers: { authorization: string }
}) => Promise<{
    message: string,
    data: any
}>

export const T_updateWorkOrder_meta = {
    method: 'PUT' as const,
    url: '/work-orders/:id',
    requireAuth: true
}
