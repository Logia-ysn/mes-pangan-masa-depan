import { T_deleteCustomer } from "../types/api/T_deleteCustomer";
import { Customer } from "../types/model/table/Customer";
import { getUserFromToken } from "../utility/auth";

export const t_deleteCustomer: T_deleteCustomer = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const customer = await Customer.findOne({ where: { id: req.path.id } });
  if (!customer) throw new Error('Customer not found');
  await customer.remove();
  return { message: 'Customer deleted successfully', success: true };
}
