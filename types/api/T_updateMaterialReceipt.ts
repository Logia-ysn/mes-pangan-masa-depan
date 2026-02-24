import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class T_updateMaterialReceipt_headers {
    @IsNotEmpty() @IsString() authorization!: string;
}

export class T_updateMaterialReceipt_path {
    @IsNotEmpty() @Transform(p => parseFloat(p?.value)) @IsNumber() id!: number;
}

export class T_updateMaterialReceipt_body {
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() id_supplier?: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() id_factory?: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() id_product_type?: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() id_variety?: number;
    @IsOptional() @IsString() receipt_date?: string;
    @IsOptional() @IsString() batch_code?: string;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() quantity?: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() unit_price?: number;
    @IsOptional() @Transform(p => p?.value ? parseFloat(p.value) : null) @IsNumber() other_costs?: number;
    @IsOptional() @IsString() delivery_note_url?: string;
    @IsOptional() @IsString() receipt_url?: string;
    @IsOptional() @IsString() notes?: string;
    @IsOptional() @Transform(p => p.value !== undefined && p.value !== null && p.value !== '' ? parseFloat(p.value) : undefined) moisture_value?: number;
    @IsOptional() @Transform(p => p.value !== undefined && p.value !== null && p.value !== '' ? parseFloat(p.value) : undefined) density_value?: number;
    @IsOptional() @Transform(p => p.value !== undefined && p.value !== null && p.value !== '' ? parseFloat(p.value) : undefined) green_percentage?: number;
    @IsOptional() @IsString() quality_grade?: string;
}

export type T_updateMaterialReceipt = (request: { headers: T_updateMaterialReceipt_headers; path: T_updateMaterialReceipt_path; body: T_updateMaterialReceipt_body }, response: Response) => Promise<any>;
export const method = 'put';
export const url_path = '/material-receipts/:id';
export const alias = 'T_updateMaterialReceipt';
export const is_streaming = false;
