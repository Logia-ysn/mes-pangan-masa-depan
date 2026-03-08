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

export class T_removeWorksheetFromOrder_params {
    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    id!: number

    @Transform((param?: any): number => parseFloat(param.value))
    @IsNumber()
    worksheetId!: number
}

export type T_addWorksheetToOrder = (request: {
    params: T_workOrderWorksheet_params,
    body: T_addWorksheetToOrder_body,
    headers: { authorization: string }
}) => Promise<{
    message: string
}>

export type T_removeWorksheetFromOrder = (request: {
    params: T_removeWorksheetFromOrder_params,
    headers: { authorization: string }
}) => Promise<{
    message: string
}>

export const T_addWorksheetToOrder_meta = {
    method: 'POST' as const,
    url: '/work-orders/:id/worksheets',
    requireAuth: true
}

export const T_removeWorksheetFromOrder_meta = {
    method: 'DELETE' as const,
    url: '/work-orders/:id/worksheets/:worksheetId',
    requireAuth: true
}
