import { T_createRiceVariety } from "../types/api/T_createRiceVariety";
import { prisma } from "../src/libs/prisma";
import { apiWrapper } from "../src/utils/apiWrapper";
import { requireAuth } from "../utility/auth";

export const t_createRiceVariety: T_createRiceVariety = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const { code, name, description } = req.body;
    return await prisma.riceVariety.create({
        data: {
            code: code.toUpperCase(),
            name,
            description,
        },
    });
});
