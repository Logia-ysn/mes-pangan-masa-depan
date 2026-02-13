import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Factory } from '@prisma/client'

export class T_getFactoryById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getFactoryById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getFactoryById = (request: {
  headers: T_getFactoryById_headers
  path: T_getFactoryById_path
}, response: Response) => Promise<Factory>;

export const method = 'get';
export const url_path = '/factories/:id';
export const alias = 'T_getFactoryById';
export const is_streaming = false;
