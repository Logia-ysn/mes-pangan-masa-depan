import { IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_removeWorksheetFromOrder_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number

    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    worksheetId!: number
}

export type T_removeWorksheetFromOrder = (request: {
    params: T_removeWorksheetFromOrder_params,
    headers: { authorization: string }
}) => Promise<{
    message: string
}>

export const method = 'DELETE';
export const url_path = '/work-orders/:id/worksheets/:worksheetId';
export const alias = 't_removeWorksheetFromOrder';
