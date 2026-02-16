import { T_updateRiceBrand } from "../types/api/T_updateRiceBrand";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_updateRiceBrand: T_updateRiceBrand = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { id } = req.params;
    const { code, name, is_active } = req.body;
    return await prisma.riceBrand.update({
        where: { id: Number(id) },
        data: {
            code: code ? code.toUpperCase() : undefined,
            name,
            is_active,
        },
    });
});
