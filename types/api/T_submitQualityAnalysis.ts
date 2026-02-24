import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse';

export class T_submitQualityAnalysis_headers {
    @IsNotEmpty()
    @IsString()
    authorization!: string
}

export class T_submitQualityAnalysis_body {
    @IsNotEmpty()
    @IsString()
    batch_id!: string;

    @IsOptional()
    @IsNumber()
    id_stock_movement?: number;

    @IsOptional()
    @IsNumber()
    variety_id?: number;

    @IsNotEmpty()
    @IsNumber()
    moisture_value!: number;

    @IsNotEmpty()
    @IsNumber()
    density_value!: number;

    @IsOptional()
    @IsString()
    image_url?: string;

    @IsOptional()
    @IsString()
    notes?: string;

    @IsOptional()
    @IsNumber()
    green_percentage?: number;

    @IsOptional()
    @IsNumber()
    yellow_percentage?: number;

    @IsOptional()
    @IsNumber()
    empty_weight?: number;

    @IsOptional()
    @IsNumber()
    damaged_percentage?: number;

    @IsOptional()
    @IsNumber()
    rotten_percentage?: number;

    @IsOptional()
    @IsNumber()
    defect_percentage?: number;
}

export type T_submitQualityAnalysis = (request: {
    headers: T_submitQualityAnalysis_headers
    body: T_submitQualityAnalysis_body
}, response: Response) => Promise<MessageResponse>;

export const method = 'post';
export const url_path = '/quality-analysis';
export const alias = 'T_submitQualityAnalysis';
export const is_streaming = false;
