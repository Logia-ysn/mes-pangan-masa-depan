import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class T_deleteMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_deleteMaterialReceipt_path {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id!: number;
}

export type T_deleteMaterialReceipt = (request: { headers: T_deleteMaterialReceipt_headers; path: T_deleteMaterialReceipt_path }, response: Response) => Promise<any>;
export const method = 'delete';
export const url_path = '/material-receipts/:id';
export const alias = 'T_deleteMaterialReceipt';
export const is_streaming = false;
