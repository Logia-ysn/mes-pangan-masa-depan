import { Response } from "express";
import { IsNotEmpty, IsString, IsNumber, Min } from "class-validator";

export class T_transferStock_headers {
    @IsNotEmpty({ message: 'authorization cannot be empty' })
    @IsString({ message: 'authorization must be a string' })
    authorization!: string
}

export class T_transferStock_body {
    @IsNotEmpty({ message: 'fromFactoryId cannot be empty' })
    @IsNumber({}, { message: 'fromFactoryId must be a number' })
    fromFactoryId!: number

    @IsNotEmpty({ message: 'toFactoryId cannot be empty' })
    @IsNumber({}, { message: 'toFactoryId must be a number' })
    toFactoryId!: number

    @IsNotEmpty({ message: 'productCode cannot be empty' })
    @IsString({ message: 'productCode must be a string' })
    productCode!: string

    @IsNotEmpty({ message: 'quantity cannot be empty' })
    @IsNumber({}, { message: 'quantity must be a number' })
    @Min(0.01, { message: 'quantity must be greater than 0' })
    quantity!: number

    notes?: string
}

export type T_transferStock = (request: {
    headers: T_transferStock_headers,
    body: T_transferStock_body
}, response: Response) => Promise<{
    status: string,
    message: string,
    data: {
        from: {
            factory_id: number,
            product_code: string,
            new_quantity: number
        },
        to: {
            factory_id: number,
            product_code: string,
            new_quantity: number
        }
    }
}>;

export const method = 'post';
export const url_path = '/stocks/transfer';
export const alias = 'T_transferStock';
export const is_streaming = false;
