import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RawMaterialVariety } from '@prisma/client'

export class T_createRawMaterialVariety_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_createRawMaterialVariety_body {
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

export type T_createRawMaterialVariety = (request: {
    headers: T_createRawMaterialVariety_headers
    body: T_createRawMaterialVariety_body
}, response: Response) => Promise<RawMaterialVariety>;

export const method = 'post';
export const url_path = '/raw-material-varieties';
export const alias = 'T_createRawMaterialVariety';
export const is_streaming = false;
