
import { T_deleteSupplier } from "../types/api/T_deleteSupplier";
import { requireAuth } from "../utility/auth";
import { supplierRepository } from "../src/repositories/supplier.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteSupplier: T_deleteSupplier = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const id = Number(req.path.id);
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new Error('Supplier not found');
    await supplierRepository.delete(id);
    return { message: 'Supplier deleted successfully', success: true };
});
