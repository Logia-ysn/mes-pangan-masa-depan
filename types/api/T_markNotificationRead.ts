import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsString } from "class-validator";

export class T_markNotificationRead_headers {
  @IsNotEmpty({ message: 'authorization cannot be empty' })
  @IsString({ message: 'authorization must be a string' })
  authorization!: string
}
export class T_markNotificationRead_path {
  @IsNotEmpty({ message: 'id cannot be empty' })
  @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
  @IsNumber({}, { message: 'id must be a number' })
  id!: number
}

export type T_markNotificationRead = (request: {
  headers: T_markNotificationRead_headers
  path: T_markNotificationRead_path
}, response: Response) => Promise<any>;

export const method = 'post';
export const url_path = '/notifications/:id/read';
export const alias = 'T_markNotificationRead';
export const is_streaming = false;
