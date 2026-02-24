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
    empty_weight?: number;
    // New visual analysis fields
    damaged_percentage?: number;
    rotten_percentage?: number;
    defect_percentage?: number;
}

class QualityAnalysisService {

    /**
     * Analyze and save quality data
     */
    async analyzeAndSave(dto: SubmitAnalysisDTO): Promise<RawMaterialQualityAnalysis> {
        // 1. Calculate Grades
        const moistureGrade = await this.calculateGrade('Moisture', dto.moisture_value, dto.variety_id);
        const densityGrade = await this.calculateGrade('Density', dto.density_value, dto.variety_id);

        // Visual Analysis (Global Only) — uses defect_percentage when available
        let colorGrade = 'KW 1';
        const defectPct = dto.defect_percentage ?? ((dto.damaged_percentage ?? 0) + (dto.rotten_percentage ?? 0));

        if (defectPct > 0 || (dto.green_percentage !== undefined && dto.green_percentage > 0)) {
            colorGrade = this.calculateVisualGrade(
                dto.yellow_percentage ?? 100,
                dto.green_percentage ?? 0,
                defectPct
            );
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
            damaged_percentage: dto.damaged_percentage,
            rotten_percentage: dto.rotten_percentage,
            defect_percentage: defectPct > 0 ? defectPct : undefined,
            color_grade: colorGrade,
            image_url: dto.image_url,
            final_grade: finalGrade,
            empty_weight: dto.empty_weight,
            notes: dto.notes
        });
    }

    /**
     * Multi-dimensional visual grade calculation
     * Matches the ML service grading logic
     */
    private calculateVisualGrade(yellowPct: number, greenPct: number, defectPct: number): string {
        // Automatic reject for extreme defect levels
        if (defectPct > 25) return 'REJECT';

        // Grading rules: grade = worst-case across yellow, green, defect
        const rules = [
            { grade: 'KW 1', level: 1, minYellow: 95, maxDefect: 1, maxGreen: 2 },
            { grade: 'KW 1', level: 2, minYellow: 90, maxDefect: 2, maxGreen: 5 },
            { grade: 'KW 1', level: 3, minYellow: 85, maxDefect: 3, maxGreen: 8 },
            { grade: 'KW 2', level: 1, minYellow: 75, maxDefect: 5, maxGreen: 15 },
            { grade: 'KW 2', level: 2, minYellow: 65, maxDefect: 8, maxGreen: 20 },
            { grade: 'KW 2', level: 3, minYellow: 55, maxDefect: 10, maxGreen: 25 },
            { grade: 'KW 3', level: 1, minYellow: 0, maxDefect: 15, maxGreen: 100 },
            { grade: 'KW 3', level: 2, minYellow: 0, maxDefect: 25, maxGreen: 100 },
        ];

        for (const rule of rules) {
            if (yellowPct >= rule.minYellow && defectPct <= rule.maxDefect && greenPct <= rule.maxGreen) {
                return rule.grade;
            }
        }

        return 'KW 3';
    }

    /**
     * Calculate grade for a single parameter based on active config
     */
    private async calculateGrade(paramName: string, value: number, varietyId?: number): Promise<string> {
        // Fetch all params for this name
        let params: QualityParameter[] = [];

        // Visual parameters are ALWAYS global as per requirement
        const isVisualParam = ['Color', 'GreenPercentage'].includes(paramName);

        if (varietyId && !isVisualParam) {
            params = await qualityParameterRepository.findByVariety(varietyId);
            params = params.filter(p => p.name === paramName);
        }

        // Fallback to global params if specific not found, empty, or if it's a visual param
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
     * Worst Case Logic: REJECT < KW 3 < KW 2 < KW 1
     */
    private determineFinalGrade(grades: string[]): string {
        if (grades.includes('REJECT')) return 'REJECT';
        if (grades.includes('OUT_OF_RANGE')) return 'REJECT';
        if (grades.includes('KW 3')) return 'KW 3';
        if (grades.includes('KW 2')) return 'KW 2';
        if (grades.includes('KW 1')) return 'KW 1';
        return 'UNKNOWN';
    }
}

export const qualityAnalysisService = new QualityAnalysisService();
