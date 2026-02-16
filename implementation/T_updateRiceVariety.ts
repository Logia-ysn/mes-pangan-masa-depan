import { T_updateRiceVariety } from "../types/api/T_updateRiceVariety";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_updateRiceVariety: T_updateRiceVariety = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { id } = req.params;
    const { code, name, description, is_active } = req.body;
    return await prisma.riceVariety.update({
        where: { id: Number(id) },
        data: {
            code: code ? code.toUpperCase() : undefined,
            name,
            description,
            is_active,
        },
    });
});
