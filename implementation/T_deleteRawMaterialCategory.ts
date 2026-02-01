import { T_deleteRawMaterialCategory } from "../types/api/T_deleteRawMaterialCategory";
import { RawMaterialCategory } from "../types/model/table/RawMaterialCategory";
import { getUserFromToken } from "../utility/auth";

export const t_deleteRawMaterialCategory: T_deleteRawMaterialCategory = async (req, res) => {
    await getUserFromToken(req.headers.authorization || '');
    const category = await RawMaterialCategory.findOne({ where: { id: req.path.id } });
    if (!category) {
        res.status(404).json({ message: 'Kategori tidak ditemukan' });
        return { success: false, message: 'Kategori tidak ditemukan' };
    }
    await category.remove();
    return { success: true, message: 'Kategori berhasil dihapus' };
}

