import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Attendance } from '../model/table/Attendance'

export class T_createAttendance_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createAttendance_body {
  @IsNotEmpty({ message: 'id_employee cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_employee must be a number (decimal)' })
  id_employee!: number
  @IsNotEmpty({ message: 'attendance_date cannot be empty' })
  @IsString({ message: 'attendance_date must be a string' })
  attendance_date!: string
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

export type T_createAttendance = (request: {
  headers: T_createAttendance_headers
  body: T_createAttendance_body
}, response: Response) => Promise<Attendance>;

export const method = 'post';
export const url_path = '/attendances';
export const alias = 'T_createAttendance';
export const is_streaming = false;
