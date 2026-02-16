import { T_getRiceVarieties } from "../types/api/T_getRiceVarieties";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_getRiceVarieties: T_getRiceVarieties = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    const varieties = await prisma.riceVariety.findMany({
        orderBy: { name: 'asc' },
    });
    return varieties;
});
