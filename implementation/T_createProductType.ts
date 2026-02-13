
import { T_createProductType } from "../types/api/T_createProductType";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productTypeRepository } from "../src/repositories/product-type.repository";

export const t_createProductType: T_createProductType = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

  const { code, name, description, unit } = req.body;

  const existing = await productTypeRepository.findOne({ where: { code } });
  if (existing) throw new Error('Product type code already exists');

  return await productTypeRepository.create({
    code,
    name,
    description,
    unit: unit || 'kg'
  });
});
