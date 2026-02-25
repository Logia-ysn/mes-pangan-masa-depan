import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DryingLog } from '../model/table/DryingLog'

export class T_createDryingLog_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createDryingLog_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'batch_code cannot be empty' })
  @IsString({ message: 'batch_code must be a string' })
  batch_code!: string
  @IsNotEmpty({ message: 'drying_date cannot be empty' })
  @IsString({ message: 'drying_date must be a string' })
  drying_date!: string
  @IsNotEmpty({ message: 'method cannot be empty' })
  @IsString({ message: 'method must be a string' })
  method!: string
  @IsNotEmpty({ message: 'initial_weight cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'initial_weight must be a number (decimal)' })
  initial_weight!: number
  @IsNotEmpty({ message: 'final_weight cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'final_weight must be a number (decimal)' })
  final_weight!: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'initial_moisture must be a number (decimal)' })
  initial_moisture?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'final_moisture must be a number (decimal)' })
  final_moisture?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'downtime_hours must be a number (decimal)' })
  downtime_hours?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'shrinkage_kg must be a number (decimal)' })
  shrinkage_kg?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'shrinkage_pct must be a number (decimal)' })
  shrinkage_pct?: number
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_createDryingLog = (request: {
  headers: T_createDryingLog_headers
  body: T_createDryingLog_body
}, response: Response) => Promise<DryingLog>;

export const method = 'post';
export const url_path = '/drying-logs';
export const alias = 'T_createDryingLog';
export const is_streaming = false;
