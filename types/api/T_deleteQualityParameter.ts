import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class T_deleteQualityParameter_headers {
    @IsNotEmpty()
    @IsString()
    authorization!: string
}

export class T_deleteQualityParameter_path {
    @IsNotEmpty()
    @Transform((param: any) => parseInt(param.value))
    @IsNumber()
    id!: number;
}

export type T_deleteQualityParameter = (request: {
    headers: T_deleteQualityParameter_headers
    path: T_deleteQualityParameter_path
}, response: Response) => Promise<any>;

export const method = 'delete';
export const url_path = '/quality-parameters/:id';
export const alias = 'T_deleteQualityParameter';
export const is_streaming = false;
