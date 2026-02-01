import { T_getProductTypeById } from "../types/api/T_getProductTypeById";
import { ProductType } from "../types/model/table/ProductType";
import { getUserFromToken } from "../utility/auth";

export const t_getProductTypeById: T_getProductTypeById = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const productType = await ProductType.findOne({ where: { id: req.path.id } });
  if (!productType) throw new Error('Product type not found');

  return productType;
}
