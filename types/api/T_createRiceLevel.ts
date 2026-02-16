import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { Response } from 'express';

export class T_createRiceLevel_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_createRiceLevel_body {
    @IsNotEmpty() @IsString() code!: string;
    @IsNotEmpty() @IsString() name!: string;
    @IsNotEmpty() @IsNumber() sort_order!: number;
}

export type T_createRiceLevel = (
    request: { headers: T_createRiceLevel_headers; body: T_createRiceLevel_body },
    response: Response
) => Promise<any>;

export const method = 'post';
export const url_path = '/rice-levels';
export const alias = 'T_createRiceLevel';
export const is_streaming = false;
