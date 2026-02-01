import { T_getOutputProducts } from "../types/api/T_getOutputProducts";
import { OutputProduct } from "../types/model/table/OutputProduct";
import { getUserFromToken } from "../utility/auth";

export const t_getOutputProducts: T_getOutputProducts = async (req, res) => {
    await getUserFromToken(req.headers.authorization);

    const { id_factory, is_active } = req.query;
    const where: any = {};

    if (id_factory !== undefined) where.id_factory = id_factory;
    if (is_active !== undefined) where.is_active = is_active;
    else where.is_active = true; // Default to active only

    const [data, total] = await OutputProduct.findAndCount({
        where,
        relations: ['otm_id_factory'],
        order: { display_order: 'ASC', name: 'ASC' }
    });

    return { data, total };
}
