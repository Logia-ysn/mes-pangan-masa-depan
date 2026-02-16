import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Response } from 'express';

export class T_createProductTypeSKU_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_createProductTypeSKU_body {
    @IsNotEmpty() @IsNumber() id_rice_level!: number;
    @IsNotEmpty() @IsNumber() id_variety!: number;
    @IsOptional() @IsNumber() id_rice_brand?: number;
    @IsOptional() @IsNumber() id_factory?: number;
    @IsOptional() @IsString() category?: string;
}

export type T_createProductTypeSKU = (
    request: { headers: T_createProductTypeSKU_headers; body: T_createProductTypeSKU_body },
    response: Response
) => Promise<any>;

export const method = 'post';
export const url_path = '/product-types/sku';
export const alias = 'T_createProductTypeSKU';
export const is_streaming = false;
