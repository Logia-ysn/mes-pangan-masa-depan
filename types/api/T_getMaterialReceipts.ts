import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class T_getMaterialReceipts_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_getMaterialReceipts_query {
    @IsOptional() @Transform(p => parseFloat(p?.value)) @IsNumber() limit?: number;
    @IsOptional() @Transform(p => parseFloat(p?.value)) @IsNumber() offset?: number;
    @IsOptional() @Transform(p => parseFloat(p?.value)) @IsNumber() id_factory?: number;
    @IsOptional() @Transform(p => parseFloat(p?.value)) @IsNumber() id_supplier?: number;
    @IsOptional() @IsString() status?: string;
    @IsOptional() @IsString() start_date?: string;
    @IsOptional() @IsString() end_date?: string;
}

export type T_getMaterialReceipts = (request: { headers: T_getMaterialReceipts_headers; query: T_getMaterialReceipts_query }, response: Response) => Promise<any>;
export const method = 'get';
export const url_path = '/material-receipts';
export const alias = 'T_getMaterialReceipts';
export const is_streaming = false;
