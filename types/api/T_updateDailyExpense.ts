import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DailyExpense } from '../model/table/DailyExpense'

export class T_updateDailyExpense_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateDailyExpense_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateDailyExpense_body {
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_expense_category must be a number (decimal)' })
  id_expense_category?: number
  @IsOptional()
  @IsString({ message: 'expense_date must be a string' })
  expense_date?: string
  @IsOptional()
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'amount must be a number (decimal)' })
  amount?: number
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string
  @IsOptional()
  @IsString({ message: 'receipt_url must be a string' })
  receipt_url?: string
}

export type T_updateDailyExpense = (request: {
  headers: T_updateDailyExpense_headers
  path: T_updateDailyExpense_path
  body: T_updateDailyExpense_body
}, response: Response) => Promise<DailyExpense>;

export const method = 'put';
export const url_path = '/daily-expenses/:id';
export const alias = 'T_updateDailyExpense';
export const is_streaming = false;
