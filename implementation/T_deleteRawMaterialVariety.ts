import { T_deleteRawMaterialVariety } from "../types/api/T_deleteRawMaterialVariety";
import { RawMaterialVariety } from "../types/model/table/RawMaterialVariety";
import { getUserFromToken } from "../utility/auth";

export const t_deleteRawMaterialVariety: T_deleteRawMaterialVariety = async (req, res) => {
    await getUserFromToken(req.headers.authorization || '');
    const variety = await RawMaterialVariety.findOne({ where: { id: req.path.id } });
    if (!variety) {
        res.status(404).json({ message: 'Varietas tidak ditemukan' });
        return { success: false, message: 'Varietas tidak ditemukan' };
    }
    await variety.remove();
    return { success: true, message: 'Varietas berhasil dihapus' };
}

