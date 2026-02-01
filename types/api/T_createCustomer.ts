import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Customer } from '../model/table/Customer'

export class T_createCustomer_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createCustomer_body {
  @IsNotEmpty({ message: 'code cannot be empty' })
  @IsString({ message: 'code must be a string' })
  code!: string
  @IsNotEmpty({ message: 'name cannot be empty' })
  @IsString({ message: 'name must be a string' })
  name!: string
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
}

export type T_createCustomer = (request: {
  headers: T_createCustomer_headers
  body: T_createCustomer_body
}, response: Response) => Promise<Customer>;

export const method = 'post';
export const url_path = '/customers';
export const alias = 'T_createCustomer';
export const is_streaming = false;
