import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Invoice } from '../model/table/Invoice'

export class T_createInvoice_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createInvoice_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'id_customer cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_customer must be a number (decimal)' })
  id_customer!: number
  @IsNotEmpty({ message: 'invoice_number cannot be empty' })
  @IsString({ message: 'invoice_number must be a string' })
  invoice_number!: string
  @IsNotEmpty({ message: 'invoice_date cannot be empty' })
  @IsString({ message: 'invoice_date must be a string' })
  invoice_date!: string
  @IsNotEmpty({ message: 'due_date cannot be empty' })
  @IsString({ message: 'due_date must be a string' })
  due_date!: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'subtotal must be a number (decimal)' })
  subtotal?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'tax must be a number (decimal)' })
  tax?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'discount must be a number (decimal)' })
  discount?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total must be a number (decimal)' })
  total?: number
  @IsOptional()
  @IsString({ message: 'status must be a string' })
  status?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_createInvoice = (request: {
  headers: T_createInvoice_headers
  body: T_createInvoice_body
}, response: Response) => Promise<Invoice>;

export const method = 'post';
export const url_path = '/invoices';
export const alias = 'T_createInvoice';
export const is_streaming = false;
