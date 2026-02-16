import { T_getRiceBrands } from "../types/api/T_getRiceBrands";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_getRiceBrands: T_getRiceBrands = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');
    return await prisma.riceBrand.findMany({
        orderBy: { name: 'asc' },
    });
});
