import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProductType } from '../model/table/ProductType'

export class T_createProductType_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createProductType_body {
  @IsNotEmpty({ message: 'code cannot be empty' })
  @IsString({ message: 'code must be a string' })
  code!: string
  @IsNotEmpty({ message: 'name cannot be empty' })
  @IsString({ message: 'name must be a string' })
  name!: string
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string
  @IsOptional()
  @IsString({ message: 'unit must be a string' })
  unit?: string
}

export type T_createProductType = (request: {
  headers: T_createProductType_headers
  body: T_createProductType_body
}, response: Response) => Promise<ProductType>;

export const method = 'post';
export const url_path = '/product-types';
export const alias = 'T_createProductType';
export const is_streaming = false;
