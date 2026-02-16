import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { Transform } from 'class-transformer';
import { Response } from 'express';

export class T_getFactoryMaterials_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_getFactoryMaterials_query {
    @IsNotEmpty() @Transform(({ value }) => parseInt(value)) id_factory!: number;
}

export type T_getFactoryMaterials = (
    request: { headers: T_getFactoryMaterials_headers; query: T_getFactoryMaterials_query },
    response: Response
) => Promise<any>;

export const method = 'get';
export const url_path = '/factory-materials';
export const alias = 'T_getFactoryMaterials';
export const is_streaming = false;
