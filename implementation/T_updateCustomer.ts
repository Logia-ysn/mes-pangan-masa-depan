import { T_updateCustomer } from "../types/api/T_updateCustomer";
import { requireAuth } from "../utility/auth";
import { customerRepository } from "../src/repositories/customer.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateCustomer: T_updateCustomer = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const id = Number(req.path.id);
    const customer = await customerRepository.findById(id);
    if (!customer) throw new Error('Customer not found');

    const { code, name, contact_person, phone, email, address, is_active } = req.body;
    const updateData: any = {};
    if (code !== undefined) updateData.code = code;
    if (name !== undefined) updateData.name = name;
    if (contact_person !== undefined) updateData.contact_person = contact_person;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (address !== undefined) updateData.address = address;
    if (is_active !== undefined) updateData.is_active = is_active;

    return await customerRepository.update(id, updateData);
});
