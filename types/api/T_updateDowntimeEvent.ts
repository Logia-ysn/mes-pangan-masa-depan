import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DowntimeEvent } from '../model/table/DowntimeEvent'

export class T_updateDowntimeEvent_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateDowntimeEvent_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateDowntimeEvent_body {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_machine must be a number (decimal)' })
  id_machine?: number
  @IsOptional()
  @IsString({ message: 'start_time must be a string' })
  start_time?: string
  @IsOptional()
  @IsString({ message: 'end_time must be a string' })
  end_time?: string
  @IsOptional()
  @IsString({ message: 'category must be a string' })
  category?: string
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  reason?: string
}

export type T_updateDowntimeEvent = (request: {
  headers: T_updateDowntimeEvent_headers
  path: T_updateDowntimeEvent_path
  body: T_updateDowntimeEvent_body
}, response: Response) => Promise<DowntimeEvent>;

export const method = 'put';
export const url_path = '/downtime-events/:id';
export const alias = 'T_updateDowntimeEvent';
export const is_streaming = false;
