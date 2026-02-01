import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse';

export class T_createQualityParameter_headers {
    @IsNotEmpty()
    @IsString()
    authorization!: string
}

export class T_createQualityParameter_body {
    @IsNotEmpty()
    @IsString()
    name!: string;

    @IsNotEmpty()
    @IsString()
    grade!: string;

    @IsOptional()
    @IsNumber()
    id_variety?: number;

    @IsOptional()
    @IsNumber()
    min_value?: number;

    @IsOptional()
    @IsNumber()
    max_value?: number;

    @IsNotEmpty()
    @IsString()
    unit!: string;

    @IsOptional()
    @IsNumber()
    level?: number;
}

export type T_createQualityParameter = (request: {
    headers: T_createQualityParameter_headers
    body: T_createQualityParameter_body
}, response: Response) => Promise<MessageResponse>;

export const method = 'post';
export const url_path = '/quality-parameters';
export const alias = 'T_createQualityParameter';
export const is_streaming = false;
