import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { QCResult } from '../model/table/QCResult'

export class T_createQCResult_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createQCResult_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'qc_date cannot be empty' })
  @IsString({ message: 'qc_date must be a string' })
  qc_date!: string
  @IsOptional()
  @IsString({ message: 'batch_code must be a string' })
  batch_code?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_worksheet must be a number (decimal)' })
  id_worksheet?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'moisture_content must be a number (decimal)' })
  moisture_content?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'broken_percentage must be a number (decimal)' })
  broken_percentage?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'whiteness_degree must be a number (decimal)' })
  whiteness_degree?: number
  @IsOptional()
  @IsString({ message: 'grade must be a string' })
  grade?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_createQCResult = (request: {
  headers: T_createQCResult_headers
  body: T_createQCResult_body
}, response: Response) => Promise<QCResult>;

export const method = 'post';
export const url_path = '/qc-results';
export const alias = 'T_createQCResult';
export const is_streaming = false;
