import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { PurchaseOrder } from '@prisma/client'

export class T_updatePurchaseOrder_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_updatePurchaseOrder_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}
export class T_updatePurchaseOrder_body {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_supplier must be a number (decimal)' })
    id_supplier?: number
    @IsOptional()
    @IsString({ message: 'order_date must be a string' })
    order_date?: string
    @IsOptional()
    @IsString({ message: 'expected_date must be a string' })
    expected_date?: string
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'tax must be a number (decimal)' })
    tax?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'discount must be a number (decimal)' })
    discount?: number
    @IsOptional()
    @IsString({ message: 'notes must be a string' })
    notes?: string
}

export type T_updatePurchaseOrder = (request: {
    headers: T_updatePurchaseOrder_headers
    path: T_updatePurchaseOrder_path
    body: T_updatePurchaseOrder_body
}, response: Response) => Promise<PurchaseOrder>;

export const method = 'put';
export const url_path = '/purchase-orders/:id';
export const alias = 'T_updatePurchaseOrder';
export const is_streaming = false;
