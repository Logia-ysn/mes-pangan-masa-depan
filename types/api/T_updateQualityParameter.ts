import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";
import { Transform } from "class-transformer";
import { MessageResponse } from '../schema/MessageResponse';

export class T_updateQualityParameter_headers {
    @IsNotEmpty()
    @IsString()
    authorization!: string
}

export class T_updateQualityParameter_path {
    @IsNotEmpty()
    @Transform((param: any) => parseInt(param.value))
    @IsNumber()
    id!: number;
}

export class T_updateQualityParameter_body {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    grade?: string;

    @IsOptional()
    @IsNumber()
    level?: number;

    @IsOptional()
    @IsNumber()
    id_variety?: number;

    @IsOptional()
    @IsNumber()
    min_value?: number;

    @IsOptional()
    @IsNumber()
    max_value?: number;

    @IsOptional()
    @IsString()
    unit?: string;

    @IsOptional()
    is_active?: boolean;
}

export type T_updateQualityParameter = (request: {
    headers: T_updateQualityParameter_headers
    path: T_updateQualityParameter_path
    body: T_updateQualityParameter_body
}, response: Response) => Promise<MessageResponse>;

export const method = 'put';
export const url_path = '/quality-parameters/:id';
export const alias = 'T_updateQualityParameter';
export const is_streaming = false;
