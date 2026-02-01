import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Supplier } from '../model/table/Supplier'

export class T_getSuppliers_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getSuppliers_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'limit must be a number (decimal)' })
    limit?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'offset must be a number (decimal)' })
    offset?: number
    @IsOptional()
    @IsString({ message: 'search must be a string' })
    search?: string
    @IsOptional()
    @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean
}
class ReturnType_0 {
    @IsNotEmpty({ message: 'total cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'total must be a number (decimal)' })
    total!: number
    @IsNotEmpty({ message: 'data cannot be empty' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Supplier)
    data!: Supplier[]
}

export type T_getSuppliers = (request: {
    headers: T_getSuppliers_headers
    query: T_getSuppliers_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/suppliers';
export const alias = 'T_getSuppliers';
export const is_streaming = false;
