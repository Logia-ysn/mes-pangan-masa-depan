import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProductionLine } from '../model/table/ProductionLine'

export class T_updateProductionLine_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_updateProductionLine_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}
export class T_updateProductionLine_body {
    @IsOptional()
    @IsString({ message: 'code must be a string' })
    code?: string
    @IsOptional()
    @IsString({ message: 'name must be a string' })
    name?: string
    @IsOptional()
    @IsString({ message: 'description must be a string' })
    description?: string
    @IsOptional()
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'capacity_per_hour must be a number (decimal)' })
    capacity_per_hour?: number
}

export type T_updateProductionLine = (request: {
    headers: T_updateProductionLine_headers
    path: T_updateProductionLine_path
    body: T_updateProductionLine_body
}, response: Response) => Promise<ProductionLine>;

export const method = 'put';
export const url_path = '/production-lines/:id';
export const alias = 'T_updateProductionLine';
export const is_streaming = false;
