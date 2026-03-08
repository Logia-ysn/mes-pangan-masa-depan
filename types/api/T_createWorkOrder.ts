import { IsString, IsOptional, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_createWorkOrder_body {
    @IsString()
    title!: string

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

export type T_createWorkOrder = (request: {
    body: T_createWorkOrder_body,
    headers: { authorization: string }
}) => Promise<{
    message: string,
    data: any
}>

export const T_createWorkOrder_meta = {
    method: 'POST' as const,
    url: '/work-orders',
    requireAuth: true
}
