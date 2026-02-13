import { RawMaterialQualityAnalysis } from '@prisma/client';
import { qualityAnalysisRepository } from '../repositories/quality-analysis.repository';
import { qualityParameterRepository } from '../repositories/quality-parameter.repository';
import { QualityParameter } from '@prisma/client';

export interface SubmitAnalysisDTO {
    batch_id: string;
    id_stock_movement?: number;
    variety_id?: number; // Needed to fetch specific density config
    moisture_value: number;
    density_value: number;
    image_url?: string;
    notes?: string;
    // Manual overrides or auto-calculated color
    green_percentage?: number;
    yellow_percentage?: number;
}

class QualityAnalysisService {

    /**
     * Analyze and save quality data
     */
    async analyzeAndSave(dto: SubmitAnalysisDTO): Promise<RawMaterialQualityAnalysis> {
        // 1. Calculate Grades
        const moistureGrade = await this.calculateGrade('Moisture', dto.moisture_value, dto.variety_id);
        const densityGrade = await this.calculateGrade('Density', dto.density_value, dto.variety_id);

        // Color Grade Logic (Mock for now, or based on simple rule if % provided)
        let colorGrade = 'KW 1'; // Default valid
        if (dto.green_percentage && dto.yellow_percentage) {
            // Simple rule: High green = KW 2/3 (Unripe), High Yellow = KW 1 (Ripe)
            // Based on Green %: < 2% = KW 1, 2-5% = KW 2, >5% = KW 3.
            if (dto.green_percentage > 5) colorGrade = 'KW 3';
            else if (dto.green_percentage > 2) colorGrade = 'KW 2';
            else colorGrade = 'KW 1';
        }

        // 2. Determine Final Grade (Worst Case)
        const finalGrade = this.determineFinalGrade([moistureGrade, densityGrade, colorGrade]);

        // 3. Save to DB
        return await qualityAnalysisRepository.create({
            batch_id: dto.batch_id,
            id_stock_movement: dto.id_stock_movement,
            moisture_value: dto.moisture_value,
            moisture_grade: moistureGrade,
            density_value: dto.density_value,
            density_grade: densityGrade,
            green_percentage: dto.green_percentage,
            yellow_percentage: dto.yellow_percentage,
            color_grade: colorGrade,
            image_url: dto.image_url,
            final_grade: finalGrade,
            notes: dto.notes
        });
    }

    /**
     * Calculate grade for a single parameter based on active config
     */
    private async calculateGrade(paramName: string, value: number, varietyId?: number): Promise<string> {
        // Fetch all params for this name
        let params: QualityParameter[] = [];

        if (varietyId) {
            params = await qualityParameterRepository.findByVariety(varietyId);
            params = params.filter(p => p.name === paramName);
        }

        // Fallback to global params if specific not found or empty
        if (params.length === 0) {
            params = await qualityParameterRepository.findByName(paramName);
            params = params.filter(p => !p.id_variety);
        }

        if (params.length === 0) return 'UNKNOWN';

        // Check ranges
        for (const p of params) {
            const min = p.min_value !== null ? Number(p.min_value) : -Infinity;
            const max = p.max_value !== null ? Number(p.max_value) : Infinity;

            if (value >= min && value <= max) {
                return p.grade;
            }
        }

        return 'OUT_OF_RANGE';
    }

    /**
     * Worst Case Logic: KW 3 < KW 2 < KW 1
     */
    private determineFinalGrade(grades: string[]): string {
        if (grades.includes('OUT_OF_RANGE')) return 'REJECT';
        if (grades.includes('KW 3')) return 'KW 3';
        if (grades.includes('KW 2')) return 'KW 2';
        if (grades.includes('KW 1')) return 'KW 1';
        return 'UNKNOWN';
    }
}

export const qualityAnalysisService = new QualityAnalysisService();
