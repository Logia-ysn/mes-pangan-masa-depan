import { Response } from "express";
import { IsNotEmpty, IsString, IsOptional } from "class-validator";
import { QCGabah } from '@prisma/client';

export class T_analyzeGrain_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_analyzeGrain_body {
    @IsNotEmpty({ message: 'image_base64 cannot be empty' })
    @IsString({ message: 'image_base64 must be a string' })
    image_base64!: string

    @IsOptional()
    @IsString()
    supplier?: string

    @IsOptional()
    @IsString()
    lot?: string
}

export type T_analyzeGrain = (request: {
    headers: T_analyzeGrain_headers
    body: T_analyzeGrain_body
}, response: Response) => Promise<QCGabah>;

export const method = 'post';
export const url_path = '/analyze-grain';
export const alias = 'T_analyzeGrain';
export const is_streaming = false;
