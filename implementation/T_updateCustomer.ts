import { T_updateCustomer } from "../types/api/T_updateCustomer";
import { Customer } from "../types/model/table/Customer";
import { getUserFromToken } from "../utility/auth";

export const t_updateCustomer: T_updateCustomer = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const customer = await Customer.findOne({ where: { id: req.path.id } });
  if (!customer) throw new Error('Customer not found');
  const { code, name, contact_person, phone, email, address, is_active } = req.body;
  if (code !== undefined) customer.code = code;
  if (name !== undefined) customer.name = name;
  if (contact_person !== undefined) customer.contact_person = contact_person;
  if (phone !== undefined) customer.phone = phone;
  if (email !== undefined) customer.email = email;
  if (address !== undefined) customer.address = address;
  if (is_active !== undefined) customer.is_active = is_active;
  await customer.save();
  return customer;
}
