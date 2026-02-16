import { IsNotEmpty, IsString } from 'class-validator';
import { Response } from 'express';

export class T_getRiceVarieties_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export type T_getRiceVarieties = (
    request: { headers: T_getRiceVarieties_headers },
    response: Response
) => Promise<any>;

export const method = 'get';
export const url_path = '/rice-varieties';
export const alias = 'T_getRiceVarieties';
export const is_streaming = false;
