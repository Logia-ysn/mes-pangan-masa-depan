import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getStockReport_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getStockReport_query {
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
class MovementByType {
  @IsNotEmpty()
  @IsString()
  movement_type!: string
  @IsNotEmpty()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber()
  total_quantity!: number
  @IsNotEmpty()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber()
  count!: number
}
class MovementByProduct {
  @IsNotEmpty()
  @IsString()
  product_name!: string
  @IsNotEmpty()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber()
  total_in!: number
  @IsNotEmpty()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber()
  total_out!: number
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_in cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_in must be a number (decimal)' })
  total_in!: number
  @IsNotEmpty({ message: 'total_out cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_out must be a number (decimal)' })
  total_out!: number
  @IsNotEmpty({ message: 'movements_by_type cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  movements_by_type!: MovementByType[]
  @IsNotEmpty({ message: 'movements_by_product cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  movements_by_product!: MovementByProduct[]
}

export type T_getStockReport = (request: {
  headers: T_getStockReport_headers
  query: T_getStockReport_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/stock-report';
export const alias = 'T_getStockReport';
export const is_streaming = false;
