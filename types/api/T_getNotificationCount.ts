import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_getNotificationCount_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}

export type T_getNotificationCount = (request: {
  headers: T_getNotificationCount_headers
}, response: Response) => Promise<any>;

export const method = 'get';
export const url_path = '/notifications/count';
export const alias = 'T_getNotificationCount';
export const is_streaming = false;
