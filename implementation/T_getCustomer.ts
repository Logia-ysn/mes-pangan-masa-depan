import { T_getCustomer } from "../types/api/T_getCustomer";
import { requireAuth } from "../utility/auth";
import { customerRepository } from "../src/repositories/customer.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getCustomer: T_getCustomer = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { id } = req.path;
    const customer = await customerRepository.findById(id);
    if (!customer) throw new Error('Customer not found');
    return customer;
});
