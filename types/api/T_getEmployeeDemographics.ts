import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getEmployeeDemographics_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getEmployeeDemographics_query {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
}
class ReturnType_0_1 {
  @IsNotEmpty({ message: 'gender cannot be empty' })
  @IsString({ message: 'gender must be a string' })
  gender!: string
  @IsNotEmpty({ message: 'count cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'count must be a number (decimal)' })
  count!: number
}
class ReturnType_0_2 {
  @IsNotEmpty({ message: 'department cannot be empty' })
  @IsString({ message: 'department must be a string' })
  department!: string
  @IsNotEmpty({ message: 'count cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'count must be a number (decimal)' })
  count!: number
}
class ReturnType_0_3 {
  @IsNotEmpty({ message: 'status cannot be empty' })
  @IsString({ message: 'status must be a string' })
  status!: string
  @IsNotEmpty({ message: 'count cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'count must be a number (decimal)' })
  count!: number
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_employees cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_employees must be a number (decimal)' })
  total_employees!: number
  @IsNotEmpty({ message: 'by_gender cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  by_gender!: ReturnType_0_1[]
  @IsNotEmpty({ message: 'by_department cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  by_department!: ReturnType_0_2[]
  @IsNotEmpty({ message: 'by_employment_status cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Object)
  by_employment_status!: ReturnType_0_3[]
}

export type T_getEmployeeDemographics = (request: {
  headers: T_getEmployeeDemographics_headers
  query: T_getEmployeeDemographics_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/employee-demographics';
export const alias = 'T_getEmployeeDemographics';
export const is_streaming = false;
