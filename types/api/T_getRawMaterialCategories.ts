import { Response } from "express";
import { Transform, Type } from "class-transformer";
import { IsNotEmpty, IsNumber, IsBoolean, IsOptional, IsString, ValidateNested, IsArray } from "class-validator";
import { RawMaterialCategory } from '../model/table/RawMaterialCategory'

export class T_getRawMaterialCategories_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}
export class T_getRawMaterialCategories_query {
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'limit must be a number (decimal)' })
    limit?: number
    @IsOptional()
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'offset must be a number (decimal)' })
    offset?: number
    @IsOptional()
    @Transform((param?: any): boolean | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : (param?.value === 'true' || ((typeof param?.value === 'boolean') && param?.value)))
    @IsBoolean({ message: 'is_active must be a boolean' })
    is_active?: boolean
}
class ReturnType_0 {
    @IsNotEmpty({ message: 'total cannot be empty' })
    @Transform((param?: any): number | null => (param?.value === null || param?.value === undefined || param?.value === '') ? null : parseFloat(param.value))
    @IsNumber({}, { message: 'total must be a number (decimal)' })
    total!: number
    @IsNotEmpty({ message: 'data cannot be empty' })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => RawMaterialCategory)
    data!: RawMaterialCategory[]
}

export type T_getRawMaterialCategories = (request: {
    headers: T_getRawMaterialCategories_headers
    query: T_getRawMaterialCategories_query
}, response: Response) => Promise<ReturnType_0>;

export const method = 'get';
export const url_path = '/raw-material-categories';
export const alias = 'T_getRawMaterialCategories';
export const is_streaming = false;
