
import { T_createRawMaterialVariety } from "../types/api/T_createRawMaterialVariety";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { rawMaterialVarietyRepository } from "../src/repositories/raw-material-variety.repository";

export const t_createRawMaterialVariety: T_createRawMaterialVariety = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const { code, name, description } = req.body;

    const existing = await rawMaterialVarietyRepository.findOne({ where: { code } });
    if (existing) {
        throw new Error(`Kode Varietas "${code}" sudah digunakan. Gunakan kode lain.`);
    }

    return await rawMaterialVarietyRepository.create({
        code,
        name,
        description,
        is_active: true
    });
});
