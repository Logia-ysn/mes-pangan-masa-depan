import { BaseRepository } from './base.repository';
import { RawMaterialQualityAnalysis } from '../../types/model/table/RawMaterialQualityAnalysis';

export class QualityAnalysisRepository extends BaseRepository<RawMaterialQualityAnalysis> {
    protected entity = RawMaterialQualityAnalysis;

    async findByBatchId(batchId: string): Promise<RawMaterialQualityAnalysis | null> {
        return await RawMaterialQualityAnalysis.findOne({
            where: { batch_id: batchId }
        });
    }

    async findByStockMovement(stockMovementId: number): Promise<RawMaterialQualityAnalysis | null> {
        return await RawMaterialQualityAnalysis.findOne({
            where: { id_stock_movement: stockMovementId }
        });
    }
}

export const qualityAnalysisRepository = new QualityAnalysisRepository();
