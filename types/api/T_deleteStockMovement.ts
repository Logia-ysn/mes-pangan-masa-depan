import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber, IsOptional } from "class-validator";
import { Transform } from "class-transformer";

export class T_deleteStockMovement_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_deleteStockMovement_params {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}

export type T_deleteStockMovement = (request: {
    headers: T_deleteStockMovement_headers
    params: T_deleteStockMovement_params
}, response: Response) => Promise<{ status: string }>;

export const method = 'delete';
export const url_path = '/stock-movements/:id';
export const alias = 'T_deleteStockMovement';
export const is_streaming = false;
