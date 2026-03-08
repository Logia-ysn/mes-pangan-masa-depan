import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_getWorkOrders_query {
    @IsOptional()
    @Transform((param?: any): number | undefined => param?.value ? parseFloat(param.value) : undefined)
    @IsNumber()
    limit?: number

    @IsOptional()
    @Transform((param?: any): number | undefined => param?.value ? parseFloat(param.value) : undefined)
    @IsNumber()
    offset?: number

    @IsOptional()
    @IsString()
    status?: string

    @IsOptional()
    @IsString()
    priority?: string

    @IsOptional()
    @Transform((param?: any): number | undefined => param?.value ? parseFloat(param.value) : undefined)
    @IsNumber()
    id_production_line?: number

    @IsOptional()
    @IsString()
    start_date?: string

    @IsOptional()
    @IsString()
    end_date?: string
}

export type T_getWorkOrders = (request: {
    query: T_getWorkOrders_query,
    headers: { authorization: string }
}) => Promise<{
    data: any[],
    total: number
}>

export const method = 'GET';
export const url_path = '/work-orders';
export const alias = 't_getWorkOrders';
