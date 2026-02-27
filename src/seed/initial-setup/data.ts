/**
 * DATA SETUP AWAL - Initial Setup Data
 * =====================================
 * File ini berisi semua data master awal yang perlu ada di sistem.
 * Data ini akan di-generate otomatis saat hard reset.
 * 
 * Meliputi:
 * - Factories (PMD 1, PMD 2)
 * - Users (9 users)
 * - Raw Material Categories
 * - Rice Varieties
 * - Rice Levels
 * - Rice Brands
 * - Quality Parameters (Moisture, Density, Color)
 */

export const INITIAL_FACTORIES = [
    { code: 'PMD-1', name: 'PMD 1', address: 'Jl. Raya Padi No.1, Karawang', batch_code_prefix: 'P1' },
    { code: 'PMD-2', name: 'PMD 2', address: 'Jl. Raya Beras No.2, Karawang', batch_code_prefix: 'P2' },
];

export const INITIAL_USERS = [
    { email: 'root@pangan.com', password: 'root123', role: 'SUPERUSER', fullname: 'Root User' },
    { email: 'admin@pangan.com', password: 'admin123', role: 'ADMIN', fullname: 'Admin PMD' },
    { email: 'ysn@pangnamasadepan.com', password: 'P4nganterdepan!', role: 'MANAGER', fullname: 'Ysn Manager' },
    { email: 'feri@panganmasadepan.com', password: 'P4nganterdepan!', role: 'OPERATOR', fullname: 'Feri Operator' },
    { email: 'wahyu@panganmasadepan.com', password: 'P4nganterdepan!', role: 'OPERATOR', fullname: 'Wahyu Operator' },
    { email: 'adi@panganmasadepan.com', password: 'P4nganterdepan!', role: 'OPERATOR', fullname: 'Adi Operator' },
    { email: 'keungan@panganmasadepan.com', password: 'P4nganterdepan!', role: 'OPERATOR', fullname: 'Keuangan Operator' },
    { email: 'bambang.s@panganmasadepan.com', password: 'P4nganterdepan!', role: 'DIRECTOR', fullname: 'Bambang S Director' },
    { email: 'ycindiany@panganmasadepan.com', password: 'P4nganterdepan!', role: 'BOD', fullname: 'Y Cindiany BOD' },
];

export const INITIAL_RAW_MATERIAL_CATEGORIES = [
    { code: 'GKP', name: 'Padi Basah', description: 'Gabah Kering Panen' },
    { code: 'GKG', name: 'Padi Kering', description: 'Gabah Kering Giling' },
];

export const INITIAL_RICE_VARIETIES = [
    { code: '32', name: '32', description: 'International Rice' },
    { code: '64', name: '64', description: 'International Rice' },
    { code: 'KEBO', name: 'Kebo', description: 'Bojeng' },
    { code: 'MUNCUL', name: 'Muncul', description: 'Muncul' },
    { code: 'KETAN', name: 'Ketan', description: 'Ketan' },
    { code: 'MR', name: 'MR', description: 'Malaysian Rice' },
];

export const INITIAL_RICE_LEVELS = [
    { code: 'PK', name: 'Pecah Kulit', sort_order: 6 },
    { code: 'GLO', name: 'Glosor', sort_order: 5 },
    { code: 'MED', name: 'Medium', sort_order: 4 },
    { code: 'MED-S', name: 'Medium Super', sort_order: 3 },
    { code: 'PRM', name: 'Premium', sort_order: 2 },
    { code: 'PRM-S', name: 'Premium Super', sort_order: 1 },
];

export const INITIAL_RICE_BRANDS = [
    { code: 'WLM', name: 'Walemu' },
    { code: 'CR', name: 'Cruise' },
    { code: 'DK', name: 'Doa Kyai' },
    { code: 'PJ', name: 'Pagi Jaya' },
];

export const INITIAL_BY_PRODUCTS = [
    { code: 'BRK-B', name: 'Broken Besar', description: 'By Product - Broken Besar' },
    { code: 'BRK-K', name: 'Broken Kecil', description: 'By Product - Broken Kecil' },
    { code: 'BKT', name: 'Bekatul', description: 'By Product - Bekatul' },
    { code: 'RJC', name: 'Riject', description: 'By Product - Riject' },
    { code: 'SKM', name: 'Sekam', description: 'By Product - Sekam' },
];

export const INITIAL_QUALITY_PARAMETERS = [
    // Moisture — Standar Global
    { name: 'Moisture', grade: 'KW 1', level: 1, min_value: 20, max_value: 21.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 1', level: 2, min_value: 22, max_value: 22.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 1', level: 3, min_value: 23, max_value: 23.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 2', level: 1, min_value: 24, max_value: 24.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 2', level: 2, min_value: 25, max_value: 25.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 2', level: 3, min_value: 26, max_value: 26.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 3', level: 1, min_value: 27, max_value: 27.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 3', level: 2, min_value: 28, max_value: 28.9, unit: '%' },
    { name: 'Moisture', grade: 'KW 3', level: 3, min_value: 29, max_value: 29.9, unit: '%' },

    // Density — Standar Global (g/ml)
    { name: 'Density', grade: 'KW 1', level: 1, min_value: 0.67, max_value: 1.00, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 1', level: 2, min_value: 0.66, max_value: 0.669, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 1', level: 3, min_value: 0.65, max_value: 0.659, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 2', level: 1, min_value: 0.64, max_value: 0.649, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 2', level: 2, min_value: 0.63, max_value: 0.639, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 2', level: 3, min_value: 0.62, max_value: 0.629, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 3', level: 1, min_value: 0.61, max_value: 0.619, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 3', level: 2, min_value: 0.60, max_value: 0.609, unit: 'g/ml' },
    { name: 'Density', grade: 'KW 3', level: 3, min_value: 0.59, max_value: 0.599, unit: 'g/ml' },

    // Color
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
