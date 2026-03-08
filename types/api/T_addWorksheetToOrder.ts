import { IsNumber, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class T_workOrderWorksheet_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number
}

export class T_addWorksheetToOrder_body {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id_worksheet!: number

    @IsOptional()
    @Transform((param?: any): number => param?.value ? parseFloat(param.value) : 1)
    @IsNumber()
    step_number?: number
}

export type T_addWorksheetToOrder = (request: {
    params: T_workOrderWorksheet_params,
    body: T_addWorksheetToOrder_body,
    headers: { authorization: string }
}) => Promise<{
    message: string
}>

export const method = 'POST';
export const url_path = '/work-orders/:id/worksheets';
export const alias = 't_addWorksheetToOrder';
