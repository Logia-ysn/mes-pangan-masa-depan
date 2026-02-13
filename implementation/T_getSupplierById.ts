
import { T_getSupplierById } from "../types/api/T_getSupplierById";
import { requireAuth } from "../utility/auth";
import { supplierRepository } from "../src/repositories/supplier.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getSupplierById: T_getSupplierById = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { id } = req.path;
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new Error('Supplier not found');
    return supplier;
});
