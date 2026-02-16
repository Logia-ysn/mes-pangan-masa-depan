import { IsNotEmpty, IsString } from 'class-validator';
import { Response } from 'express';

export class T_createRiceBrand_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_createRiceBrand_body {
    @IsNotEmpty() @IsString() code!: string;
    @IsNotEmpty() @IsString() name!: string;
}

export type T_createRiceBrand = (
    request: { headers: T_createRiceBrand_headers; body: T_createRiceBrand_body },
    response: Response
) => Promise<any>;

export const method = 'post';
export const url_path = '/rice-brands';
export const alias = 'T_createRiceBrand';
export const is_streaming = false;
