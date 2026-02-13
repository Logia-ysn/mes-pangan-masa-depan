import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { GoodsReceipt } from '@prisma/client'

export class T_createGoodsReceipt_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_createGoodsReceipt_item {
    @IsNotEmpty({ message: 'id_purchase_order_item cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_purchase_order_item must be a number (decimal)' })
    id_purchase_order_item!: number
    @IsNotEmpty({ message: 'quantity_received cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'quantity_received must be a number (decimal)' })
    quantity_received!: number
}

export class T_createGoodsReceipt_body {
    @IsNotEmpty({ message: 'id_purchase_order cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_purchase_order must be a number (decimal)' })
    id_purchase_order!: number
    @IsNotEmpty({ message: 'receipt_date cannot be empty' })
    @IsString({ message: 'receipt_date must be a string' })
    receipt_date!: string
    @IsOptional()
    @IsString({ message: 'notes must be a string' })
    notes?: string
    @IsNotEmpty({ message: 'items cannot be empty' })
    @IsArray({ message: 'items must be an array' })
    @ValidateNested({ each: true })
    @Type(() => T_createGoodsReceipt_item)
    items!: T_createGoodsReceipt_item[]
}

export type T_createGoodsReceipt = (request: {
    headers: T_createGoodsReceipt_headers
    body: T_createGoodsReceipt_body
}, response: Response) => Promise<GoodsReceipt>;

export const method = 'post';
export const url_path = '/goods-receipts';
export const alias = 'T_createGoodsReceipt';
export const is_streaming = false;
