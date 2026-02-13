import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsString, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { ProcessCategory } from '@prisma/client'

export class T_createProcessCategory_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_createProcessCategory_body {
    @IsNotEmpty({ message: 'code cannot be empty' })
    @IsString({ message: 'code must be a string' })
    code!: string

    @IsNotEmpty({ message: 'name cannot be empty' })
    @IsString({ message: 'name must be a string' })
    name!: string

    @IsOptional()
    @IsString({ message: 'description must be a string' })
    description?: string

    @IsOptional()
    @IsBoolean({ message: 'is_main_process must be a boolean' })
    is_main_process?: boolean

    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseInt(param.value))
    @IsNumber({}, { message: 'display_order must be a number' })
    display_order?: number
}

export type T_createProcessCategory = (request: {
    headers: T_createProcessCategory_headers
    body: T_createProcessCategory_body
}, response: Response) => Promise<ProcessCategory>;

export const method = 'post';
export const url_path = '/process-categories';
export const alias = 'T_createProcessCategory';
export const is_streaming = false;
