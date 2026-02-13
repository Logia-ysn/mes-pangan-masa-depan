import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsString, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { OutputProduct } from '@prisma/client'

export class T_getOutputProducts_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_getOutputProducts_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseInt(param.value))
    @IsNumber({}, { message: 'id_factory must be a number' })
    id_factory?: number

    @IsOptional()
    @Transform((param?: any): boolean | null => param?.value === 'true' ? true : param?.value === 'false' ? false : null)
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean
}

export type T_getOutputProducts = (request: {
    headers: T_getOutputProducts_headers
    query: T_getOutputProducts_query
}, response: Response) => Promise<{ data: OutputProduct[], total: number }>;

export const method = 'get';
export const url_path = '/output-products';
export const alias = 'T_getOutputProducts';
export const is_streaming = false;
