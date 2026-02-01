import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Employee } from '../model/table/Employee'

export class T_updateEmployee_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateEmployee_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateEmployee_body {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_user must be a number (decimal)' })
  id_user?: number
  @IsOptional()
  @IsString({ message: 'employee_code must be a string' })
  employee_code?: string
  @IsOptional()
  @IsString({ message: 'fullname must be a string' })
  fullname?: string
  @IsOptional()
  @IsString({ message: 'nik must be a string' })
  nik?: string
  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string
  @IsOptional()
  @IsString({ message: 'email must be a string' })
  email?: string
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string
  @IsOptional()
  @IsString({ message: 'birth_date must be a string' })
  birth_date?: string
  @IsOptional()
  @IsString({ message: 'birth_place must be a string' })
  birth_place?: string
  @IsOptional()
  @IsString({ message: 'gender must be a string' })
  gender?: string
  @IsOptional()
  @IsString({ message: 'religion must be a string' })
  religion?: string
  @IsOptional()
  @IsString({ message: 'marital_status must be a string' })
  marital_status?: string
  @IsOptional()
  @IsString({ message: 'position must be a string' })
  position?: string
  @IsOptional()
  @IsString({ message: 'department must be a string' })
  department?: string
  @IsOptional()
  @IsString({ message: 'join_date must be a string' })
  join_date?: string
  @IsOptional()
  @IsString({ message: 'employment_status must be a string' })
  employment_status?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'salary must be a number (decimal)' })
  salary?: number
  @IsOptional()
  @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean
}

export type T_updateEmployee = (request: {
  headers: T_updateEmployee_headers
  path: T_updateEmployee_path
  body: T_updateEmployee_body
}, response: Response) => Promise<Employee>;

export const method = 'put';
export const url_path = '/employees/:id';
export const alias = 'T_updateEmployee';
export const is_streaming = false;
