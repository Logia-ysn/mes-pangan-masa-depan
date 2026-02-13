import { T_createFactory } from "../types/api/T_createFactory";
import { apiWrapper } from "../src/utils/apiWrapper";
import { factoryRepository } from "../src/repositories/factory.repository";
import { requireAuth } from "../utility/auth";

export const t_createFactory: T_createFactory = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');

  const { code, name, address, phone } = req.body;

  // Check if code already exists
  const exists = await factoryRepository.codeExists(code);
  if (exists) {
    throw new Error('Factory code already exists');
  }

  const factory = await factoryRepository.create({
    code,
    name,
    address,
    phone,
    is_active: true
  });

  return factory as any;
});
