import { T_createCustomer } from "../types/api/T_createCustomer";
import { Customer } from "../types/model/table/Customer";
import { getUserFromToken } from "../utility/auth";

export const t_createCustomer: T_createCustomer = async (req, res) => {
  await getUserFromToken(req.headers.authorization);
  const { code, name, contact_person, phone, email, address } = req.body;
  const existing = await Customer.findOne({ where: { code } });
  if (existing) throw new Error('Customer code already exists');
  const customer = new Customer();
  customer.code = code;
  customer.name = name;
  customer.contact_person = contact_person;
  customer.phone = phone;
  customer.email = email;
  customer.address = address;
  customer.is_active = true;
  await customer.save();
  return customer;
}
