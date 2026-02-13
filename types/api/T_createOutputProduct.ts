import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsString, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { OutputProduct } from '@prisma/client'

export class T_createOutputProduct_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_createOutputProduct_body {
    @IsNotEmpty({ message: 'id_factory cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseInt(param.value))
    @IsNumber({}, { message: 'id_factory must be a number' })
    id_factory!: number

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
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseInt(param.value))
    @IsNumber({}, { message: 'display_order must be a number' })
    display_order?: number
}

export type T_createOutputProduct = (request: {
    headers: T_createOutputProduct_headers
    body: T_createOutputProduct_body
}, response: Response) => Promise<OutputProduct>;

export const method = 'post';
export const url_path = '/output-products';
export const alias = 'T_createOutputProduct';
export const is_streaming = false;
