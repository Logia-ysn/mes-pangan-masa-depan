import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class T_deleteDryingLog_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_deleteDryingLog_body {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number' })
    id!: number
}

export type T_deleteDryingLog = (request: {
    headers: T_deleteDryingLog_headers
    body: T_deleteDryingLog_body
}, response: Response) => Promise<{ success: boolean }>;

export const method = 'delete';
export const url_path = '/drying-logs';
export const alias = 'T_deleteDryingLog';
export const is_streaming = false;
