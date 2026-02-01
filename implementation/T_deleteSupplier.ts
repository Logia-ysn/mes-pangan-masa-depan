import { T_deleteSupplier } from "../types/api/T_deleteSupplier";
import { Supplier } from "../types/model/table/Supplier";
import { getUserFromToken } from "../utility/auth";

export const t_deleteSupplier: T_deleteSupplier = async (req, res) => {
    await getUserFromToken(req.headers.authorization);
    const { id } = req.path;
    const supplier = await Supplier.findOne({ where: { id } });
    if (!supplier) throw new Error('Supplier not found');
    await supplier.remove();
    return { message: 'Supplier deleted successfully', success: true };
}
