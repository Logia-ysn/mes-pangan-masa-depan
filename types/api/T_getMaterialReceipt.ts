import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class T_getMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_getMaterialReceipt_path {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id!: number;
}

export type T_getMaterialReceipt = (request: { headers: T_getMaterialReceipt_headers; path: T_getMaterialReceipt_path }, response: Response) => Promise<any>;
export const method = 'get';
export const url_path = '/material-receipts/:id';
export const alias = 'T_getMaterialReceipt';
export const is_streaming = false;
