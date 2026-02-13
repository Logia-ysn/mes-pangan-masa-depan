import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getSalesSummary_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getSalesSummary_query {
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
class ReturnType_0_4 {
  @IsNotEmpty({ message: 'customer_name cannot be empty' })
  @IsString({ message: 'customer_name must be a string' })
  customer_name!: string
  @IsNotEmpty({ message: 'total cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total must be a number (decimal)' })
  total!: number
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_invoices cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_invoices must be a number (decimal)' })
  total_invoices!: number
  @IsNotEmpty({ message: 'total_revenue cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_revenue must be a number (decimal)' })
  total_revenue!: number
  @IsNotEmpty({ message: 'total_paid cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_paid must be a number (decimal)' })
  total_paid!: number
  @IsNotEmpty({ message: 'total_outstanding cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_outstanding must be a number (decimal)' })
  total_outstanding!: number
  @IsNotEmpty({ message: 'by_customer cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  by_customer!: ReturnType_0_4[]
}

export type T_getSalesSummary = (request: {
  headers: T_getSalesSummary_headers
  query: T_getSalesSummary_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/sales-summary';
export const alias = 'T_getSalesSummary';
export const is_streaming = false;
