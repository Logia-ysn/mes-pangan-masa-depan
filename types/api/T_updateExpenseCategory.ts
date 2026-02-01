import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ExpenseCategory } from '../model/table/ExpenseCategory'

export class T_updateExpenseCategory_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_updateExpenseCategory_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}
export class T_updateExpenseCategory_body {
  @IsOptional()
  @IsString({ message: 'code must be a string' })
  code?: string
  @IsOptional()
  @IsString({ message: 'name must be a string' })
  name?: string
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string
}

export type T_updateExpenseCategory = (request: {
  headers: T_updateExpenseCategory_headers
  path: T_updateExpenseCategory_path
  body: T_updateExpenseCategory_body
}, response: Response) => Promise<ExpenseCategory>;

export const method = 'put';
export const url_path = '/expense-categories/:id';
export const alias = 'T_updateExpenseCategory';
export const is_streaming = false;
