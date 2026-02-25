import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { QCResult } from '../model/table/QCResult'

export class T_getQCResultById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getQCResultById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getQCResultById = (request: {
  headers: T_getQCResultById_headers
  path: T_getQCResultById_path
}, response: Response) => Promise<QCResult>;

export const method = 'get';
export const url_path = '/qc-results/:id';
export const alias = 'T_getQCResultById';
export const is_streaming = false;
