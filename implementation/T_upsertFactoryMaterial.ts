import { T_upsertFactoryMaterial } from "../types/api/T_upsertFactoryMaterial";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_upsertFactoryMaterial: T_upsertFactoryMaterial = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { id_factory, id_product_type, is_input, is_output } = req.body;

    return await prisma.factoryMaterialConfig.upsert({
        where: {
            id_factory_id_product_type: {
                id_factory: Number(id_factory),
                id_product_type: Number(id_product_type),
            },
        },
        update: {
            is_input,
            is_output,
        },
        create: {
            id_factory: Number(id_factory),
            id_product_type: Number(id_product_type),
            is_input,
            is_output,
        },
    });
});
