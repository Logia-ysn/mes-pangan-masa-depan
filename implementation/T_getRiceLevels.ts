import { T_getRiceLevels } from "../types/api/T_getRiceLevels";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_getRiceLevels: T_getRiceLevels = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    return await prisma.riceLevel.findMany({
        orderBy: { sort_order: 'asc' },
    });
});
