import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { AuthResponse } from '../schema/AuthResponse'

export class T_login_body {
  @IsNotEmpty({ message: 'email cannot be empty' })
  @IsString({ message: 'email must be a string' })
  email!: string
  @IsNotEmpty({ message: 'password cannot be empty' })
  @IsString({ message: 'password must be a string' })
  password!: string
}

export type T_login = (request: {
  body: T_login_body
}, response: Response) => Promise<AuthResponse>;

export const method = 'post';
export const url_path = '/auth/login';
export const alias = 'T_login';
export const is_streaming = false;
