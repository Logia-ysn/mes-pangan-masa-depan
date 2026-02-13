import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";
import { Supplier } from '@prisma/client'

export class T_updateSupplier_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_updateSupplier_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}
export class T_updateSupplier_body {
    @IsOptional()
    @IsString({ message: 'code must be a string' })
    code?: string
    @IsOptional()
    @IsString({ message: 'name must be a string' })
    name?: string
    @IsOptional()
    @IsString({ message: 'contact_person must be a string' })
    contact_person?: string
    @IsOptional()
    @IsString({ message: 'phone must be a string' })
    phone?: string
    @IsOptional()
    @IsString({ message: 'email must be a string' })
    email?: string
    @IsOptional()
    @IsString({ message: 'address must be a string' })
    address?: string
    @IsOptional()
    @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean
}

export type T_updateSupplier = (request: {
    headers: T_updateSupplier_headers
    path: T_updateSupplier_path
    body: T_updateSupplier_body
}, response: Response) => Promise<Supplier>;

export const method = 'put';
export const url_path = '/suppliers/:id';
export const alias = 'T_updateSupplier';
export const is_streaming = false;
