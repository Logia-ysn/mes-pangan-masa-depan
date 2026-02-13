import { Response } from "express";
import { IsNotEmpty, IsString } from "class-validator";

export class T_markAllNotificationsRead_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}

export type T_markAllNotificationsRead = (request: {
  headers: T_markAllNotificationsRead_headers
}, response: Response) => Promise<any>;

export const method = 'post';
export const url_path = '/notifications/read-all';
export const alias = 'T_markAllNotificationsRead';
export const is_streaming = false;
