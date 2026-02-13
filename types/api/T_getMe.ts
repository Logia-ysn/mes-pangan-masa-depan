import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { User } from '@prisma/client'

export class T_getMe_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}

export type T_getMe = (request: {
  headers: T_getMe_headers
}, response: Response) => Promise<User>;

export const method = 'get';
export const url_path = '/auth/me';
export const alias = 'T_getMe';
export const is_streaming = false;
