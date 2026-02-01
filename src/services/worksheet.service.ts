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
        // Create worksheet entity
        const worksheet = new Worksheet();
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

        // New PMD 1 fields
        worksheet.input_batch_id = dto.input_batch_id;
        worksheet.id_machine = dto.id_machine;
        worksheet.input_category_code = dto.input_category_code;
        worksheet.process_step = dto.process_step;
        worksheet.production_cost = dto.production_cost || 0;

        // Enhancement fields (HPP Calculation)
        worksheet.id_output_product = dto.id_output_product;
        worksheet.process_steps = dto.process_steps;
        worksheet.batch_code = dto.batch_code;
        worksheet.raw_material_cost = dto.raw_material_cost || 0;
        worksheet.side_product_revenue = dto.side_product_revenue || 0;
        worksheet.hpp = dto.hpp || 0;
        worksheet.hpp_per_kg = dto.hpp_per_kg || 0;

        // Calculate rendemen (yield percentage)
        worksheet.rendemen = this.calculateRendemen(dto.gabah_input, dto.beras_output);

        // Save worksheet
        await worksheet.save();

        // Handle Input Batches
        if (dto.input_batches && dto.input_batches.length > 0) {
            for (const batchDto of dto.input_batches) {
                const batch = new WorksheetInputBatch();
                batch.id_worksheet = worksheet.id;
                batch.id_stock = batchDto.id_stock;
                batch.quantity = batchDto.quantity;
                batch.unit_price = batchDto.unit_price || 0;
                batch.total_cost = (batchDto.quantity) * (batchDto.unit_price || 0);
                await batch.save();

                // Deduct stock for this specific batch
                const stock = await stockRepository.findById(batchDto.id_stock);
                if (stock && stock.otm_id_product_type) {
                    await stockService.updateStock({
                        factoryId: dto.id_factory,
                        productCode: stock.otm_id_product_type.code,
                        quantity: batchDto.quantity,
                        movementType: MovementType.OUT,
                        userId: dto.id_user,
                        referenceType: 'WORKSHEET',
                        referenceId: worksheet.id,
                        notes: JSON.stringify({
                            type: 'PRODUCTION_INPUT_BATCH',
                            productCode: stock.otm_id_product_type.code,
                            batch_id: batch.id,
                            batch_code: worksheet.batch_code
                        })
                    });
                }
            }
        } else {
            // Fallback to old logic if no input_batches provided (backward compatibility)
            await this.updateStockFromProduction(worksheet, dto.id_user);
        }

        // Handle Side Products
        const savedSideProducts: WorksheetSideProduct[] = [];
        if (dto.side_products && dto.side_products.length > 0) {
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
                await sp.save();
                savedSideProducts.push(sp);
            }
        }

        // Add output stocks based on configured Output Product and Side Products
        await this.addOutputStocks(worksheet, dto.id_user, savedSideProducts);

        return worksheet;
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
    private async updateStockFromProduction(worksheet: Worksheet, userId: number): Promise<void> {
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
    private async addOutputStocks(worksheet: Worksheet, userId: number, sideProducts: WorksheetSideProduct[]): Promise<void> {
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
    private async revertOutputStocks(worksheetId: number): Promise<void> {
        // Find all movements created by this worksheet for OUTPUTS
        // We look for movements where reference_id = worksheetId AND movement_type = IN
        // Ideally checking notes for 'PRODUCTION_OUTPUT' is safer but IN + WORKSHEET Ref is sufficient for now
        const movements = await StockMovement.find({
            where: {
                reference_type: 'WORKSHEET',
                reference_id: worksheetId,
                movement_type: MovementType.IN
            }
        });

        for (const move of movements) {
            // Reverse the stock impact: Deduct the quantity back
            // We need to fetch the Stock entity to update it
            const stock = await stockRepository.findById(move.id_stock);
            if (stock) {
                // Decrease quantity (revert IN)
                stock.quantity = Number(stock.quantity) - Number(move.quantity);
                await stock.save();
                // Delete the movement record
                await move.remove();
            }
        }
    }

    /**
     * Update existing worksheet
     */
    async updateWorksheet(dto: UpdateWorksheetDTO): Promise<Worksheet> {
        const worksheet = await worksheetRepository.findById(dto.id);

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

        await worksheet.save();

        // Handle Side Products Update (Replace and Re-sync Stock)
        if (dto.side_products) {
            // 1. Revert previous output stocks
            await this.revertOutputStocks(worksheet.id);

            // 2. Delete existing detailed records
            await WorksheetSideProduct.delete({ id_worksheet: worksheet.id });

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
                await sp.save();
                savedSideProducts.push(sp);
            }

            // 4. Apply new output stocks
            // Note: We use the *updated* worksheet data (from memory entity)
            await this.addOutputStocks(worksheet, worksheet.id_user, savedSideProducts);
        }

        return worksheet;
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
