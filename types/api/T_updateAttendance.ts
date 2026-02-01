import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Attendance } from '../model/table/Attendance'

export class T_updateAttendance_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateAttendance_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateAttendance_body {
  @IsOptional()
  @IsString({ message: 'attendance_date must be a string' })
  attendance_date?: string
  @IsOptional()
  @IsString({ message: 'check_in_time must be a string' })
  check_in_time?: string
  @IsOptional()
  @IsString({ message: 'check_out_time must be a string' })
  check_out_time?: string
  @IsOptional()
  @IsString({ message: 'status must be a string' })
  status?: string
  @IsOptional()
  @IsString({ message: 'notes must be a string' })
  notes?: string
}

export type T_updateAttendance = (request: {
  headers: T_updateAttendance_headers
  path: T_updateAttendance_path
  body: T_updateAttendance_body
}, response: Response) => Promise<Attendance>;

export const method = 'put';
export const url_path = '/attendances/:id';
export const alias = 'T_updateAttendance';
export const is_streaming = false;
