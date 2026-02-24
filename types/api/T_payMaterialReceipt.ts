import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class T_payMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_payMaterialReceipt_path {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id!: number;
}

export class T_payMaterialReceipt_body {
    @IsOptional() @IsString() payment_reference?: string;
    @IsOptional() @IsString() payment_method?: 'CASH' | 'TRANSFER' | 'CHECK' | 'GIRO';
}

export type T_payMaterialReceipt = (request: { headers: T_payMaterialReceipt_headers; path: T_payMaterialReceipt_path; body: T_payMaterialReceipt_body }, response: Response) => Promise<any>;
export const method = 'post';
export const url_path = '/material-receipts/:id/pay';
export const alias = 'T_payMaterialReceipt';
export const is_streaming = false;
