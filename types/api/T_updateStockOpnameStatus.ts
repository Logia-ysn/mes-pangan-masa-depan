import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse'

export class T_updateStockOpnameStatus_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateStockOpnameStatus_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateStockOpnameStatus_body {
  @IsNotEmpty({ message: 'status cannot be empty' })
  @IsString({ message: 'status must be a string' })
  status!: string
}

export type T_updateStockOpnameStatus = (request: {
  headers: T_updateStockOpnameStatus_headers
  path: T_updateStockOpnameStatus_path
  body: T_updateStockOpnameStatus_body
}, response: Response) => Promise<MessageResponse>;

export const method = 'put';
export const url_path = '/stock-opnames/:id/status';
export const alias = 'T_updateStockOpnameStatus';
export const is_streaming = false;
