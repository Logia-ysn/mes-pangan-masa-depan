import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse'

export class T_deleteFactory_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_deleteFactory_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_deleteFactory = (request: {
  headers: T_deleteFactory_headers
  path: T_deleteFactory_path
}, response: Response) => Promise<MessageResponse>;

export const method = 'delete';
export const url_path = '/factories/:id';
export const alias = 'T_deleteFactory';
export const is_streaming = false;
