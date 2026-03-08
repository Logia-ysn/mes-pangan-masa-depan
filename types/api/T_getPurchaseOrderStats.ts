import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getPurchaseOrderStats_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getPurchaseOrderStats_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
    id_factory?: number
}
class ReturnType_0 {
    @IsNotEmpty({ message: 'total_amount cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'total_amount must be a number (decimal)' })
    total_amount!: number
    @IsNotEmpty({ message: 'pending_count cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'pending_count must be a number (decimal)' })
    pending_count!: number
    @IsNotEmpty({ message: 'received_count cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'received_count must be a number (decimal)' })
    received_count!: number
}

export type T_getPurchaseOrderStats = (request: {
    headers: T_getPurchaseOrderStats_headers
    query: T_getPurchaseOrderStats_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/purchase-orders/stats';
export const alias = 'T_getPurchaseOrderStats';
export const is_streaming = false;
