
import { prisma } from './src/libs/prisma';

const seed = async () => {
    const configs = [
        // KW 1
        { name: 'Moisture', grade: 'KW 1', level: 1, min_value: 20.0, max_value: 21.9, unit: 'percentage', id_variety: null },
        { name: 'Moisture', grade: 'KW 1', level: 2, min_value: 22.0, max_value: 22.9, unit: 'percentage', id_variety: null },
        { name: 'Moisture', grade: 'KW 1', level: 3, min_value: 23.0, max_value: 23.9, unit: 'percentage', id_variety: null },

        // KW 2
        { name: 'Moisture', grade: 'KW 2', level: 1, min_value: 24.0, max_value: 24.9, unit: 'percentage', id_variety: null },
        { name: 'Moisture', grade: 'KW 2', level: 2, min_value: 25.0, max_value: 25.9, unit: 'percentage', id_variety: null },
        { name: 'Moisture', grade: 'KW 2', level: 3, min_value: 26.0, max_value: 26.9, unit: 'percentage', id_variety: null },

        // KW 3
        { name: 'Moisture', grade: 'KW 3', level: 1, min_value: 27.0, max_value: 27.9, unit: 'percentage', id_variety: null },
        { name: 'Moisture', grade: 'KW 3', level: 2, min_value: 28.0, max_value: 28.9, unit: 'percentage', id_variety: null },
        { name: 'Moisture', grade: 'KW 3', level: 3, min_value: 29.0, max_value: 29.9, unit: 'percentage', id_variety: null },

        // Reject (> 30%) - Using 'REJECT' to match system logic in QualityAnalysisModal
        { name: 'Moisture', grade: 'REJECT', level: 0, min_value: 30.0, max_value: 100.0, unit: 'percentage', id_variety: null },
    ];

    console.log('Seeding Moisture Level Configurations (General)...');

    for (const c of configs) {
        // Check if exact config exists (name + grade + level + variety)
        const exists = await prisma.qualityParameter.findFirst({
            where: {
                name: c.name,
                grade: c.grade,
                level: c.level,
                id_variety: c.id_variety
            }
        });

        if (!exists) {
            await prisma.qualityParameter.create({ data: c });
            console.log(`Created: ${c.name} ${c.grade} Level ${c.level} (${c.min_value}% - ${c.max_value}%)`);
        } else {
            // Update existing values
            await prisma.qualityParameter.update({
                where: { id: exists.id },
                data: {
                    min_value: c.min_value,
                    max_value: c.max_value,
                    unit: c.unit
                }
            });
            console.log(`Updated: ${c.name} ${c.grade} Level ${c.level} (${c.min_value}% - ${c.max_value}%)`);
        }
    }

    console.log('Successfully seeded Moisture levels.');
    await prisma.$disconnect();
    process.exit(0);
};

seed().catch(err => {
    console.error('Seed failed:', err);
    process.exit(1);
});
