import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProductType } from '../model/table/ProductType'

export class T_getProductTypeById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getProductTypeById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getProductTypeById = (request: {
  headers: T_getProductTypeById_headers
  path: T_getProductTypeById_path
}, response: Response) => Promise<ProductType>;

export const method = 'get';
export const url_path = '/product-types/:id';
export const alias = 'T_getProductTypeById';
export const is_streaming = false;
