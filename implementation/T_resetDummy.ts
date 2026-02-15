import { T_resetDummy } from "../types/api/T_resetDummy";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_resetDummy: T_resetDummy = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');

    const result = await DummyService.resetAll();
    return result;
});
