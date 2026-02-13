
import { T_deleteProductType } from "../types/api/T_deleteProductType";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { productTypeRepository } from "../src/repositories/product-type.repository";

export const t_deleteProductType: T_deleteProductType = apiWrapper(async (req, res) => {
  await requireAuth(req, 'ADMIN');

  const productType = await productTypeRepository.findById(req.path.id);
  if (!productType) throw new Error('Product type not found');

  await productTypeRepository.delete(req.path.id);
  return { message: 'Product type deleted successfully', success: true };
});
