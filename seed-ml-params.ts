
import { prisma } from './src/libs/prisma';

const seed = async () => {
    // Initial ML Configs
    // KW 1: Level 1 (< 3%), Level 2 (< 5%), Level 3 (< 10%)
    // KW 2: Level 1 (< 15%), Level 2 (< 20%)
    // KW 3: Level 1 (> 20%)

    const configs = [
        { name: 'GreenPercentage', grade: 'KW 1', level: 1, min_value: 0, max_value: 3, unit: 'percentage' },
        { name: 'GreenPercentage', grade: 'KW 1', level: 2, min_value: 3, max_value: 5, unit: 'percentage' },
        { name: 'GreenPercentage', grade: 'KW 1', level: 3, min_value: 5, max_value: 10, unit: 'percentage' },
        { name: 'GreenPercentage', grade: 'KW 2', level: 1, min_value: 10, max_value: 15, unit: 'percentage' },
        { name: 'GreenPercentage', grade: 'KW 2', level: 2, min_value: 15, max_value: 20, unit: 'percentage' },
        { name: 'GreenPercentage', grade: 'KW 3', level: 1, min_value: 20, max_value: 100, unit: 'percentage' },
    ];

    for (const c of configs) {
        // Check if exists
        const exists = await prisma.qualityParameter.findFirst({
            where: { name: c.name, grade: c.grade, level: c.level }
        });
        if (!exists) {
            await prisma.qualityParameter.create({ data: c });
            console.log(`Created: ${c.grade} Level ${c.level}`);
        } else {
            console.log(`Exists: ${c.grade} Level ${c.level}`);
        }
    }

    await prisma.$disconnect();
    process.exit(0);
};

seed();
