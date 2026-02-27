import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_getWorksheetPdf_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export type T_getWorksheetPdf = (request: {
    headers: T_getWorksheetPdf_headers
}, response: Response) => Promise<any>;

export const method = 'get';
export const url_path = '/worksheets/:id/pdf';
export const alias = 'T_getWorksheetPdf';
export const is_streaming = false;
