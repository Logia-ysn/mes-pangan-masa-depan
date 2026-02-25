import { Response } from "express";
import { Transform } from "class-transformer";
import { IsNotEmpty, IsNumber, IsOptional, IsString, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { Attendance } from '@prisma/client'

export class T_getAttendances_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getAttendances_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'limit must be a number (decimal)' })
    limit?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'offset must be a number (decimal)' })
    offset?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_employee must be a number (decimal)' })
    id_employee?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'id_factory must be a number (decimal)' })
    id_factory?: number
    @IsOptional()
    @IsString({ message: 'status must be a string' })
    status?: string
    @IsOptional()
    @IsString({ message: 'start_date must be a string' })
    start_date?: string
    @IsOptional()
    @IsString({ message: 'end_date must be a string' })
    end_date?: string
}
class ReturnType_0 {
    @IsNotEmpty({ message: 'total cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'total must be a number (decimal)' })
    total!: number
    @IsNotEmpty({ message: 'data cannot be empty' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => Object)
    data!: Attendance[]
}

export type T_getAttendances = (request: {
    headers: T_getAttendances_headers
    query: T_getAttendances_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/attendances';
export const alias = 'T_getAttendances';
export const is_streaming = false;
