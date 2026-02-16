import { IsNotEmpty, IsOptional, IsString, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';
import { Response } from 'express';

export class T_updateRiceVariety_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_updateRiceVariety_params {
    @IsNotEmpty() @Transform(({ value }) => parseInt(value)) id!: number;
}

export class T_updateRiceVariety_body {
    @IsOptional() @IsString() code?: string;
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsString() description?: string;
    @IsOptional() @IsBoolean() is_active?: boolean;
}

export type T_updateRiceVariety = (
    request: { headers: T_updateRiceVariety_headers; params: T_updateRiceVariety_params; body: T_updateRiceVariety_body },
    response: Response
) => Promise<any>;

export const method = 'put';
export const url_path = '/rice-varieties/:id';
export const alias = 'T_updateRiceVariety';
export const is_streaming = false;
