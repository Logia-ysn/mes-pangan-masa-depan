import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { StockOpname } from '../model/table/StockOpname'

export class T_getStockOpnameById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getStockOpnameById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getStockOpnameById = (request: {
  headers: T_getStockOpnameById_headers
  path: T_getStockOpnameById_path
}, response: Response) => Promise<StockOpname>;

export const method = 'get';
export const url_path = '/stock-opnames/:id';
export const alias = 'T_getStockOpnameById';
export const is_streaming = false;
