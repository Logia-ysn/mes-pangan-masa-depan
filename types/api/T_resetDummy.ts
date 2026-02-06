import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_resetDummy_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_resetDummy = (request: {
    headers: T_resetDummy_headers
}, response: Response) => Promise<{
    status: string,
    deleted: {
        inventory: number,
        worksheets: number,
        schedules: number,
        transactions: number,
        logs: number
    }
}>;

export const method = 'delete';
export const url_path = '/admin/dummy/reset';
export const alias = 'T_resetDummy';
export const is_streaming = false;
