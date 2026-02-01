import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getProductionSummary_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getProductionSummary_query {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
  @IsNotEmpty({ message: 'start_date cannot be empty' })
  @IsString({ message: 'start_date must be a string' })
  start_date!: string
  @IsNotEmpty({ message: 'end_date cannot be empty' })
  @IsString({ message: 'end_date must be a string' })
  end_date!: string
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_gabah_input cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_gabah_input must be a number (decimal)' })
  total_gabah_input!: number
  @IsNotEmpty({ message: 'total_beras_output cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_beras_output must be a number (decimal)' })
  total_beras_output!: number
  @IsNotEmpty({ message: 'total_menir_output cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_menir_output must be a number (decimal)' })
  total_menir_output!: number
  @IsNotEmpty({ message: 'total_dedak_output cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_dedak_output must be a number (decimal)' })
  total_dedak_output!: number
  @IsNotEmpty({ message: 'total_sekam_output cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_sekam_output must be a number (decimal)' })
  total_sekam_output!: number
  @IsNotEmpty({ message: 'average_rendemen cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'average_rendemen must be a number (decimal)' })
  average_rendemen!: number
  @IsNotEmpty({ message: 'total_machine_hours cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_machine_hours must be a number (decimal)' })
  total_machine_hours!: number
  @IsNotEmpty({ message: 'total_downtime_hours cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_downtime_hours must be a number (decimal)' })
  total_downtime_hours!: number
  @IsNotEmpty({ message: 'oee cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'oee must be a number (decimal)' })
  oee!: number
}

export type T_getProductionSummary = (request: {
  headers: T_getProductionSummary_headers
  query: T_getProductionSummary_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/production-summary';
export const alias = 'T_getProductionSummary';
export const is_streaming = false;
