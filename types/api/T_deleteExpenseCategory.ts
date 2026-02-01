import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse'

export class T_deleteExpenseCategory_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_deleteExpenseCategory_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number (decimal)' })
  id!: number
}

export type T_deleteExpenseCategory = (request: {
  headers: T_deleteExpenseCategory_headers
  path: T_deleteExpenseCategory_path
}, response: Response) => Promise<MessageResponse>;

export const method = 'delete';
export const url_path = '/expense-categories/:id';
export const alias = 'T_deleteExpenseCategory';
export const is_streaming = false;
