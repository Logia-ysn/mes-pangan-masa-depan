import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Stock } from '../model/table/Stock'

export class T_updateStock_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateStock_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateStock_body {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'quantity must be a number (decimal)' })
  quantity?: number
  @IsOptional()
  @IsString({ message: 'unit must be a string' })
  unit?: string
}

export type T_updateStock = (request: {
  headers: T_updateStock_headers
  path: T_updateStock_path
  body: T_updateStock_body
}, response: Response) => Promise<Stock>;

export const method = 'put';
export const url_path = '/stocks/:id';
export const alias = 'T_updateStock';
export const is_streaming = false;
