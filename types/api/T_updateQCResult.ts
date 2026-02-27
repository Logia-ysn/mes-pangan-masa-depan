import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { QCResult } from '../model/table/QCResult'

export class T_updateQCResult_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_updateQCResult_body {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number' })
    id!: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number' })
    id_factory?: number

    @IsOptional()
    @IsString({ message: 'qc_date must be a string' })
    qc_date?: string

    @IsOptional()
    @IsString({ message: 'batch_code must be a string' })
    batch_code?: string

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_worksheet must be a number' })
    id_worksheet?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'moisture_content must be a number (decimal)' })
    moisture_content?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'broken_percentage must be a number (decimal)' })
    broken_percentage?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'whiteness_degree must be a number (decimal)' })
    whiteness_degree?: number

    @IsOptional()
    @IsString({ message: 'grade must be a string' })
    grade?: string

    @IsOptional()
    @IsString({ message: 'notes must be a string' })
    notes?: string
}

export type T_updateQCResult = (request: {
    headers: T_updateQCResult_headers
    body: T_updateQCResult_body
}, response: Response) => Promise<QCResult>;

export const method = 'put';
export const url_path = '/qc-results';
export const alias = 'T_updateQCResult';
export const is_streaming = false;
