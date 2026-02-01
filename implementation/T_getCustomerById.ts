import { T_getCustomerById } from "../types/api/T_getCustomerById";
import { Customer } from "../types/model/table/Customer";
import { getUserFromToken } from "../utility/auth";

export const t_getCustomerById: T_getCustomerById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const customer = await Customer.findOne({ where: { id: req.path.id } });
  if (!customer) throw new Error('Customer not found');
  return customer;
}
