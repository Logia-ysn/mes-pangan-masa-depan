import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DailyExpense } from '../model/table/DailyExpense'

export class T_getDailyExpenseById_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_getDailyExpenseById_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_getDailyExpenseById = (request: {
  headers: T_getDailyExpenseById_headers
  path: T_getDailyExpenseById_path
}, response: Response) => Promise<DailyExpense>;

export const method = 'get';
export const url_path = '/daily-expenses/:id';
export const alias = 'T_getDailyExpenseById';
export const is_streaming = false;
