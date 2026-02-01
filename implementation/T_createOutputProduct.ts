import { T_createOutputProduct } from "../types/api/T_createOutputProduct";
import { OutputProduct } from "../types/model/table/OutputProduct";
import { getUserFromToken } from "../utility/auth";

export const t_createOutputProduct: T_createOutputProduct = async (req, res) => {
    await getUserFromToken(req.headers.authorization);

    const { id_factory, code, name, description, display_order } = req.body;

    // Check for existing code in factory
    const existing = await OutputProduct.findOne({ where: { id_factory, code } });
    if (existing) throw new Error('Output product code already exists for this factory');

    const product = new OutputProduct();
    product.id_factory = id_factory;
    product.code = code;
    product.name = name;
    product.description = description;
    product.display_order = display_order ?? 0;
    product.is_active = true;

    await product.save();
    return product;
}
