import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_deleteWorkOrder_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number
}

export type T_deleteWorkOrder = (request: {
    params: T_deleteWorkOrder_params,
    headers: { authorization: string }
}) => Promise<{
    message: string
}>

export const T_deleteWorkOrder_meta = {
    method: 'DELETE' as const,
    url: '/work-orders/:id',
    requireAuth: true
}
