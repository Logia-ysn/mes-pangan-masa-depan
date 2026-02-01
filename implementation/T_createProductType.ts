import { T_createProductType } from "../types/api/T_createProductType";
import { ProductType } from "../types/model/table/ProductType";
import { getUserFromToken } from "../utility/auth";

export const t_createProductType: T_createProductType = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const { code, name, description, unit } = req.body;

  const existing = await ProductType.findOne({ where: { code } });
  if (existing) throw new Error('Product type code already exists');

  const productType = new ProductType();
  productType.code = code;
  productType.name = name;
  productType.description = description;
  productType.unit = unit || 'kg';

  await productType.save();
  return productType;
}
