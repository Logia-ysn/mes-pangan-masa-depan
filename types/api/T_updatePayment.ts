import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Payment } from '../model/table/Payment'

export class T_updatePayment_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updatePayment_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updatePayment_body {
  @IsOptional()
  @IsString({ message: 'payment_date must be a string' })
  payment_date?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'amount must be a number (decimal)' })
  amount?: number
  @IsOptional()
  @IsString({ message: 'payment_method must be a string' })
  payment_method?: string
  @IsOptional()
  @IsString({ message: 'reference_number must be a string' })
  reference_number?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_updatePayment = (request: {
  headers: T_updatePayment_headers
  path: T_updatePayment_path
  body: T_updatePayment_body
}, response: Response) => Promise<Payment>;

export const method = 'put';
export const url_path = '/payments/:id';
export const alias = 'T_updatePayment';
export const is_streaming = false;
