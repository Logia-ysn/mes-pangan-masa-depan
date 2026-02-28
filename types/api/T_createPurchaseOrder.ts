import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { PurchaseOrder } from '@prisma/client'

export class T_createPurchaseOrder_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_createPurchaseOrder_item {
    @IsNotEmpty({ message: 'id_product_type cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_product_type must be a number (decimal)' })
    id_product_type!: number
    @IsNotEmpty({ message: 'quantity cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'quantity must be a number (decimal)' })
    quantity!: number
    @IsNotEmpty({ message: 'unit_price cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'unit_price must be a number (decimal)' })
    unit_price!: number
}

export class T_createPurchaseOrder_body {
    @IsNotEmpty({ message: 'id_factory cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
    id_factory!: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_supplier must be a number (decimal)' })
    id_supplier?: number
    @IsNotEmpty({ message: 'order_date cannot be empty' })
    @IsString({ message: 'order_date must be a string' })
    order_date!: string
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
    @IsNotEmpty({ message: 'items cannot be empty' })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => T_createPurchaseOrder_item)
    items!: T_createPurchaseOrder_item[]
}

export type T_createPurchaseOrder = (request: {
    headers: T_createPurchaseOrder_headers
    body: T_createPurchaseOrder_body
}, response: Response) => Promise<PurchaseOrder>;

export const method = 'post';
export const url_path = '/purchase-orders';
export const alias = 'T_createPurchaseOrder';
export const is_streaming = false;
