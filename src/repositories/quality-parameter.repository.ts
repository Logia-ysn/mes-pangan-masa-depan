import { BaseRepository } from './base.repository';
import { QualityParameter } from '../../types/model/table/QualityParameter';
import { FindManyOptions } from 'typeorm';

export class QualityParameterRepository extends BaseRepository<QualityParameter> {
    protected entity = QualityParameter;

    async findByName(name: string): Promise<QualityParameter[]> {
        return await QualityParameter.find({
            where: { name, is_active: true },
            order: { grade: 'ASC' }
        });
    }

    async findByVariety(varietyId: number): Promise<QualityParameter[]> {
        return await QualityParameter.find({
            where: { id_variety: varietyId, is_active: true },
            order: { grade: 'ASC' }
        });
    }

    async findAllActive(): Promise<QualityParameter[]> {
        return await QualityParameter.find({
            where: { is_active: true },
            order: { name: 'ASC', grade: 'ASC' }
        });
    }
}

export const qualityParameterRepository = new QualityParameterRepository();
