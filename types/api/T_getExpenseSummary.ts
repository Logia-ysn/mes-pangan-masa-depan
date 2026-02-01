import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getExpenseSummary_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getExpenseSummary_query {
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
class ReturnType_0_1 {
  @IsNotEmpty({ message: 'category_name cannot be empty' })
  @IsString({ message: 'category_name must be a string' })
  category_name!: string
  @IsNotEmpty({ message: 'total cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total must be a number (decimal)' })
  total!: number
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_expense cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_expense must be a number (decimal)' })
  total_expense!: number
  @IsNotEmpty({ message: 'by_category cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReturnType_0_1)
  by_category!: ReturnType_0_1[]
}

export type T_getExpenseSummary = (request: {
  headers: T_getExpenseSummary_headers
  query: T_getExpenseSummary_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/expense-summary';
export const alias = 'T_getExpenseSummary';
export const is_streaming = false;
