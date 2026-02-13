
import { T_deleteFactory } from "../types/api/T_deleteFactory";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { factoryRepository } from "../src/repositories/factory.repository";

export const t_deleteFactory: T_deleteFactory = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');

  const factory = await factoryRepository.findById(req.path.id);

  if (!factory) {
    throw new Error('Factory not found');
  }

  await factoryRepository.delete(req.path.id);

  return {
    message: 'Factory deleted successfully',
    success: true
  };
});
