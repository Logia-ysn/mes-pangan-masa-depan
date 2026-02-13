import { T_createCustomer } from "../types/api/T_createCustomer";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { customerRepository } from "../src/repositories/customer.repository";

export const t_createCustomer: T_createCustomer = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');
    const { code, name, contact_person, phone, email, address } = req.body;

    const existing = await customerRepository.findOne({ where: { code } });
    if (existing) {
        throw new Error(`Kode Customer "${code}" sudah digunakan. Gunakan kode lain.`);
    }

    return await customerRepository.create({
        code,
        name,
        contact_person,
        phone,
        email,
        address,
        is_active: true
    });
});
