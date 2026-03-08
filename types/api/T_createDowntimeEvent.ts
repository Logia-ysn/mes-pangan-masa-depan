import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DowntimeEvent } from '../model/table/DowntimeEvent'

export class T_createDowntimeEvent_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createDowntimeEvent_body {
  @IsNotEmpty({ message: 'id_machine cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_machine must be a number (decimal)' })
  id_machine!: number
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'start_time cannot be empty' })
  @IsString({ message: 'start_time must be a string' })
  start_time!: string
  @IsOptional()
  @IsString({ message: 'end_time must be a string' })
  end_time?: string
  @IsNotEmpty({ message: 'category cannot be empty' })
  @IsString({ message: 'category must be a string' })
  category!: string
  @IsOptional()
  @IsString({ message: 'reason must be a string' })
  reason?: string
}

export type T_createDowntimeEvent = (request: {
  headers: T_createDowntimeEvent_headers
  body: T_createDowntimeEvent_body
}, response: Response) => Promise<DowntimeEvent>;

export const method = 'post';
export const url_path = '/downtime-events';
export const alias = 'T_createDowntimeEvent';
export const is_streaming = false;
