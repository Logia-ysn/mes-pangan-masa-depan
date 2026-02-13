
import { T_deleteRawMaterialCategory } from "../types/api/T_deleteRawMaterialCategory";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { rawMaterialCategoryRepository } from "../src/repositories/raw-material-category.repository";

export const t_deleteRawMaterialCategory: T_deleteRawMaterialCategory = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const category = await rawMaterialCategoryRepository.findById(req.path.id);
    if (!category) {
        throw new Error('Kategori tidak ditemukan');
    }
    await rawMaterialCategoryRepository.delete(req.path.id);
    return { success: true, message: 'Kategori berhasil dihapus' };
});
