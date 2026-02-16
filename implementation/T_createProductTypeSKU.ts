import { T_createProductTypeSKU } from "../types/api/T_createProductTypeSKU";
import { ProductClassificationService } from '../src/services/product-classification.service';
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_createProductTypeSKU: T_createProductTypeSKU = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { id_rice_level, id_variety, id_rice_brand, id_factory, category } = req.body;

    return await ProductClassificationService.getOrCreateSKU(
        id_rice_level,
        id_variety,
        id_rice_brand,
        id_factory,
        category
    );
});
