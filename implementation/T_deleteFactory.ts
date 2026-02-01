import { T_deleteFactory } from "../types/api/T_deleteFactory";
import { Factory } from "../types/model/table/Factory";
import { getUserFromToken } from "../utility/auth";

export const t_deleteFactory: T_deleteFactory = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const factory = await Factory.findOne({
    where: { id: req.path.id }
  });

  if (!factory) {
    throw new Error('Factory not found');
  }

  await factory.remove();

  return {
    message: 'Factory deleted successfully',
    success: true
  };
}
