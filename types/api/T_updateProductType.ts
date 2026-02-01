import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProductType } from '../model/table/ProductType'

export class T_updateProductType_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateProductType_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateProductType_body {
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code?: string
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string
  @IsOptional()
  @IsString({ message: 'unit must be a string' })
  unit?: string
}

export type T_updateProductType = (request: {
  headers: T_updateProductType_headers
  path: T_updateProductType_path
  body: T_updateProductType_body
}, response: Response) => Promise<ProductType>;

export const method = 'put';
export const url_path = '/product-types/:id';
export const alias = 'T_updateProductType';
export const is_streaming = false;
