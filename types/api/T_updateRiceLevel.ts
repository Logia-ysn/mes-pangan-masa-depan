import { IsNotEmpty, IsOptional, IsString, IsBoolean, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { Response } from 'express';

export class T_updateRiceLevel_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_updateRiceLevel_params {
    @IsNotEmpty() @Transform(({ value }) => parseInt(value)) id!: number;
}

export class T_updateRiceLevel_body {
    @IsOptional() @IsString() code?: string;
    @IsOptional() @IsString() name?: string;
    @IsOptional() @IsNumber() sort_order?: number;
    @IsOptional() @IsBoolean() is_active?: boolean;
}

export type T_updateRiceLevel = (
    request: { headers: T_updateRiceLevel_headers; params: T_updateRiceLevel_params; body: T_updateRiceLevel_body },
    response: Response
) => Promise<any>;

export const method = 'put';
export const url_path = '/rice-levels/:id';
export const alias = 'T_updateRiceLevel';
export const is_streaming = false;
