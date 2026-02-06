import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber } from "class-validator";
import { Transform } from "class-transformer";

export class T_deleteStock_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_deleteStock_params {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}

export type T_deleteStock = (request: {
    headers: T_deleteStock_headers
    params: T_deleteStock_params
}, response: Response) => Promise<{ status: string, message: string }>;

export const method = 'delete';
export const url_path = '/stocks/:id';
export const alias = 'T_deleteStock';
export const is_streaming = false;
