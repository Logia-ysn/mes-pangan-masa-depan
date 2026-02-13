
import { T_updateSupplier } from "../types/api/T_updateSupplier";
import { requireAuth } from "../utility/auth";
import { supplierRepository } from "../src/repositories/supplier.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateSupplier: T_updateSupplier = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const { id } = req.path;
    const supplier = await supplierRepository.findById(id);
    if (!supplier) throw new Error('Supplier not found');

    const { code, name, contact_person, phone, email, address, is_active } = req.body;
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (contact_person !== undefined) updateData.contact_person = contact_person;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (is_active !== undefined) updateData.is_active = is_active;

    return await supplierRepository.update(id, updateData);
});
