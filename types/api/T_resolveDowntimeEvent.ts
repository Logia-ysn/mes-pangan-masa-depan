import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DowntimeEvent } from '../model/table/DowntimeEvent'

export class T_resolveDowntimeEvent_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_resolveDowntimeEvent_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_resolveDowntimeEvent_body {
  @IsNotEmpty({ message: 'end_time cannot be empty' })
  @IsString({ message: 'end_time must be a string' })
  end_time!: string
  @IsOptional()
  @IsString({ message: 'resolution must be a string' })
  resolution?: string
}

export type T_resolveDowntimeEvent = (request: {
  headers: T_resolveDowntimeEvent_headers
  path: T_resolveDowntimeEvent_path
  body: T_resolveDowntimeEvent_body
}, response: Response) => Promise<DowntimeEvent>;

export const method = 'put';
export const url_path = '/downtime-events/:id/resolve';
export const alias = 'T_resolveDowntimeEvent';
export const is_streaming = false;
