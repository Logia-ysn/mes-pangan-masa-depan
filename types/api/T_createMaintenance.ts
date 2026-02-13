import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Maintenance } from '@prisma/client'

export class T_createMaintenance_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createMaintenance_body {
  @IsNotEmpty({ message: 'id_machine cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_machine must be a number (decimal)' })
  id_machine!: number
  @IsNotEmpty({ message: 'maintenance_type cannot be empty' })
  @IsString({ message: 'maintenance_type must be a string' })
  maintenance_type!: string
  @IsNotEmpty({ message: 'maintenance_date cannot be empty' })
  @IsString({ message: 'maintenance_date must be a string' })
  maintenance_date!: string
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

export type T_createMaintenance = (request: {
  headers: T_createMaintenance_headers
  body: T_createMaintenance_body
}, response: Response) => Promise<Maintenance>;

export const method = 'post';
export const url_path = '/maintenances';
export const alias = 'T_createMaintenance';
export const is_streaming = false;
