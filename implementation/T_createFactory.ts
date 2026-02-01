import { T_createFactory } from "../types/api/T_createFactory";
import { Factory } from "../types/model/table/Factory";
import { getUserFromToken } from "../utility/auth";

export const t_createFactory: T_createFactory = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const { code, name, address, phone } = req.body;

  // Check if code already exists
  const existing = await Factory.findOne({ where: { code } });
  if (existing) {
    throw new Error('Factory code already exists');
  }

  const factory = new Factory();
  factory.code = code;
  factory.name = name;
  factory.address = address;
  factory.phone = phone;
  factory.is_active = true;

  await factory.save();

  return factory;
}
