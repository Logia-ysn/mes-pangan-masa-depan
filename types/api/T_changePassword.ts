import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse'

export class T_changePassword_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_changePassword_body {
  @IsNotEmpty({ message: 'old_password cannot be empty' })
  @IsString({ message: 'old_password must be a string' })
  old_password!: string
  @IsNotEmpty({ message: 'new_password cannot be empty' })
  @IsString({ message: 'new_password must be a string' })
  new_password!: string
}

export type T_changePassword = (request: {
  headers: T_changePassword_headers
  body: T_changePassword_body
}, response: Response) => Promise<MessageResponse>;

export const method = 'put';
export const url_path = '/auth/change-password';
export const alias = 'T_changePassword';
export const is_streaming = false;
