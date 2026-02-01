
import { AppDataSource } from './data-source';
import { QualityParameter } from './types/model/table/QualityParameter';

const seed = async () => {
    await AppDataSource.initialize();

    const repo = AppDataSource.getRepository(QualityParameter);

    // Initial Calibration Configs
    // Using the tuned values:
    // Green: Hue 25-95, Sat 25-255, Val 40-255
    // Yellow: Hue 10-25, Sat 40-255, Val 40-255

    const configs = [
        { name: 'Calib_Green_Hue', grade: 'ALL', level: 1, min_value: 25, max_value: 95, unit: 'range' },
        { name: 'Calib_Green_Sat', grade: 'ALL', level: 1, min_value: 25, max_value: 255, unit: 'range' },
        { name: 'Calib_Green_Val', grade: 'ALL', level: 1, min_value: 40, max_value: 255, unit: 'range' },

        { name: 'Calib_Yellow_Hue', grade: 'ALL', level: 1, min_value: 10, max_value: 25, unit: 'range' },
        { name: 'Calib_Yellow_Sat', grade: 'ALL', level: 1, min_value: 40, max_value: 255, unit: 'range' },
        { name: 'Calib_Yellow_Val', grade: 'ALL', level: 1, min_value: 40, max_value: 255, unit: 'range' },
    ];

    for (const c of configs) {
        // Check if exists
        const exists = await repo.findOne({ where: { name: c.name } });
        if (!exists) {
            await repo.save(repo.create(c));
            console.log(`Created: ${c.name}`);
        } else {
            console.log(`Exists: ${c.name}`);
        }
    }

    process.exit(0);
};

seed();
