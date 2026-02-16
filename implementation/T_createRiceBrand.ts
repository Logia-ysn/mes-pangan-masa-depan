import { T_createRiceBrand } from "../types/api/T_createRiceBrand";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_createRiceBrand: T_createRiceBrand = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { code, name } = req.body;
    return await prisma.riceBrand.create({
        data: {
            code: code.toUpperCase(),
            name,
        },
    });
});
