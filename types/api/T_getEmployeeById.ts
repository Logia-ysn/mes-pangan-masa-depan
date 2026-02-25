import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Employee } from '../model/table/Employee'

export class T_getEmployeeById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getEmployeeById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getEmployeeById = (request: {
  headers: T_getEmployeeById_headers
  path: T_getEmployeeById_path
}, response: Response) => Promise<Employee>;

export const method = 'get';
export const url_path = '/employees/:id';
export const alias = 'T_getEmployeeById';
export const is_streaming = false;
