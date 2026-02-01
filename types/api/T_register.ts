import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { AuthResponse } from '../schema/AuthResponse'

export class T_register_body {
  @IsNotEmpty({ message: 'email cannot be empty' })
  @IsString({ message: 'email must be a string' })
  email!: string
  @IsNotEmpty({ message: 'password cannot be empty' })
  @IsString({ message: 'password must be a string' })
  password!: string
  @IsNotEmpty({ message: 'fullname cannot be empty' })
  @IsString({ message: 'fullname must be a string' })
  fullname!: string
  @IsOptional()
  @IsString({ message: 'role must be a string' })
  role?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
}

export type T_register = (request: {
  body: T_register_body
}, response: Response) => Promise<AuthResponse>;

export const method = 'post';
export const url_path = '/auth/register';
export const alias = 'T_register';
export const is_streaming = false;
