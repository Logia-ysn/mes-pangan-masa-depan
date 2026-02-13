import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Invoice } from '@prisma/client'

export class T_getInvoice_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getInvoice_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}

export type T_getInvoice = (request: {
    headers: T_getInvoice_headers
    path: T_getInvoice_path
}, response: Response) => Promise<Invoice>;

export const method = 'get';
export const url_path = '/invoices/:id';
export const alias = 'T_getInvoice';
export const is_streaming = false;
