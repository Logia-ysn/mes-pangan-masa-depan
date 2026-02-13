import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Factory } from '@prisma/client'

export class T_updateFactory_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateFactory_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateFactory_body {
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code?: string
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string
  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string
  @IsOptional()
  @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean
}

export type T_updateFactory = (request: {
  headers: T_updateFactory_headers
  path: T_updateFactory_path
  body: T_updateFactory_body
}, response: Response) => Promise<Factory>;

export const method = 'put';
export const url_path = '/factories/:id';
export const alias = 'T_updateFactory';
export const is_streaming = false;
