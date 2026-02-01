import { QualityParameter } from '../../types/model/table/QualityParameter';
import { qualityParameterRepository } from '../repositories/quality-parameter.repository';

export interface CreateQualityParamDTO {
    name: string;
    grade: string;
    min_value: number;
    max_value: number;
    unit: string;
    id_variety?: number;
    level?: number;
}

class QualityParameterService {
    async getAll(): Promise<QualityParameter[]> {
        return await qualityParameterRepository.findAll();
    }

    async getByVariety(varietyId: number): Promise<QualityParameter[]> {
        return await qualityParameterRepository.findByVariety(varietyId);
    }

    async create(dto: CreateQualityParamDTO): Promise<QualityParameter> {
        return await qualityParameterRepository.create(dto);
    }

    async update(id: number, dto: Partial<CreateQualityParamDTO>): Promise<QualityParameter> {
        return await qualityParameterRepository.update(id, dto);
    }

    async delete(id: number): Promise<boolean> {
        return await qualityParameterRepository.delete(id);
    }

    /**
     * Initializes default parameters if none exist
     */
    async seedDefaults() {
        const count = await qualityParameterRepository.count();
        if (count === 0) {
            // Moisture Defaults
            await this.create({ name: 'Moisture', grade: 'KW 1', min_value: 21, max_value: 23, unit: 'percentage' });
            await this.create({ name: 'Moisture', grade: 'KW 2', min_value: 24, max_value: 26, unit: 'percentage' });
            await this.create({ name: 'Moisture', grade: 'KW 3', min_value: 27, max_value: 30, unit: 'percentage' });

            // Density Defaults (Generic)
            await this.create({ name: 'Density', grade: 'KW 1', min_value: 0.78, max_value: 0.80, unit: 'g/L' });
            await this.create({ name: 'Density', grade: 'KW 2', min_value: 0.75, max_value: 0.77, unit: 'g/L' });
            await this.create({ name: 'Density', grade: 'KW 3', min_value: 0.72, max_value: 0.74, unit: 'g/L' });

            console.log('Seeded default quality parameters');
        }
    }
}

export const qualityParameterService = new QualityParameterService();
