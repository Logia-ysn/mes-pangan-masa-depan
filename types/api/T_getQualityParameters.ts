import { Response } from "express";
import { IsNotEmpty, IsString, IsOptional, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class T_getQualityParameters_headers {
    @IsNotEmpty()
    @IsString()
    authorization!: string
}

export class T_getQualityParameters_query {
    @IsOptional()
    @Transform((param: any) => param.value ? parseInt(param.value) : undefined)
    @IsNumber()
    id_variety?: number;
}

export type T_getQualityParameters = (request: {
    headers: T_getQualityParameters_headers
    query: T_getQualityParameters_query
}, response: Response) => Promise<any>;

export const method = 'get';
export const url_path = '/quality-parameters';
export const alias = 'T_getQualityParameters';
export const is_streaming = false;
