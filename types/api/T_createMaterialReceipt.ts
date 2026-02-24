import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class T_createMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_createMaterialReceipt_body {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id_supplier!: number;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id_factory!: number;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id_product_type!: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() id_variety?: number;
    @IsNotEmpty() @IsString() receipt_date!: string;
    @IsNotEmpty() @IsString() batch_code!: string;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() quantity!: number;
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() unit_price!: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : 0) @IsNumber() other_costs?: number;
    @IsOptional() @IsString() delivery_note_url?: string;
    @IsOptional() @IsString() receipt_url?: string;
    @IsOptional() @IsString() notes?: string;
    @IsOptional() @Transform(p => p.value !== undefined && p.value !== null && p.value !== '' ? parseFloat(p.value) : undefined) moisture_value?: number;
    @IsOptional() @Transform(p => p.value !== undefined && p.value !== null && p.value !== '' ? parseFloat(p.value) : undefined) density_value?: number;
    @IsOptional() @Transform(p => p.value !== undefined && p.value !== null && p.value !== '' ? parseFloat(p.value) : undefined) green_percentage?: number;
    @IsOptional() @IsString() quality_grade?: string;
}

export type T_createMaterialReceipt = (request: { headers: T_createMaterialReceipt_headers; body: T_createMaterialReceipt_body }, response: Response) => Promise<any>;
export const method = 'post';
export const url_path = '/material-receipts';
export const alias = 'T_createMaterialReceipt';
export const is_streaming = false;
