import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Response } from 'express';

export class T_updateRiceBrand_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_updateRiceBrand_params {
    @IsNotEmpty() @Transform(({ value }) => parseInt(value)) id!: number;
}

export class T_updateRiceBrand_body {
    @IsOptional() @IsString() code?: string;
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsBoolean() is_active?: boolean;
}

export type T_updateRiceBrand = (
    request: { headers: T_updateRiceBrand_headers; params: T_updateRiceBrand_params; body: T_updateRiceBrand_body },
    response: Response
) => Promise<any>;

export const method = 'put';
export const url_path = '/rice-brands/:id';
export const alias = 'T_updateRiceBrand';
export const is_streaming = false;
