import { Response } from "express";
import { ClassConstructor, Transform, Type, plainToInstance } from "class-transformer";
import { IsNotEmpty, IsNumber, IsObject, IsBoolean, IsOptional, IsISO8601, IsString, IsEnum, ValidateNested, IsArray, ValidationError, validateOrReject } from "class-validator";

export class T_assignMachineToLine_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_assignMachineToLine_path {
    @IsNotEmpty({ message: 'id cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id must be a number (decimal)' })
    id!: number
}
export class T_assignMachineToLine_body {
    @IsNotEmpty({ message: 'id_machine cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_machine must be a number (decimal)' })
    id_machine!: number
    @IsNotEmpty({ message: 'sequence_order cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'sequence_order must be a number (decimal)' })
    sequence_order!: number
}

export type T_assignMachineToLine = (request: {
    headers: T_assignMachineToLine_headers
    path: T_assignMachineToLine_path
    body: T_assignMachineToLine_body
}, response: Response) => Promise<{ success: boolean }>;

export const method = 'post';
export const url_path = '/production-lines/:id/machines';
export const alias = 'T_assignMachineToLine';
export const is_streaming = false;
