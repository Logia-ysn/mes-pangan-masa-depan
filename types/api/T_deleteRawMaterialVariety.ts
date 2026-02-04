import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString, IsBoolean } from "class-validator";

export class T_deleteRawMaterialVariety_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : Number(param?.value))
  @IsNumber({}, { message: 'id must be a number' })
  id!: number
}

class ReturnType_0 {
  @IsNotEmpty({ message: 'success cannot be empty' })
  @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
  @IsBoolean({ message: 'success must be a boolean' })
  success!: boolean
  @IsNotEmpty({ message: 'message cannot be empty' })
  @IsString({ message: 'message must be a string' })
  message!: string
}

export type T_deleteRawMaterialVariety = (request: {
  headers: { authorization?: string };
  path: T_deleteRawMaterialVariety_path
}, response: Response) => Promise<ReturnType_0 | null>;

export const method = 'delete';
export const url_path = '/raw-material-varieties/:id';
export const alias = 'T_deleteRawMaterialVariety';
export const is_streaming = false;
