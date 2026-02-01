import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ExpenseCategory } from '../model/table/ExpenseCategory'

export class T_createExpenseCategory_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_createExpenseCategory_body {
  @IsNotEmpty({ message: 'code cannot be empty' })
  @IsString({ message: 'code must be a string' })
  code!: string
  @IsNotEmpty({ message: 'name cannot be empty' })
  @IsString({ message: 'name must be a string' })
  name!: string
  @IsOptional()
  @IsString({ message: 'description must be a string' })
  description?: string
}

export type T_createExpenseCategory = (request: {
  headers: T_createExpenseCategory_headers
  body: T_createExpenseCategory_body
}, response: Response) => Promise<ExpenseCategory>;

export const method = 'post';
export const url_path = '/expense-categories';
export const alias = 'T_createExpenseCategory';
export const is_streaming = false;
