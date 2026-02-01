import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Maintenance } from '../model/table/Maintenance'

export class T_updateMaintenance_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateMaintenance_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateMaintenance_body {
  @IsOptional()
  @IsString({ message: 'maintenance_type must be a string' })
  maintenance_type?: string
  @IsOptional()
  @IsString({ message: 'maintenance_date must be a string' })
  maintenance_date?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'cost must be a number (decimal)' })
  cost?: number
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string
  @IsOptional()
  @IsString({ message: 'parts_replaced must be a string' })
  parts_replaced?: string
  @IsOptional()
  @IsString({ message: 'next_maintenance_date must be a string' })
  next_maintenance_date?: string
}

export type T_updateMaintenance = (request: {
  headers: T_updateMaintenance_headers
  path: T_updateMaintenance_path
  body: T_updateMaintenance_body
}, response: Response) => Promise<Maintenance>;

export const method = 'put';
export const url_path = '/maintenances/:id';
export const alias = 'T_updateMaintenance';
export const is_streaming = false;
