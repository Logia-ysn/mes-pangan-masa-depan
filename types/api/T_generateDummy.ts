import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_generateDummy_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_generateDummy = (request: {
    headers: T_generateDummy_headers
}, response: Response) => Promise<{
    status: string,
    created: {
        products: number,
        inventory: number,
        worksheets: number,
        transactions: number,
        machine_logs: number,
        sales: number,
        purchasing: number
    }
}>;

export const method = 'post';
export const url_path = '/admin/dummy/generate';
export const alias = 'T_generateDummy';
export const is_streaming = false;
