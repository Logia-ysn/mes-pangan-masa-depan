import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Factory } from '@prisma/client'

export class T_createFactory_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createFactory_body {
  @IsNotEmpty({ message: 'code cannot be empty' })
  @IsString({ message: 'code must be a string' })
  code!: string
  @IsNotEmpty({ message: 'name cannot be empty' })
  @IsString({ message: 'name must be a string' })
  name!: string
  @IsOptional()
  @IsString({ message: 'address must be a string' })
  address?: string
  @IsOptional()
  @IsString({ message: 'phone must be a string' })
  phone?: string
}

export type T_createFactory = (request: {
  headers: T_createFactory_headers
  body: T_createFactory_body
}, response: Response) => Promise<Factory>;

export const method = 'post';
export const url_path = '/factories';
export const alias = 'T_createFactory';
export const is_streaming = false;
