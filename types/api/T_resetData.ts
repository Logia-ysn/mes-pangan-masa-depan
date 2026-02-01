import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_resetData_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_resetData = (request: {
    headers: T_resetData_headers
}, response: Response) => Promise<{ message: string }>;

export const method = 'post';
export const url_path = '/reset-data';
export const alias = 'T_resetData';
export const is_streaming = false;
