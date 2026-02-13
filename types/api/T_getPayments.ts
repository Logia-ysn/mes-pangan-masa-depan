import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Payment } from '@prisma/client'

export class T_getPayments_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getPayments_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'limit must be a number (decimal)' })
    limit?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'offset must be a number (decimal)' })
    offset?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_invoice must be a number (decimal)' })
    id_invoice?: number
    @IsOptional()
    @IsString({ message: 'payment_method must be a string' })
    payment_method?: string
    @IsOptional()
    @IsString({ message: 'start_date must be a string' })
    start_date?: string
    @IsOptional()
    @IsString({ message: 'end_date must be a string' })
    end_date?: string
}
class ReturnType_0 {
    @IsNotEmpty({ message: 'total cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'total must be a number (decimal)' })
    total!: number
    @IsNotEmpty({ message: 'data cannot be empty' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Object)
    data!: Payment[]
}

export type T_getPayments = (request: {
    headers: T_getPayments_headers
    query: T_getPayments_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/payments';
export const alias = 'T_getPayments';
export const is_streaming = false;
