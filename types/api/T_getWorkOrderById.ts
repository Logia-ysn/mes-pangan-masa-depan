import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_getWorkOrderById_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number
}

export type T_getWorkOrderById = (request: {
    params: T_getWorkOrderById_params,
    headers: { authorization: string }
}) => Promise<{
    data: any
}>

export const method = 'GET';
export const url_path = '/work-orders/:id';
export const alias = 't_getWorkOrderById';
