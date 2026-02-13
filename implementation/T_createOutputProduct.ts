
import { T_createOutputProduct } from "../types/api/T_createOutputProduct";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";
import { outputProductRepository } from "../src/repositories/output-product.repository";

export const t_createOutputProduct: T_createOutputProduct = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');

    const { id_factory, code, name, description, display_order } = req.body;

    // Check for existing code in factory
    const existing = await outputProductRepository.findByCode(id_factory, code);
    if (existing) throw new Error('Output product code already exists for this factory');

    return await outputProductRepository.create({
        id_factory,
        code,
        name,
        description,
        display_order: display_order ?? 0,
        is_active: true
    });
});
