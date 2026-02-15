import { T_hardReset } from "../types/api/T_hardReset";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";
import { ForbiddenError } from "../src/utils/errors";

export const t_hardReset: T_hardReset = apiWrapper(async (req, res) => {
    // 0. Disable in production
    if (process.env.NODE_ENV === 'production') {
        throw new ForbiddenError('This endpoint is disabled in production');
    }

    await requireAuth(req, 'ADMIN');
    const result = await DummyService.hardReset();
    return result;
});
