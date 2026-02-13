
import { T_deleteRawMaterialVariety } from "../types/api/T_deleteRawMaterialVariety";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { rawMaterialVarietyRepository } from "../src/repositories/raw-material-variety.repository";

export const t_deleteRawMaterialVariety: T_deleteRawMaterialVariety = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const variety = await rawMaterialVarietyRepository.findById(req.path.id);
    if (!variety) {
        throw new Error('Varietas tidak ditemukan');
    }
    await rawMaterialVarietyRepository.delete(req.path.id);
    return { success: true, message: 'Varietas berhasil dihapus' };
});
