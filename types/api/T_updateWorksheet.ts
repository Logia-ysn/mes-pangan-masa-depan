import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Worksheet } from '../model/table/Worksheet'

export class T_updateWorksheet_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateWorksheet_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateWorksheet_body {
  @IsOptional()
  @IsString({ message: 'worksheet_date must be a string' })
  worksheet_date?: string
  @IsOptional()
  @IsString({ message: 'shift must be a string' })
  shift?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'gabah_input must be a number (decimal)' })
  gabah_input?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'beras_output must be a number (decimal)' })
  beras_output?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'menir_output must be a number (decimal)' })
  menir_output?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'dedak_output must be a number (decimal)' })
  dedak_output?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'sekam_output must be a number (decimal)' })
  sekam_output?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'machine_hours must be a number (decimal)' })
  machine_hours?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'downtime_hours must be a number (decimal)' })
  downtime_hours?: number
  @IsOptional()
  @IsString({ message: 'downtime_reason must be a string' })
  downtime_reason?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_updateWorksheet = (request: {
  headers: T_updateWorksheet_headers
  path: T_updateWorksheet_path
  body: T_updateWorksheet_body
}, response: Response) => Promise<Worksheet>;

export const method = 'put';
export const url_path = '/worksheets/:id';
export const alias = 'T_updateWorksheet';
export const is_streaming = false;
