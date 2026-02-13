import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Stock } from '@prisma/client'

export class T_createStock_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createStock_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'id_product_type cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_product_type must be a number (decimal)' })
  id_product_type!: number
  @IsNotEmpty({ message: 'quantity cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'quantity must be a number (decimal)' })
  quantity!: number
  @IsOptional()
  @IsString({ message: 'unit must be a string' })
  unit?: string
}

export type T_createStock = (request: {
  headers: T_createStock_headers
  body: T_createStock_body
}, response: Response) => Promise<Stock>;

export const method = 'post';
export const url_path = '/stocks';
export const alias = 'T_createStock';
export const is_streaming = false;
