import { T_updateFactory } from "../types/api/T_updateFactory";
import { Factory } from "../types/model/table/Factory";
import { getUserFromToken } from "../utility/auth";

export const t_updateFactory: T_updateFactory = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const factory = await Factory.findOne({
    where: { id: req.path.id }
  });

  if (!factory) {
    throw new Error('Factory not found');
  }

  const { code, name, address, phone, is_active } = req.body;

  if (code !== undefined) factory.code = code;
  if (name !== undefined) factory.name = name;
  if (address !== undefined) factory.address = address;
  if (phone !== undefined) factory.phone = phone;
  if (is_active !== undefined) factory.is_active = is_active;

  await factory.save();

  return factory;
}
