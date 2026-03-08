import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProductionLine } from '../model/table/ProductionLine'

export class T_getProductionLineById_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getProductionLineById_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}

export type T_getProductionLineById = (request: {
    headers: T_getProductionLineById_headers
    path: T_getProductionLineById_path
}, response: Response) => Promise<ProductionLine>;

export const method = 'get';
export const url_path = '/production-lines/:id';
export const alias = 'T_getProductionLineById';
export const is_streaming = false;
