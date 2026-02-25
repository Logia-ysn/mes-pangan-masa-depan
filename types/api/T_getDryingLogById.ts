import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DryingLog } from '../model/table/DryingLog'

export class T_getDryingLogById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getDryingLogById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getDryingLogById = (request: {
  headers: T_getDryingLogById_headers
  path: T_getDryingLogById_path
}, response: Response) => Promise<DryingLog>;

export const method = 'get';
export const url_path = '/drying-logs/:id';
export const alias = 'T_getDryingLogById';
export const is_streaming = false;
