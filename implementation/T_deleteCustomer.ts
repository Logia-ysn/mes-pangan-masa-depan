import { T_deleteCustomer } from "../types/api/T_deleteCustomer";
import { requireAuth } from "../utility/auth";
import { customerRepository } from "../src/repositories/customer.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteCustomer: T_deleteCustomer = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const id = Number(req.path.id);
    const customer = await customerRepository.findById(id);
    if (!customer) throw new Error('Customer not found');
    await customerRepository.delete(id);
    return { message: 'Customer deleted successfully', success: true };
});
