import { IsNotEmpty, IsString } from 'class-validator';
import { Response } from 'express';

export class T_getRiceBrands_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export type T_getRiceBrands = (
    request: { headers: T_getRiceBrands_headers },
    response: Response
) => Promise<any>;

export const method = 'get';
export const url_path = '/rice-brands';
export const alias = 'T_getRiceBrands';
export const is_streaming = false;
