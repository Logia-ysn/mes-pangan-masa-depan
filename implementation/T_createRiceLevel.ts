import { T_createRiceLevel } from "../types/api/T_createRiceLevel";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_createRiceLevel: T_createRiceLevel = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { code, name, sort_order } = req.body;
    return await prisma.riceLevel.create({
        data: {
            code: code.toUpperCase(),
            name,
            sort_order,
        },
    });
});
