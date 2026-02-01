import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class MessageResponse {
  @IsNotEmpty({ message: 'message cannot be empty' })
  @IsString({ message: 'message must be a string' })
  message!: string
  @IsNotEmpty({ message: 'success cannot be empty' })
  @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
  @IsBoolean({ message: 'success must be a boolean' })
  success!: boolean
}