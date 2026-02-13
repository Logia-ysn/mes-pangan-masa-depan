
import { T_getFactoryById } from "../types/api/T_getFactoryById";
import { requireAuth } from "../utility/auth";
import { factoryRepository } from "../src/repositories/factory.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getFactoryById: T_getFactoryById = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');

  const factory = await factoryRepository.findById(req.path.id);

  if (!factory) {
    throw new Error('Factory not found');
  }

  return factory;
});
