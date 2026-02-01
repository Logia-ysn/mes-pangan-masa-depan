import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Customer } from '../model/table/Customer'

export class T_updateCustomer_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateCustomer_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateCustomer_body {
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code?: string
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string
  @IsOptional()
  @IsString({ message: 'contact_person must be a string' })
  contact_person?: string
  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string
  @IsOptional()
  @IsString({ message: 'email must be a string' })
  email?: string
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string
  @IsOptional()
  @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean
}

export type T_updateCustomer = (request: {
  headers: T_updateCustomer_headers
  path: T_updateCustomer_path
  body: T_updateCustomer_body
}, response: Response) => Promise<Customer>;

export const method = 'put';
export const url_path = '/customers/:id';
export const alias = 'T_updateCustomer';
export const is_streaming = false;
