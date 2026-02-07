/**
 * Worksheet Service
 * Handles production worksheet business logic
 * 
 * RULES:
 * - No HTTP request/response objects
 * - No direct database queries (use repositories)
 * - Pure business logic only
 */

import { Worksheet } from '../../types/model/table/Worksheet';
import { WorksheetInputBatch } from '../../types/model/table/WorksheetInputBatch';
import { WorksheetSideProduct } from '../../types/model/table/WorksheetSideProduct';
import { OutputProduct } from '../../types/model/table/OutputProduct';
import { StockMovement } from '../../types/model/table/StockMovement';
import { worksheetRepository, ProductionStats } from '../repositories/worksheet.repository';
import { stockRepository } from '../repositories/stock.repository';
import { stockMovementRepository } from '../repositories/stock-movement.repository';
import { stockService } from './stock.service';
import { AppDataSource } from '../../data-source';
import { EntityManager } from 'typeorm';
import { WorkshiftType } from '../../types/model/enum/WorkshiftType';
import { MovementType } from '../../types/model/enum/MovementType';
import { NotFoundError, BusinessRuleError } from '../utils/errors';

export interface InputBatchDTO {
    id_stock: number;
    quantity: number;
    unit_price?: number;
}

export interface SideProductDTO {
    product_code: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_value: number;
    is_auto_calculated: boolean;
    auto_percentage?: number;
}

export interface CreateWorksheetDTO {
    id_factory: number;
    id_user: number;
    worksheet_date: string;
    shift: WorkshiftType;
    gabah_input: number;
    beras_output: number;
    menir_output?: number;
    dedak_output?: number;
    sekam_output?: number;
    machine_hours?: number;
    downtime_hours?: number;
    downtime_reason?: string;
    notes?: string;
    // New PMD 1 fields
    input_batch_id?: number;
    id_machine?: number;
    input_category_code?: string;
    process_step?: string;
    production_cost?: number;
    // Enhancement fields (HPP Calculation)
    id_output_product?: number;
    process_steps?: string;
    batch_code?: string;
    raw_material_cost?: number;
    side_product_revenue?: number;
    hpp?: number;
    hpp_per_kg?: number;
    input_batches?: InputBatchDTO[];
    side_products?: SideProductDTO[];
}

export interface UpdateWorksheetDTO extends Partial<CreateWorksheetDTO> {
    id: number;
}

// Process step constants for PMD 1
export const PROCESS_STEPS = {
    DRYING: 'DRYING',           // Pengeringan: GKP -> GKG
    HUSKING: 'HUSKING',         // Penggilingan: GKG -> PK + Sekam
    STONE_POLISHING: 'STONE_POLISHING'  // Poles: PK -> Glosor + Bekatul
} as const;

class WorksheetService {
    /**
     * Create new worksheet and update stock
     */
    async createWorksheet(dto: CreateWorksheetDTO): Promise<Worksheet> {
        return await AppDataSource.transaction(async (manager: EntityManager) => {
            // 1. Create and Save Worksheet
            const worksheet = new Worksheet() as any;
            this.mapDtoToWorksheet(worksheet, dto);
            worksheet.rendemen = this.calculateRendemen(dto.gabah_input, dto.beras_output);

            const savedWorksheet = await manager.save(Worksheet, worksheet);

            // 2. Handle Input Batches
            if (dto.input_batches && dto.input_batches.length > 0) {
                await this.handleInputBatches(manager, savedWorksheet, dto.input_batches, dto.id_user, dto.id_factory);
            } else {
                // Legacy fallback
                // Note: We need to use service method but strictly it should use manager. 
                // For now, let's keep it simple or implement the logic here using manager to be safe.
                // Re-implementation of updateStockFromProduction using manager would be best, 
                // but stockService.updateStock manages its own repository calls. 
                // Ideally stockService SHOULD accept a transaction manager. 
                // For this refactor, I will assume stockService.updateStock is safe enough OR 
                // I will replicate the logic to use the transaction manager. A safer bet is to use the manager.

                await this.updateStockFromProductionTransactional(manager, savedWorksheet, dto.id_user);
            }

            // 3. Handle Side Products
            const savedSideProducts: WorksheetSideProduct[] = [];
            if (dto.side_products && dto.side_products.length > 0) {
                for (const spDto of dto.side_products) {
                    const sp = new WorksheetSideProduct();
                    sp.id_worksheet = savedWorksheet.id;
                    sp.product_code = spDto.product_code;
                    sp.product_name = spDto.product_name;
                    sp.quantity = spDto.quantity;
                    sp.unit_price = spDto.unit_price;
                    sp.total_value = spDto.quantity * (spDto.unit_price || 0);
                    sp.is_auto_calculated = spDto.is_auto_calculated;
                    sp.auto_percentage = spDto.auto_percentage;
                    await manager.save(WorksheetSideProduct, sp);
                    savedSideProducts.push(sp);
                }
            }

            // 4. Handle Output Stocks
            await this.addOutputStocksTransactional(manager, savedWorksheet, dto.id_user, savedSideProducts);

            return savedWorksheet;
        });
    }

    private mapDtoToWorksheet(worksheet: any, dto: CreateWorksheetDTO) {
        worksheet.id_factory = dto.id_factory;
        worksheet.id_user = dto.id_user;
        worksheet.worksheet_date = new Date(dto.worksheet_date);
        worksheet.shift = dto.shift;
        worksheet.gabah_input = dto.gabah_input;
        worksheet.beras_output = dto.beras_output;
        worksheet.menir_output = dto.menir_output || 0;
        worksheet.dedak_output = dto.dedak_output || 0;
        worksheet.sekam_output = dto.sekam_output || 0;
        worksheet.machine_hours = dto.machine_hours || 0;
        worksheet.downtime_hours = dto.downtime_hours || 0;
        worksheet.downtime_reason = dto.downtime_reason;
        worksheet.notes = dto.notes;

        // Extended fields
        worksheet.input_batch_id = dto.input_batch_id;
        worksheet.id_machine = dto.id_machine;
        worksheet.input_category_code = dto.input_category_code;
        worksheet.process_step = dto.process_step;
        worksheet.production_cost = dto.production_cost || 0;
        worksheet.id_output_product = dto.id_output_product;
        worksheet.process_steps = dto.process_steps;
        worksheet.batch_code = dto.batch_code;
        worksheet.raw_material_cost = dto.raw_material_cost || 0;
        worksheet.side_product_revenue = dto.side_product_revenue || 0;
        worksheet.hpp = dto.hpp || 0;
        worksheet.hpp_per_kg = dto.hpp_per_kg || 0;
    }

    private async handleInputBatches(
        manager: EntityManager,
        worksheet: any,
        batches: InputBatchDTO[],
        userId: number,
        factoryId: number
    ) {
        for (const batchDto of batches) {
            const batch = new WorksheetInputBatch();
            batch.id_worksheet = worksheet.id;
            batch.id_stock = batchDto.id_stock;
            batch.quantity = batchDto.quantity;
            batch.unit_price = batchDto.unit_price || 0;
            batch.total_cost = (batchDto.quantity) * (batchDto.unit_price || 0);
            await manager.save(WorksheetInputBatch, batch);

            // Deduct stock
            // Note: We need to use stockService logic but within transaction.
            // Since stockService doesn't expose transactional methods yet, 
            // we'll implement the critical movement creation here manually to ensure atomicity.
            // TODO: Refactor StockService to accept TransactionManager

            // For now, we unfortunately have to risk calling the non-transactional stock service 
            // OR revert to manual movement creation.
            // Let's use manual creation for safety within this transaction block.

            const stock = await stockRepository.findById(batchDto.id_stock); // This uses default repo, acceptable for read
            if (stock && stock.otm_id_product_type) {
                await this.createStockMovementTransactional(
                    manager,
                    stock.id,
                    userId,
                    MovementType.OUT,
                    batchDto.quantity,
                    'WORKSHEET',
                    worksheet.id,
                    JSON.stringify({
                        type: 'PRODUCTION_INPUT_BATCH',
                        productCode: stock.otm_id_product_type.code,
                        batch_id: batch.id,
                        batch_code: worksheet.batch_code
                    })
                );
            }
        }
    }

    // Helper to create movement within transaction
    private async createStockMovementTransactional(
        manager: EntityManager,
        stockId: number,
        userId: number,
        type: MovementType,
        qty: number,
        refType: string,
        refId: number,
        notes: string
    ) {
        const movement = new StockMovement();
        movement.id_stock = stockId;
        movement.id_user = userId;
        movement.movement_type = type;
        movement.quantity = qty;
        movement.reference_type = refType;
        movement.reference_id = refId;
        movement.notes = notes;
        await manager.save(StockMovement, movement);

        // Update Stock Quantity
        // We must fetch STOCK using MANAGER to ensure we lock/update correctly within transaction
        const StockModel = require('../../types/model/table/Stock').Stock;
        const stockEntity = await manager.findOne(StockModel, { where: { id: stockId } }) as any;

        if (stockEntity) {
            if (type === MovementType.IN) {
                stockEntity.quantity = Number(stockEntity.quantity) + Number(qty);
            } else {
                stockEntity.quantity = Number(stockEntity.quantity) - Number(qty);
            }
            await manager.save(StockModel, stockEntity);
        }
    }

    private async updateStockFromProductionTransactional(manager: EntityManager, worksheet: any, userId: number) {
        const inputProductCode = worksheet.input_category_code || 'GKP';

        const StockModel = require('../../types/model/table/Stock').Stock;
        const ProductTypeModel = require('../../types/model/table/ProductType').ProductType;

        const productType = await manager.findOne(ProductTypeModel, { where: { code: inputProductCode } });
        if (!productType) return;

        // Correctly use findOne with where clause and cast relation IDs if needed
        const stock = await manager.findOne(StockModel, {
            where: {
                id_factory: worksheet.id_factory,
                id_product_type: (productType as any).id
            }
        });

        if (stock) {
            await this.createStockMovementTransactional(
                manager,
                (stock as any).id,
                userId,
                MovementType.OUT,
                worksheet.gabah_input,
                'WORKSHEET',
                worksheet.id,
                JSON.stringify({
                    type: 'PRODUCTION_INPUT',
                    productCode: inputProductCode,
                    process_step: worksheet.process_step
                })
            );
        }
    }

    private async addOutputStocksTransactional(manager: EntityManager, worksheet: any, userId: number, sideProducts: WorksheetSideProduct[]) {
        const StockModel = require('../../types/model/table/Stock').Stock;
        const OutputProductModel = require('../../types/model/table/OutputProduct').OutputProduct;
        const ProductTypeModel = require('../../types/model/table/ProductType').ProductType;

        // 1. Main Output
        let outputCode = '';
        if (worksheet.id_output_product && worksheet.beras_output > 0) {
            const op = await manager.findOne(OutputProductModel, { where: { id: worksheet.id_output_product } });
            if (op) outputCode = (op as any).code;
        } else if (worksheet.beras_output > 0) {
            outputCode = worksheet.process_step === PROCESS_STEPS.DRYING ? 'GKG' :
                worksheet.process_step === PROCESS_STEPS.HUSKING ? 'PK' :
                    worksheet.process_step === PROCESS_STEPS.STONE_POLISHING ? 'GLOSOR' : 'BRS-P';
        }

        if (outputCode) {
            const pt = await manager.findOne(ProductTypeModel, { where: { code: outputCode } });
            if (pt) {
                const ptId = (pt as any).id;
                let stock = await manager.findOne(StockModel, {
                    where: {
                        id_factory: worksheet.id_factory,
                        id_product_type: ptId
                    }
                });

                if (!stock) {
                    const newStock = new StockModel();
                    newStock.id_factory = worksheet.id_factory;
                    newStock.id_product_type = ptId;
                    newStock.quantity = 0;
                    newStock.unit = (pt as any).unit;
                    stock = await manager.save(StockModel, newStock);
                }

                await this.createStockMovementTransactional(
                    manager,
                    (stock as any).id,
                    userId,
                    MovementType.IN,
                    worksheet.beras_output,
                    'WORKSHEET',
                    worksheet.id,
                    JSON.stringify({
                        type: 'PRODUCTION_OUTPUT',
                        productCode: outputCode,
                        output_type: 'main',
                        batch_code: worksheet.batch_code
                    })
                );
            }
        }

        // 2. Side Products
        for (const sp of sideProducts) {
            if (sp.quantity > 0) {
                const pt = await manager.findOne(ProductTypeModel, { where: { code: sp.product_code } });
                if (pt) {
                    const ptId = (pt as any).id;
                    let stock = await manager.findOne(StockModel, {
                        where: {
                            id_factory: worksheet.id_factory,
                            id_product_type: ptId
                        }
                    });

                    if (!stock) {
                        const newStock = new StockModel();
                        newStock.id_factory = worksheet.id_factory;
                        newStock.id_product_type = ptId;
                        newStock.quantity = 0;
                        newStock.unit = (pt as any).unit;
                        stock = await manager.save(StockModel, newStock);
                    }

                    await this.createStockMovementTransactional(
                        manager,
                        (stock as any).id,
                        userId,
                        MovementType.IN,
                        sp.quantity,
                        'WORKSHEET',
                        worksheet.id,
                        JSON.stringify({
                            type: 'PRODUCTION_OUTPUT',
                            productCode: sp.product_code,
                            output_type: 'side_product',
                            batch_code: worksheet.batch_code
                        })
                    );
                }
            }
        }
    }

    /**
     * Calculate rendemen (yield percentage)
     */
    calculateRendemen(input: number, output: number): number {
        if (input <= 0) return 0;
        return (output / input) * 100;
    }

    /**
     * Update stock based on production process (Legacy / Fallback)
     */
    private async updateStockFromProduction(worksheet: any, userId: number): Promise<void> {
        const factoryId = worksheet.id_factory;
        const worksheetId = worksheet.id;
        const inputProductCode = worksheet.input_category_code || 'GKP';

        await stockService.updateStock({
            factoryId,
            productCode: inputProductCode,
            quantity: worksheet.gabah_input,
            movementType: MovementType.OUT,
            userId,
            referenceType: 'WORKSHEET',
            referenceId: worksheetId,
            notes: JSON.stringify({
                type: 'PRODUCTION_INPUT',
                productCode: inputProductCode,
                process_step: worksheet.process_step
            })
        });
    }

    /**
     * Add output stocks based on output product and side products
     */
    private async addOutputStocks(worksheet: any, userId: number, sideProducts: WorksheetSideProduct[]): Promise<void> {
        const factoryId = worksheet.id_factory;
        const worksheetId = worksheet.id;

        // 1. Main Product Output
        if (worksheet.id_output_product && worksheet.beras_output > 0) {
            const outputProduct = await OutputProduct.findOne({ where: { id: worksheet.id_output_product } });
            if (outputProduct) {
                await stockService.updateStock({
                    factoryId,
                    productCode: outputProduct.code,
                    quantity: worksheet.beras_output,
                    movementType: MovementType.IN,
                    userId,
                    referenceType: 'WORKSHEET',
                    referenceId: worksheetId,
                    notes: JSON.stringify({
                        type: 'PRODUCTION_OUTPUT',
                        productCode: outputProduct.code,
                        output_type: 'main',
                        batch_code: worksheet.batch_code
                    })
                });
            }
        } else if (worksheet.beras_output > 0) {
            // Fallback for legacy (if no output product selected but output exists)
            // Use legacy switch logic for 'beras' approximation
            const defaultCode = worksheet.process_step === PROCESS_STEPS.DRYING ? 'GKG' :
                worksheet.process_step === PROCESS_STEPS.HUSKING ? 'PK' :
                    worksheet.process_step === PROCESS_STEPS.STONE_POLISHING ? 'GLOSOR' : 'BRS-P';

            await stockService.updateStock({
                factoryId,
                productCode: defaultCode,
                quantity: worksheet.beras_output,
                movementType: MovementType.IN,
                userId,
                referenceType: 'WORKSHEET',
                referenceId: worksheetId,
                notes: JSON.stringify({
                    type: 'PRODUCTION_OUTPUT',
                    productCode: defaultCode,
                    output_type: 'main_legacy',
                    batch_code: worksheet.batch_code
                })
            });
        }

        // 2. Side Products Output
        if (sideProducts.length > 0) {
            for (const sp of sideProducts) {
                if (sp.quantity > 0) {
                    await stockService.updateStock({
                        factoryId,
                        productCode: sp.product_code,
                        quantity: sp.quantity,
                        movementType: MovementType.IN,
                        userId,
                        referenceType: 'WORKSHEET',
                        referenceId: worksheetId,
                        notes: JSON.stringify({
                            type: 'PRODUCTION_OUTPUT',
                            productCode: sp.product_code,
                            output_type: 'side_product',
                            batch_code: worksheet.batch_code
                        })
                    });
                }
            }
        }
    }

    /**
     * Revert all output stocks for a worksheet (used during Edit)
     */
    /**
     * Revert all output stocks for a worksheet (used during Edit) - Transactional
     */
    private async revertOutputStocksTransactional(manager: EntityManager, worksheetId: number): Promise<void> {
        const StockModel = require('../../types/model/table/Stock').Stock;

        // Find all movements created by this worksheet for OUTPUTS
        const movements = await manager.find(StockMovement, {
            where: {
                reference_type: 'WORKSHEET',
                reference_id: worksheetId,
                movement_type: MovementType.IN
            }
        });

        for (const move of movements) {
            // Reverse the stock impact: Deduct the quantity back
            const stock = await manager.findOne(StockModel, { where: { id: move.id_stock } }) as any;
            if (stock) {
                // Decrease quantity (revert IN)
                stock.quantity = Number(stock.quantity) - Number(move.quantity);
                await manager.save(StockModel, stock);
                // Delete the movement record
                await manager.remove(StockMovement, move);
            }
        }
    }

    /**
     * Update existing worksheet
     */
    /**
     * Update existing worksheet
     */
    async updateWorksheet(dto: UpdateWorksheetDTO): Promise<Worksheet> {
        return await AppDataSource.transaction(async (manager: EntityManager) => {
            const worksheet = await manager.findOne(Worksheet, { where: { id: dto.id } }) as any;

            if (!worksheet) {
                throw new NotFoundError('Worksheet', dto.id);
            }

            // Update fields if provided
            if (dto.worksheet_date) worksheet.worksheet_date = new Date(dto.worksheet_date);
            if (dto.shift) worksheet.shift = dto.shift;
            if (dto.gabah_input !== undefined) worksheet.gabah_input = dto.gabah_input;
            if (dto.beras_output !== undefined) worksheet.beras_output = dto.beras_output;
            if (dto.menir_output !== undefined) worksheet.menir_output = dto.menir_output;
            if (dto.dedak_output !== undefined) worksheet.dedak_output = dto.dedak_output;
            if (dto.sekam_output !== undefined) worksheet.sekam_output = dto.sekam_output;
            if (dto.machine_hours !== undefined) worksheet.machine_hours = dto.machine_hours;
            if (dto.downtime_hours !== undefined) worksheet.downtime_hours = dto.downtime_hours;
            if (dto.downtime_reason !== undefined) worksheet.downtime_reason = dto.downtime_reason;
            if (dto.notes !== undefined) worksheet.notes = dto.notes;

            // Extended fields
            if (dto.id_machine !== undefined) worksheet.id_machine = dto.id_machine;
            if (dto.id_output_product !== undefined) worksheet.id_output_product = dto.id_output_product;
            if (dto.batch_code !== undefined) worksheet.batch_code = dto.batch_code;
            if (dto.raw_material_cost !== undefined) worksheet.raw_material_cost = dto.raw_material_cost;
            if (dto.side_product_revenue !== undefined) worksheet.side_product_revenue = dto.side_product_revenue;
            if (dto.hpp !== undefined) worksheet.hpp = dto.hpp;
            if (dto.hpp_per_kg !== undefined) worksheet.hpp_per_kg = dto.hpp_per_kg;

            // Recalculate rendemen
            worksheet.rendemen = this.calculateRendemen(worksheet.gabah_input, worksheet.beras_output);
            worksheet.updated_at = new Date();

            await manager.save(Worksheet, worksheet);

            // Handle Side Products Update (Replace and Re-sync Stock)
            if (dto.side_products) {
                // 1. Revert previous output stocks
                await this.revertOutputStocksTransactional(manager, worksheet.id);

                // 2. Delete existing detailed records
                await manager.delete(WorksheetSideProduct, { id_worksheet: worksheet.id });

                // 3. Create new detailed records
                const savedSideProducts: WorksheetSideProduct[] = [];
                for (const spDto of dto.side_products) {
                    const sp = new WorksheetSideProduct();
                    sp.id_worksheet = worksheet.id;
                    sp.product_code = spDto.product_code;
                    sp.product_name = spDto.product_name;
                    sp.quantity = spDto.quantity;
                    sp.unit_price = spDto.unit_price;
                    sp.total_value = spDto.quantity * (spDto.unit_price || 0);
                    sp.is_auto_calculated = spDto.is_auto_calculated;
                    sp.auto_percentage = spDto.auto_percentage;
                    await manager.save(WorksheetSideProduct, sp);
                    savedSideProducts.push(sp);
                }

                // 4. Apply new output stocks
                // Note: We use the *updated* worksheet data (from memory entity)
                await this.addOutputStocksTransactional(manager, worksheet, worksheet.id_user, savedSideProducts);
            }

            return worksheet;
        });
    }

    /**
     * Delete worksheet
     */
    async deleteWorksheet(id: number): Promise<boolean> {
        // Should also revert stocks? Ideally yes.
        // For now just delete record.
        return await worksheetRepository.delete(id);
    }

    /**
     * Get worksheet by ID
     */
    async getWorksheetById(id: number): Promise<Worksheet> {
        const worksheet = await worksheetRepository.findById(id);
        if (!worksheet) {
            throw new NotFoundError('Worksheet', id);
        }
        return worksheet;
    }

    /**
     * Get all worksheets with filters
     */
    async getWorksheets(params: {
        limit?: number;
        offset?: number;
        id_factory?: number;
        start_date?: string;
        end_date?: string;
    }): Promise<{ worksheets: Worksheet[], total: number }> {
        return await worksheetRepository.findWithFilters({
            ...params,
            start_date: params.start_date ? new Date(params.start_date) : undefined,
            end_date: params.end_date ? new Date(params.end_date) : undefined
        });
    }

    /**
     * Get production statistics for a factory
     */
    async getProductionStats(
        factoryId: number,
        startDate?: string,
        endDate?: string
    ): Promise<ProductionStats> {
        return await worksheetRepository.getProductionStats(
            factoryId,
            startDate ? new Date(startDate) : undefined,
            endDate ? new Date(endDate) : undefined
        );
    }

    /**
     * Calculate estimated yield based on process step
     */
    estimateYield(processStep: string, inputWeight: number): number {
        const yieldRates: Record<string, number> = {
            [PROCESS_STEPS.DRYING]: 0.85,        // 85% yield for drying
            [PROCESS_STEPS.HUSKING]: 0.78,       // 78% yield for husking
            [PROCESS_STEPS.STONE_POLISHING]: 0.92 // 92% yield for polishing
        };

        const rate = yieldRates[processStep] || 0.65; // Default 65%
        return inputWeight * rate;
    }
}

// Singleton instance
export const worksheetService = new WorksheetService();
