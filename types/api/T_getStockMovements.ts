import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { StockMovement } from '../model/table/StockMovement'

export class T_getStockMovements_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getStockMovements_query {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'limit must be a number (decimal)' })
  limit?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'offset must be a number (decimal)' })
  offset?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_stock must be a number (decimal)' })
  id_stock?: number
  @IsOptional()
  @IsString({ message: 'movement_type must be a string' })
  movement_type?: string
  @IsOptional()
  @IsString({ message: 'start_date must be a string' })
  start_date?: string
  @IsOptional()
  @IsString({ message: 'end_date must be a string' })
  end_date?: string
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total must be a number (decimal)' })
  total!: number
  @IsNotEmpty({ message: 'data cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockMovement)
  data!: StockMovement[]
}

export type T_getStockMovements = (request: {
  headers: T_getStockMovements_headers
  query: T_getStockMovements_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/stock-movements';
export const alias = 'T_getStockMovements';
export const is_streaming = false;
