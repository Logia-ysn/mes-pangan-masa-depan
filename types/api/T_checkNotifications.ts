import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_checkNotifications_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}

export type T_checkNotifications = (request: {
  headers: T_checkNotifications_headers
}, response: Response) => Promise<any>;

export const method = 'post';
export const url_path = '/notifications/check';
export const alias = 'T_checkNotifications';
export const is_streaming = false;
