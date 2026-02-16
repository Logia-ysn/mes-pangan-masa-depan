import { T_updateRiceLevel } from "../types/api/T_updateRiceLevel";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_updateRiceLevel: T_updateRiceLevel = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { id } = req.params;
    const { code, name, sort_order, is_active } = req.body;
    return await prisma.riceLevel.update({
        where: { id: Number(id) },
        data: {
            code: code ? code.toUpperCase() : undefined,
            name,
            sort_order,
            is_active,
        },
    });
});
