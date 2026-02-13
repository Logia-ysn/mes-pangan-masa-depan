/**
 * Quality Analysis Repository
 * Handles all database operations for RawMaterialQualityAnalysis entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { RawMaterialQualityAnalysis } from '@prisma/client';

export class QualityAnalysisRepository extends BaseRepository<RawMaterialQualityAnalysis> {
    protected modelName = 'RawMaterialQualityAnalysis';

    async findByBatchId(batchId: string): Promise<RawMaterialQualityAnalysis | null> {
        return await this.model.findFirst({
            where: { batch_id: batchId }
        });
    }

    async findByStockMovement(stockMovementId: number): Promise<RawMaterialQualityAnalysis | null> {
        return await this.model.findFirst({
            where: { id_stock_movement: stockMovementId }
        });
    }
}

// Singleton instance
export const qualityAnalysisRepository = new QualityAnalysisRepository();
