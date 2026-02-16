import { IsNotEmpty, IsString, IsNumber, IsBoolean } from 'class-validator';
import { Response } from 'express';

export class T_upsertFactoryMaterial_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_upsertFactoryMaterial_body {
    @IsNotEmpty() @IsNumber() id_factory!: number;
    @IsNotEmpty() @IsNumber() id_product_type!: number;
    @IsNotEmpty() @IsBoolean() is_input!: boolean;
    @IsNotEmpty() @IsBoolean() is_output!: boolean;
}

export type T_upsertFactoryMaterial = (
    request: { headers: T_upsertFactoryMaterial_headers; body: T_upsertFactoryMaterial_body },
    response: Response
) => Promise<any>;

export const method = 'post';
export const url_path = '/factory-materials';
export const alias = 'T_upsertFactoryMaterial';
export const is_streaming = false;
