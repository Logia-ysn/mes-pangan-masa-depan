import { IsNotEmpty, IsString } from 'class-validator';
import { Response } from 'express';

export class T_getRiceLevels_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export type T_getRiceLevels = (
    request: { headers: T_getRiceLevels_headers },
    response: Response
) => Promise<any>;

export const method = 'get';
export const url_path = '/rice-levels';
export const alias = 'T_getRiceLevels';
export const is_streaming = false;
