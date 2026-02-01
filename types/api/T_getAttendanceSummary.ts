import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_getAttendanceSummary_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getAttendanceSummary_query {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_employee must be a number (decimal)' })
  id_employee?: number
  @IsNotEmpty({ message: 'start_date cannot be empty' })
  @IsString({ message: 'start_date must be a string' })
  start_date!: string
  @IsNotEmpty({ message: 'end_date cannot be empty' })
  @IsString({ message: 'end_date must be a string' })
  end_date!: string
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total_present cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_present must be a number (decimal)' })
  total_present!: number
  @IsNotEmpty({ message: 'total_absent cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_absent must be a number (decimal)' })
  total_absent!: number
  @IsNotEmpty({ message: 'total_sick cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_sick must be a number (decimal)' })
  total_sick!: number
  @IsNotEmpty({ message: 'total_leave cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_leave must be a number (decimal)' })
  total_leave!: number
  @IsNotEmpty({ message: 'total_permission cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total_permission must be a number (decimal)' })
  total_permission!: number
  @IsNotEmpty({ message: 'attendance_rate cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'attendance_rate must be a number (decimal)' })
  attendance_rate!: number
}

export type T_getAttendanceSummary = (request: {
  headers: T_getAttendanceSummary_headers
  query: T_getAttendanceSummary_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/reports/attendance-summary';
export const alias = 'T_getAttendanceSummary';
export const is_streaming = false;
