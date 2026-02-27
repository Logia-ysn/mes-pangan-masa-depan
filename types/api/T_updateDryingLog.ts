import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { DryingLog } from '../model/table/DryingLog'

export class T_updateDryingLog_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_updateDryingLog_body {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number' })
    id!: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number' })
    id_factory?: number

    @IsOptional()
    @IsString({ message: 'batch_code must be a string' })
    batch_code?: string

    @IsOptional()
    @IsString({ message: 'drying_date must be a string' })
    drying_date?: string

    @IsOptional()
    @IsString({ message: 'method must be a string' })
    method?: string

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'initial_weight must be a number (decimal)' })
    initial_weight?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'final_weight must be a number (decimal)' })
    final_weight?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'initial_moisture must be a number (decimal)' })
    initial_moisture?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'final_moisture must be a number (decimal)' })
    final_moisture?: number

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'downtime_hours must be a number (decimal)' })
    downtime_hours?: number

    @IsOptional()
    @IsString({ message: 'notes must be a string' })
    notes?: string
}

export type T_updateDryingLog = (request: {
    headers: T_updateDryingLog_headers
    body: T_updateDryingLog_body
}, response: Response) => Promise<DryingLog>;

export const method = 'put';
export const url_path = '/drying-logs';
export const alias = 'T_updateDryingLog';
export const is_streaming = false;
