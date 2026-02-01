import { T_getFactoryById } from "../types/api/T_getFactoryById";
import { Factory } from "../types/model/table/Factory";
import { getUserFromToken } from "../utility/auth";

export const t_getFactoryById: T_getFactoryById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const factory = await Factory.findOne({
    where: { id: req.path.id }
  });

  if (!factory) {
    throw new Error('Factory not found');
  }

  return factory;
}
