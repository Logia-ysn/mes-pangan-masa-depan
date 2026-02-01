import { T_updateProductType } from "../types/api/T_updateProductType";
import { ProductType } from "../types/model/table/ProductType";
import { getUserFromToken } from "../utility/auth";

export const t_updateProductType: T_updateProductType = async (req, res) => {
  await getUserFromToken(req.headers.authorization);

  const productType = await ProductType.findOne({ where: { id: req.path.id } });
  if (!productType) throw new Error('Product type not found');

  const { code, name, description, unit } = req.body;
  if (code !== undefined) productType.code = code;
  if (name !== undefined) productType.name = name;
  if (description !== undefined) productType.description = description;
  if (unit !== undefined) productType.unit = unit;

  await productType.save();
  return productType;
}
