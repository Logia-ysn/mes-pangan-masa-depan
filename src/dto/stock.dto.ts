import { IsNumber, IsString, IsOptional, IsEnum } from 'class-validator';
import { StockMovement_movement_type_enum } from '@prisma/client';

export class CreateStockDTO {
    @IsNumber()
    id_factory!: number;

    @IsNumber()
    id_product_type!: number;

    @IsNumber()
    quantity!: number;

    @IsString()
    unit!: string;
}

export class UpdateStockDTO {
    @IsOptional()
    @IsNumber()
    quantity?: number;

    @IsOptional()
    @IsString()
    unit?: string;
}

export class StockMovementDTO {
    @IsNumber()
    factoryId!: number;

    @IsString()
    productCode!: string;

    @IsNumber()
    quantity!: number;

    @IsEnum(StockMovement_movement_type_enum)
    movementType!: StockMovement_movement_type_enum;

    @IsOptional()
    @IsString()
    referenceType?: string;

    @IsOptional()
    @IsNumber()
    referenceId?: number;

    @IsOptional()
    @IsString()
    notes?: string;
}

export class StockTransferDTO {
    @IsNumber()
    fromFactoryId!: number;

    @IsNumber()
    toFactoryId!: number;

    @IsString()
    productCode!: string;

    @IsNumber()
    quantity!: number;
}

export class StockFilterDTO {
    @IsOptional()
    @IsNumber()
    limit?: number;

    @IsOptional()
    @IsNumber()
    offset?: number;

    @IsOptional()
    @IsNumber()
    id_factory?: number;

    @IsOptional()
    @IsNumber()
    id_product_type?: number;
}
