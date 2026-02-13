
import { T_getProductTypeById } from "../types/api/T_getProductTypeById";
import { requireAuth } from "../utility/auth";
import { productTypeRepository } from "../src/repositories/product-type.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getProductTypeById: T_getProductTypeById = apiWrapper(async (req, res) => {
  await requireAuth(req, 'OPERATOR');

  const productType = await productTypeRepository.findById(req.path.id);
  if (!productType) throw new Error('Product type not found');

  return productType;
});
