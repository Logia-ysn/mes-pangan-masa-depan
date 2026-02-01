import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Payment } from '../model/table/Payment'

export class T_createPayment_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createPayment_body {
  @IsNotEmpty({ message: 'id_invoice cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_invoice must be a number (decimal)' })
  id_invoice!: number
  @IsNotEmpty({ message: 'payment_date cannot be empty' })
  @IsString({ message: 'payment_date must be a string' })
  payment_date!: string
  @IsNotEmpty({ message: 'amount cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'amount must be a number (decimal)' })
  amount!: number
  @IsNotEmpty({ message: 'payment_method cannot be empty' })
  @IsString({ message: 'payment_method must be a string' })
  payment_method!: string
  @IsOptional()
  @IsString({ message: 'reference_number must be a string' })
  reference_number?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_createPayment = (request: {
  headers: T_createPayment_headers
  body: T_createPayment_body
}, response: Response) => Promise<Payment>;

export const method = 'post';
export const url_path = '/payments';
export const alias = 'T_createPayment';
export const is_streaming = false;
