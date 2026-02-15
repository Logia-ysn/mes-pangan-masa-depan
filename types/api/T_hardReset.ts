import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_hardReset_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_hardReset = (request: {
    headers: T_hardReset_headers
}, response: Response) => Promise<{
    status: string,
    deleted: Record<string, number>
}>;

export const method = 'delete';
export const url_path = '/admin/hard-reset';
export const alias = 'T_hardReset';
export const is_streaming = false;
