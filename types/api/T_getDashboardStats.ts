import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getDashboardStats_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getDashboardStats_query {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
  @IsOptional()
  @IsString({ message: 'start_date must be a string' })
  start_date?: string
  @IsOptional()
  @IsString({ message: 'end_date must be a string' })
  end_date?: string
}
class ReturnType_0_6 {
  @IsNotEmpty({ message: 'date cannot be empty' })
  @IsString({ message: 'date must be a string' })
  date!: string
  @IsNotEmpty({ message: 'gabah_input cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'gabah_input must be a number (decimal)' })
  gabah_input!: number
  @IsNotEmpty({ message: 'beras_output cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'beras_output must be a number (decimal)' })
  beras_output!: number
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
  @IsNotEmpty({ message: 'average_rendemen cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'average_rendemen must be a number (decimal)' })
  average_rendemen!: number
  @IsNotEmpty({ message: 'total_revenue cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_revenue must be a number (decimal)' })
  total_revenue!: number
  @IsNotEmpty({ message: 'total_expenses cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_expenses must be a number (decimal)' })
  total_expenses!: number
  @IsNotEmpty({ message: 'total_employees cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_employees must be a number (decimal)' })
  total_employees!: number
  @IsNotEmpty({ message: 'production_trend cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnType_0_6)
  production_trend!: ReturnType_0_6[]
}

export type T_getDashboardStats = (request: {
  headers: T_getDashboardStats_headers
  query: T_getDashboardStats_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/dashboard/stats';
export const alias = 'T_getDashboardStats';
export const is_streaming = false;
