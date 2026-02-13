import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Worksheet } from '@prisma/client'

export class T_getWorksheetById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getWorksheetById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getWorksheetById = (request: {
  headers: T_getWorksheetById_headers
  path: T_getWorksheetById_path
}, response: Response) => Promise<Worksheet>;

export const method = 'get';
export const url_path = '/worksheets/:id';
export const alias = 'T_getWorksheetById';
export const is_streaming = false;
