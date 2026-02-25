import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DeliveryOrder } from '../model/table/DeliveryOrder'

export class T_createDeliveryOrder_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
class T_createDeliveryOrder_body_6 {
  @IsNotEmpty({ message: 'id_invoice_item cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_invoice_item must be a number (decimal)' })
  id_invoice_item!: number
  @IsNotEmpty({ message: 'quantity_delivered cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'quantity_delivered must be a number (decimal)' })
  quantity_delivered!: number
}
export class T_createDeliveryOrder_body {
  @IsNotEmpty({ message: 'id_invoice cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_invoice must be a number (decimal)' })
  id_invoice!: number
  @IsNotEmpty({ message: 'do_number cannot be empty' })
  @IsString({ message: 'do_number must be a string' })
  do_number!: string
  @IsNotEmpty({ message: 'delivery_date cannot be empty' })
  @IsString({ message: 'delivery_date must be a string' })
  delivery_date!: string
  @IsOptional()
  @IsString({ message: 'driver_name must be a string' })
  driver_name?: string
  @IsOptional()
  @IsString({ message: 'vehicle_number must be a string' })
  vehicle_number?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
  @IsNotEmpty({ message: 'items cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => T_createDeliveryOrder_body_6)
  items!: T_createDeliveryOrder_body_6[]
}

export type T_createDeliveryOrder = (request: {
  headers: T_createDeliveryOrder_headers
  body: T_createDeliveryOrder_body
}, response: Response) => Promise<DeliveryOrder>;

export const method = 'post';
export const url_path = '/delivery-orders';
export const alias = 'T_createDeliveryOrder';
export const is_streaming = false;
