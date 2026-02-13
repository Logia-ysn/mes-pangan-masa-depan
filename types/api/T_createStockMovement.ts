import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { StockMovement } from '@prisma/client'

export class T_createStockMovement_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createStockMovement_body {
  @IsNotEmpty({ message: 'id_stock cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_stock must be a number (decimal)' })
  id_stock!: number
  @IsNotEmpty({ message: 'movement_type cannot be empty' })
  @IsString({ message: 'movement_type must be a string' })
  movement_type!: string
  @IsNotEmpty({ message: 'quantity cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'quantity must be a number (decimal)' })
  quantity!: number
  @IsOptional()
  @IsString({ message: 'reference_type must be a string' })
  reference_type?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'reference_id must be a number (decimal)' })
  reference_id?: number
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_createStockMovement = (request: {
  headers: T_createStockMovement_headers
  body: T_createStockMovement_body
}, response: Response) => Promise<StockMovement>;

export const method = 'post';
export const url_path = '/stock-movements';
export const alias = 'T_createStockMovement';
export const is_streaming = false;
