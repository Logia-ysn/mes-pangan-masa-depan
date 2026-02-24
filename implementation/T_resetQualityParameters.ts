import { T_resetQualityParameters } from "../types/api/T_resetQualityParameters";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { prisma } from "../src/libs/prisma";

export const t_resetQualityParameters: T_resetQualityParameters = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');

    const defaultParams = [
        // Moisture parameters (3 grades x 3 levels) — Standar Global
        { name: 'Moisture', grade: 'KW 1', level: 1, min_value: 20, max_value: 21.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 1', level: 2, min_value: 22, max_value: 22.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 1', level: 3, min_value: 23, max_value: 23.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 2', level: 1, min_value: 24, max_value: 24.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 2', level: 2, min_value: 25, max_value: 25.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 2', level: 3, min_value: 26, max_value: 26.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 3', level: 1, min_value: 27, max_value: 27.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 3', level: 2, min_value: 28, max_value: 28.9, unit: '%' },
        { name: 'Moisture', grade: 'KW 3', level: 3, min_value: 29, max_value: 29.9, unit: '%' },

        // Density parameters (3 grades x 3 levels) — Standar Global (g/ml)
        { name: 'Density', grade: 'KW 1', level: 1, min_value: 0.67, max_value: 1.00, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 1', level: 2, min_value: 0.66, max_value: 0.669, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 1', level: 3, min_value: 0.65, max_value: 0.659, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 2', level: 1, min_value: 0.64, max_value: 0.649, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 2', level: 2, min_value: 0.63, max_value: 0.639, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 2', level: 3, min_value: 0.62, max_value: 0.629, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 3', level: 1, min_value: 0.61, max_value: 0.619, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 3', level: 2, min_value: 0.60, max_value: 0.609, unit: 'g/ml' },
        { name: 'Density', grade: 'KW 3', level: 3, min_value: 0.59, max_value: 0.599, unit: 'g/ml' },

        // Color parameters (3 grades x 3 levels)
        { name: 'Color', grade: 'KW 1', level: 1, min_value: 90, max_value: 100, unit: 'index' },
        { name: 'Color', grade: 'KW 1', level: 2, min_value: 85, max_value: 90, unit: 'index' },
        { name: 'Color', grade: 'KW 1', level: 3, min_value: 80, max_value: 85, unit: 'index' },
        { name: 'Color', grade: 'KW 2', level: 1, min_value: 70, max_value: 80, unit: 'index' },
        { name: 'Color', grade: 'KW 2', level: 2, min_value: 65, max_value: 70, unit: 'index' },
        { name: 'Color', grade: 'KW 2', level: 3, min_value: 60, max_value: 65, unit: 'index' },
        { name: 'Color', grade: 'KW 3', level: 1, min_value: 50, max_value: 60, unit: 'index' },
        { name: 'Color', grade: 'KW 3', level: 2, min_value: 40, max_value: 50, unit: 'index' },
        { name: 'Color', grade: 'KW 3', level: 3, min_value: 30, max_value: 40, unit: 'index' },
    ];

    await prisma.$transaction(async (tx) => {
        await tx.qualityParameter.deleteMany({});
        await tx.qualityParameter.createMany({ data: defaultParams });
    });

    return { message: `Parameters reset to defaults (${defaultParams.length} parameters created)` };
});
