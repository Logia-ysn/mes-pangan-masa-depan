import { T_createRawMaterialCategory } from "../types/api/T_createRawMaterialCategory";
import { RawMaterialCategory } from "../types/model/table/RawMaterialCategory";
import { getUserFromToken } from "../utility/auth";

export const t_createRawMaterialCategory: T_createRawMaterialCategory = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { code, name, description } = req.body;

    const existing = await RawMaterialCategory.findOne({ where: { code } });
    if (existing) {
        res.status(400).json({ message: `Kode Kategori "${code}" sudah digunakan. Gunakan kode lain.` });
        return null as any;
    }

    const category = new RawMaterialCategory();
    category.code = code;
    category.name = name;
    category.description = description;
    category.is_active = true;
    await category.save();
    return category;
}
