import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Machine } from '../model/table/Machine'

export class T_updateMachine_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateMachine_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateMachine_body {
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code?: string
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string
  @IsOptional()
  @IsString({ message: 'machine_type must be a string' })
  machine_type?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'capacity_per_hour must be a number (decimal)' })
  capacity_per_hour?: number
  @IsOptional()
  @IsString({ message: 'status must be a string' })
  status?: string
  @IsOptional()
  @IsString({ message: 'last_maintenance_date must be a string' })
  last_maintenance_date?: string
  @IsOptional()
  @IsString({ message: 'next_maintenance_date must be a string' })
  next_maintenance_date?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_production_line must be a number (decimal)' })
  id_production_line?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'sequence_order must be a number (decimal)' })
  sequence_order?: number
}

export type T_updateMachine = (request: {
  headers: T_updateMachine_headers
  path: T_updateMachine_path
  body: T_updateMachine_body
}, response: Response) => Promise<Machine>;

export const method = 'put';
export const url_path = '/machines/:id';
export const alias = 'T_updateMachine';
export const is_streaming = false;
