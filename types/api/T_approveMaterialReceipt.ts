import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class T_approveMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_approveMaterialReceipt_path {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id!: number;
}

export type T_approveMaterialReceipt = (request: { headers: T_approveMaterialReceipt_headers; path: T_approveMaterialReceipt_path }, response: Response) => Promise<any>;
export const method = 'post';
export const url_path = '/material-receipts/:id/approve';
export const alias = 'T_approveMaterialReceipt';
export const is_streaming = false;
