/**
 * Quality Parameter Repository
 * Handles all database operations for QualityParameter entity using Prisma
 */

import { BaseRepository } from './base.repository';
import { QualityParameter } from '@prisma/client';

export class QualityParameterRepository extends BaseRepository<QualityParameter> {
    protected modelName = 'QualityParameter';

    async findByName(name: string): Promise<QualityParameter[]> {
        return await this.model.findMany({
            where: { name, is_active: true },
            orderBy: { grade: 'asc' }
        });
    }

    async findByVariety(varietyId: number): Promise<QualityParameter[]> {
        return await this.model.findMany({
            where: { id_variety: varietyId, is_active: true },
            orderBy: { grade: 'asc' }
        });
    }

    async findAllActive(): Promise<QualityParameter[]> {
        return await this.model.findMany({
            where: { is_active: true },
            orderBy: [
                { name: 'asc' },
                { grade: 'asc' }
            ]
        });
    }
}

// Singleton instance
export const qualityParameterRepository = new QualityParameterRepository();
