import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getCOGMReport_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getCOGMReport_query {
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
class ReturnType_0_3 {
  @IsNotEmpty({ message: 'category cannot be empty' })
  @IsString({ message: 'category must be a string' })
  category!: string
  @IsNotEmpty({ message: 'amount cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'amount must be a number (decimal)' })
  amount!: number
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_production_cost cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_production_cost must be a number (decimal)' })
  total_production_cost!: number
  @IsNotEmpty({ message: 'total_beras_output cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_beras_output must be a number (decimal)' })
  total_beras_output!: number
  @IsNotEmpty({ message: 'cost_per_kg cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'cost_per_kg must be a number (decimal)' })
  cost_per_kg!: number
  @IsNotEmpty({ message: 'breakdown cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnType_0_3)
  breakdown!: ReturnType_0_3[]
}

export type T_getCOGMReport = (request: {
  headers: T_getCOGMReport_headers
  query: T_getCOGMReport_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/cogm';
export const alias = 'T_getCOGMReport';
export const is_streaming = false;
