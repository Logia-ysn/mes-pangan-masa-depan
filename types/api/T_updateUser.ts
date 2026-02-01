import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { User } from '../model/table/User'

export class T_updateUser_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateUser_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateUser_body {
  @IsOptional()
  @IsString({ message: 'email must be a string' })
  email?: string
  @IsOptional()
  @IsString({ message: 'fullname must be a string' })
  fullname?: string
  @IsOptional()
  @IsString({ message: 'role must be a string' })
  role?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
  @IsOptional()
  @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
  @IsBoolean({ message: 'is_active must be a boolean' })
  is_active?: boolean
}

export type T_updateUser = (request: {
  headers: T_updateUser_headers
  path: T_updateUser_path
  body: T_updateUser_body
}, response: Response) => Promise<User>;

export const method = 'put';
export const url_path = '/users/:id';
export const alias = 'T_updateUser';
export const is_streaming = false;
