import { T_createRawMaterialVariety } from "../types/api/T_createRawMaterialVariety";
import { RawMaterialVariety } from "../types/model/table/RawMaterialVariety";
import { getUserFromToken } from "../utility/auth";

export const t_createRawMaterialVariety: T_createRawMaterialVariety = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { code, name, description } = req.body;

    const existing = await RawMaterialVariety.findOne({ where: { code } });
    if (existing) {
        res.status(400).json({ message: `Kode Varietas "${code}" sudah digunakan. Gunakan kode lain.` });
        return null as any;
    }

    const variety = new RawMaterialVariety();
    variety.code = code;
    variety.name = name;
    variety.description = description;
    variety.is_active = true;
    await variety.save();
    return variety;
}
