import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import type { User } from '@prisma/client'

export class AuthResponse {
  @IsNotEmpty({ message: 'token cannot be empty' })
  @IsString({ message: 'token must be a string' })
  token!: string
  @IsNotEmpty({ message: 'user cannot be empty' })
  @IsObject()
  @ValidateNested()
  @Type(() => Object)
  user!: User
}