
import { T_createRawMaterialCategory } from "../types/api/T_createRawMaterialCategory";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { rawMaterialCategoryRepository } from "../src/repositories/raw-material-category.repository";

export const t_createRawMaterialCategory: T_createRawMaterialCategory = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const { code, name, description } = req.body;

    const existing = await rawMaterialCategoryRepository.findOne({ where: { code } });
    if (existing) {
        throw new Error(`Kode Kategori "${code}" sudah digunakan. Gunakan kode lain.`);
    }

    return await rawMaterialCategoryRepository.create({
        code,
        name,
        description,
        is_active: true
    });
});
