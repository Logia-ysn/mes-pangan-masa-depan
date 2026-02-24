import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";
import { MessageResponse } from '../schema/MessageResponse';

export class T_resetQualityParameters_headers {
    @IsNotEmpty()
    @IsString()
    authorization!: string
}

export class T_resetQualityParameters_body { }

export type T_resetQualityParameters = (request: {
    headers: T_resetQualityParameters_headers
    body: T_resetQualityParameters_body
}, response: Response) => Promise<MessageResponse>;

export const method = 'post';
export const url_path = '/quality-parameters/reset';
export const alias = 'T_resetQualityParameters';
export const is_streaming = false;
