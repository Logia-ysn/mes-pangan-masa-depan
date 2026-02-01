import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Employee } from '../model/table/Employee'

export class T_createEmployee_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createEmployee_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_user must be a number (decimal)' })
  id_user?: number
  @IsNotEmpty({ message: 'employee_code cannot be empty' })
  @IsString({ message: 'employee_code must be a string' })
  employee_code!: string
  @IsNotEmpty({ message: 'fullname cannot be empty' })
  @IsString({ message: 'fullname must be a string' })
  fullname!: string
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
  @IsNotEmpty({ message: 'gender cannot be empty' })
  @IsString({ message: 'gender must be a string' })
  gender!: string
  @IsOptional()
  @IsString({ message: 'religion must be a string' })
  religion?: string
  @IsOptional()
  @IsString({ message: 'marital_status must be a string' })
  marital_status?: string
  @IsNotEmpty({ message: 'position cannot be empty' })
  @IsString({ message: 'position must be a string' })
  position!: string
  @IsOptional()
  @IsString({ message: 'department must be a string' })
  department?: string
  @IsNotEmpty({ message: 'join_date cannot be empty' })
  @IsString({ message: 'join_date must be a string' })
  join_date!: string
  @IsOptional()
  @IsString({ message: 'employment_status must be a string' })
  employment_status?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'salary must be a number (decimal)' })
  salary?: number
}

export type T_createEmployee = (request: {
  headers: T_createEmployee_headers
  body: T_createEmployee_body
}, response: Response) => Promise<Employee>;

export const method = 'post';
export const url_path = '/employees';
export const alias = 'T_createEmployee';
export const is_streaming = false;
