import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Response } from 'express';

export class T_createRiceVariety_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_createRiceVariety_body {
    @IsNotEmpty() @IsString() code!: string;
    @IsNotEmpty() @IsString() name!: string;
    @IsOptional() @IsString() description?: string;
}

export type T_createRiceVariety = (
    request: { headers: T_createRiceVariety_headers; body: T_createRiceVariety_body },
    response: Response
) => Promise<any>;

export const method = 'post';
export const url_path = '/rice-varieties';
export const alias = 'T_createRiceVariety';
export const is_streaming = false;
