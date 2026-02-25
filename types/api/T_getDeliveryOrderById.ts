import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DeliveryOrder } from '../model/table/DeliveryOrder'

export class T_getDeliveryOrderById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getDeliveryOrderById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getDeliveryOrderById = (request: {
  headers: T_getDeliveryOrderById_headers
  path: T_getDeliveryOrderById_path
}, response: Response) => Promise<DeliveryOrder>;

export const method = 'get';
export const url_path = '/delivery-orders/:id';
export const alias = 'T_getDeliveryOrderById';
export const is_streaming = false;
