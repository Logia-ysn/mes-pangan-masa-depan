import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";
import { RawMaterialCategory } from '../model/table/RawMaterialCategory'

export class T_createRawMaterialCategory_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_createRawMaterialCategory_body {
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

export type T_createRawMaterialCategory = (request: {
    headers: T_createRawMaterialCategory_headers
    body: T_createRawMaterialCategory_body
}, response: Response) => Promise<RawMaterialCategory>;

export const method = 'post';
export const url_path = '/raw-material-categories';
export const alias = 'T_createRawMaterialCategory';
export const is_streaming = false;
