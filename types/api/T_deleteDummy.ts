import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_deleteDummy_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_deleteDummy = (request: {
    headers: T_deleteDummy_headers
}, response: Response) => Promise<{
    status: string,
    deleted: {
        movements: number,
        worksheets: number,
        maintenance: number,
        invoices: number,
        purchase_orders: number,
        customers: number,
        suppliers: number
    }
}>;

export const method = 'delete';
export const url_path = '/admin/dummy/delete';
export const alias = 'T_deleteDummy';
export const is_streaming = false;
