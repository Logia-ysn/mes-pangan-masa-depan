import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Invoice } from '@prisma/client'

export class T_updateInvoice_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_updateInvoice_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}
export class T_updateInvoice_body {
    @IsOptional()
    @IsString({ message: 'invoice_date must be a string' })
    invoice_date?: string
    @IsOptional()
    @IsString({ message: 'due_date must be a string' })
    due_date?: string
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
    @IsOptional()
    @IsString({ message: 'status must be a string' })
    status?: string
}

export type T_updateInvoice = (request: {
    headers: T_updateInvoice_headers
    path: T_updateInvoice_path
    body: T_updateInvoice_body
}, response: Response) => Promise<Invoice>;

export const method = 'put';
export const url_path = '/invoices/:id';
export const alias = 'T_updateInvoice';
export const is_streaming = false;
