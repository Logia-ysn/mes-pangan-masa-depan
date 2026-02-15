import { T_hardReset } from "../types/api/T_hardReset";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_hardReset: T_hardReset = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const result = await DummyService.hardReset();
    return result;
});
