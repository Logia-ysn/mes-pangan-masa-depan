import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Attendance } from '../model/table/Attendance'

export class T_getAttendanceById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getAttendanceById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getAttendanceById = (request: {
  headers: T_getAttendanceById_headers
  path: T_getAttendanceById_path
}, response: Response) => Promise<Attendance>;

export const method = 'get';
export const url_path = '/attendances/:id';
export const alias = 'T_getAttendanceById';
export const is_streaming = false;
