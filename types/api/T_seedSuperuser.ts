import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_seedSuperuser_body {
  @IsNotEmpty({ message: 'secretKey cannot be empty' })
  @IsString({ message: 'secretKey must be a string' })
  secretKey!: string
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

export type T_seedSuperuser = (request: {
  body: T_seedSuperuser_body
}, response: Response) => Promise<ReturnType_0 | null>;

export const method = 'post';
export const url_path = '/seed-superuser';
export const alias = 'T_seedSuperuser';
export const is_streaming = false;
