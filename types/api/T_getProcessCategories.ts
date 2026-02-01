import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsString, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProcessCategory } from '../model/table/ProcessCategory'

export class T_getProcessCategories_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_getProcessCategories_query {
    @IsOptional()
    @Transform((param?: any): boolean | null => param?.value === 'true' ? true : param?.value === 'false' ? false : null)
    @IsBoolean({ message: 'is_main_process must be a boolean' })
    is_main_process?: boolean

    @IsOptional()
    @Transform((param?: any): boolean | null => param?.value === 'true' ? true : param?.value === 'false' ? false : null)
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean
}

export type T_getProcessCategories = (request: {
    headers: T_getProcessCategories_headers
    query: T_getProcessCategories_query
}, response: Response) => Promise<{ data: ProcessCategory[], total: number }>;

export const method = 'get';
export const url_path = '/process-categories';
export const alias = 'T_getProcessCategories';
export const is_streaming = false;
