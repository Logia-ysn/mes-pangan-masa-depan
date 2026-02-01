import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { DailyExpense } from '../model/table/DailyExpense'

export class T_createDailyExpense_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createDailyExpense_body {
  @IsNotEmpty({ message: 'id_factory cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
  id_factory!: number
  @IsNotEmpty({ message: 'id_expense_category cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id_expense_category must be a number (decimal)' })
  id_expense_category!: number
  @IsNotEmpty({ message: 'expense_date cannot be empty' })
  @IsString({ message: 'expense_date must be a string' })
  expense_date!: string
  @IsNotEmpty({ message: 'amount cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'amount must be a number (decimal)' })
  amount!: number
  @IsNotEmpty({ message: 'description cannot be empty' })
  @IsString({ message: 'description must be a string' })
  description!: string
  @IsOptional()
  @IsString({ message: 'receipt_url must be a string' })
  receipt_url?: string
}

export type T_createDailyExpense = (request: {
  headers: T_createDailyExpense_headers
  body: T_createDailyExpense_body
}, response: Response) => Promise<DailyExpense>;

export const method = 'post';
export const url_path = '/daily-expenses';
export const alias = 'T_createDailyExpense';
export const is_streaming = false;
