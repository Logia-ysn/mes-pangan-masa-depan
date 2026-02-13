import { T_updateFactory } from "../types/api/T_updateFactory";
import { factoryRepository } from "../src/repositories/factory.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateFactory: T_updateFactory = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');

  const factoryId = Number(req.path.id);
  const factory = await factoryRepository.findById(factoryId);

  if (!factory) {
    throw new Error('Factory not found');
  }

  const { code, name, address, phone, is_active } = req.body;

  const updatedFactory = await factoryRepository.update(factoryId, {
    code,
    name,
    address,
    phone,
    is_active
  });

  return updatedFactory as any;
});
