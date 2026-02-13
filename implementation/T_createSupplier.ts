
import { T_createSupplier } from "../types/api/T_createSupplier";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { supplierRepository } from "../src/repositories/supplier.repository";

export const t_createSupplier: T_createSupplier = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const { code, name, contact_person, phone, email, address } = req.body;

    // Check for duplicate code
    const existing = await supplierRepository.findOne({ where: { code } });
    if (existing) {
        throw new Error(`Kode Supplier "${code}" sudah digunakan. Gunakan kode lain.`);
    }

    return await supplierRepository.create({
        code,
        name,
        contact_person,
        phone,
        email,
        address,
        is_active: true
    });
});
