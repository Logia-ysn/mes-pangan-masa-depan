
import { T_updateProductType } from "../types/api/T_updateProductType";
import { requireAuth } from "../utility/auth";
import { productTypeRepository } from "../src/repositories/product-type.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateProductType: T_updateProductType = apiWrapper(async (req, res) => {
  await requireAuth(req, 'SUPERVISOR');

  const productType = await productTypeRepository.findById(req.path.id);
  if (!productType) throw new Error('Product type not found');

  const { code, name, description, unit } = req.body;
  const updateData: any = {};
  if (code !== undefined) updateData.code = code;
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (unit !== undefined) updateData.unit = unit;

  return await productTypeRepository.update(req.path.id, updateData);
});
