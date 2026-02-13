
import { T_getOutputProducts } from "../types/api/T_getOutputProducts";
import { requireAuth } from "../utility/auth";
import { outputProductRepository } from "../src/repositories/output-product.repository";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getOutputProducts: T_getOutputProducts = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    const { id_factory, is_active } = req.query;

    const { data, total } = await outputProductRepository.findWithFilters({
        id_factory: id_factory ? Number(id_factory) : undefined,
        is_active: is_active !== undefined ? Boolean(is_active) : undefined
    });

    return { data: data as any, total };
});
