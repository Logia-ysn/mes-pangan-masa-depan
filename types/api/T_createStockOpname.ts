import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { StockOpname } from '../model/table/StockOpname'

export class T_createStockOpname_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
class T_createStockOpname_body_3 {
  @IsNotEmpty({ message: 'id_stock cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_stock must be a number (decimal)' })
  id_stock!: number
  @IsNotEmpty({ message: 'system_quantity cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'system_quantity must be a number (decimal)' })
  system_quantity!: number
  @IsNotEmpty({ message: 'actual_quantity cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'actual_quantity must be a number (decimal)' })
  actual_quantity!: number
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}
export class T_createStockOpname_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'opname_date cannot be empty' })
  @IsString({ message: 'opname_date must be a string' })
  opname_date!: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
  @IsNotEmpty({ message: 'items cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => T_createStockOpname_body_3)
  items!: T_createStockOpname_body_3[]
}

export type T_createStockOpname = (request: {
  headers: T_createStockOpname_headers
  body: T_createStockOpname_body
}, response: Response) => Promise<StockOpname>;

export const method = 'post';
export const url_path = '/stock-opnames';
export const alias = 'T_createStockOpname';
export const is_streaming = false;
