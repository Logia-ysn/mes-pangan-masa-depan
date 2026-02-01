import { T_getSupplierById } from "../types/api/T_getSupplierById";
import { Supplier } from "../types/model/table/Supplier";
import { getUserFromToken } from "../utility/auth";

export const t_getSupplierById: T_getSupplierById = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { id } = req.path;
    const supplier = await Supplier.findOne({ where: { id } });
    if (!supplier) throw new Error('Supplier not found');
    return supplier;
}
