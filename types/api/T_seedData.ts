import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_seedData_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_seedData = (request: {
    headers: T_seedData_headers
}, response: Response) => Promise<{ message: string, stats?: any }>;

export const method = 'post';
export const url_path = '/seed-data';
export const alias = 'T_seedData';
export const is_streaming = false;
