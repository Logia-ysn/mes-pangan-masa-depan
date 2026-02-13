import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { InvoiceItem } from '@prisma/client'

export class T_addInvoiceItem_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_addInvoiceItem_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}
export class T_addInvoiceItem_body {
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

export type T_addInvoiceItem = (request: {
    headers: T_addInvoiceItem_headers
    path: T_addInvoiceItem_path
    body: T_addInvoiceItem_body
}, response: Response) => Promise<InvoiceItem>;

export const method = 'post';
export const url_path = '/invoices/:id/items';
export const alias = 'T_addInvoiceItem';
export const is_streaming = false;
