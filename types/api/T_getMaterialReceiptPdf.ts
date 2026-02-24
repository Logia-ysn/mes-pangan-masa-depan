import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class T_getMaterialReceiptPdf_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_getMaterialReceiptPdf_path {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id!: number;
}

export type T_getMaterialReceiptPdf = (request: { headers: T_getMaterialReceiptPdf_headers; path: T_getMaterialReceiptPdf_path }, response: Response) => Promise<any>;
export const method = 'get';
export const url_path = '/material-receipts/:id/pdf';
export const alias = 'T_getMaterialReceiptPdf';
export const is_streaming = false;
