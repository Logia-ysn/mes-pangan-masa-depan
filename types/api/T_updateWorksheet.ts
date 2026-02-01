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
export class T_updateWorksheet_side_product {
  @IsNotEmpty({ message: 'product_code cannot be empty' })
  @IsString({ message: 'product_code must be a string' })
  product_code!: string
  @IsNotEmpty({ message: 'product_name cannot be empty' })
  @IsString({ message: 'product_name must be a string' })
  product_name!: string
  @IsNotEmpty({ message: 'quantity cannot be empty' })
  @IsNumber({}, { message: 'quantity must be a number' })
  quantity!: number
  @IsNotEmpty({ message: 'unit_price cannot be empty' })
  @IsNumber({}, { message: 'unit_price must be a number' })
  unit_price!: number
  @IsOptional()
  @IsNumber({}, { message: 'total_value must be a number' })
  total_value?: number
  @IsOptional()
  @IsBoolean({ message: 'is_auto_calculated must be a boolean' })
  is_auto_calculated?: boolean
  @IsOptional()
  @IsNumber({}, { message: 'auto_percentage must be a number' })
  auto_percentage?: number
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
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_machine must be a number' })
  id_machine?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_output_product must be a number' })
  id_output_product?: number
  @IsOptional()
  @IsString({ message: 'batch_code must be a string' })
  batch_code?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'production_cost must be a number' })
  production_cost?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'raw_material_cost must be a number' })
  raw_material_cost?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'side_product_revenue must be a number' })
  side_product_revenue?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'hpp must be a number' })
  hpp?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'hpp_per_kg must be a number' })
  hpp_per_kg?: number
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => T_updateWorksheet_side_product)
  @IsArray()
  side_products?: T_updateWorksheet_side_product[]
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
