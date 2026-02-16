import { T_getFactoryMaterials } from "../types/api/T_getFactoryMaterials";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_getFactoryMaterials: T_getFactoryMaterials = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const { id_factory } = req.query;

    return await prisma.factoryMaterialConfig.findMany({
        where: { id_factory: id_factory ? Number(id_factory) : undefined },
        include: {
            ProductType: {
                include: {
                    RiceVariety: true,
                    RiceLevel: true,
                    RiceBrand: true,
                }
            }
        }
    });
});
