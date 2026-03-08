import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProductionLine } from '../model/table/ProductionLine'

export class T_createProductionLine_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_createProductionLine_body {
    @IsNotEmpty({ message: 'id_factory cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
    id_factory!: number
    @IsNotEmpty({ message: 'code cannot be empty' })
    @IsString({ message: 'code must be a string' })
    code!: string
    @IsNotEmpty({ message: 'name cannot be empty' })
    @IsString({ message: 'name must be a string' })
    name!: string
    @IsOptional()
    @IsString({ message: 'description must be a string' })
    description?: string
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'capacity_per_hour must be a number (decimal)' })
    capacity_per_hour?: number
}

export type T_createProductionLine = (request: {
    headers: T_createProductionLine_headers
    body: T_createProductionLine_body
}, response: Response) => Promise<ProductionLine>;

export const method = 'post';
export const url_path = '/production-lines';
export const alias = 'T_createProductionLine';
export const is_streaming = false;
