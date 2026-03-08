import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DowntimeEvent } from '../model/table/DowntimeEvent'

export class T_getDowntimeEvents_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getDowntimeEvents_query {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'limit must be a number (decimal)' })
  limit?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'offset must be a number (decimal)' })
  offset?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_machine must be a number (decimal)' })
  id_machine?: number
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory?: number
  @IsOptional()
  @IsString({ message: 'category must be a string' })
  category?: string
  @IsOptional()
  @IsString({ message: 'status must be a string' })
  status?: string
  @IsOptional()
  @IsString({ message: 'start_date must be a string' })
  start_date?: string
  @IsOptional()
  @IsString({ message: 'end_date must be a string' })
  end_date?: string
}
class ReturnType_0 {
  @IsNotEmpty({ message: 'total cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'total must be a number (decimal)' })
  total!: number
  @IsNotEmpty({ message: 'data cannot be empty' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DowntimeEvent)
  data!: DowntimeEvent[]
}

export type T_getDowntimeEvents = (request: {
  headers: T_getDowntimeEvents_headers
  query: T_getDowntimeEvents_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/downtime-events';
export const alias = 'T_getDowntimeEvents';
export const is_streaming = false;
