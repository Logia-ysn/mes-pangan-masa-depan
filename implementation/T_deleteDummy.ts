import { T_deleteDummy } from "../types/api/T_deleteDummy";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteDummy: T_deleteDummy = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');
    const result = await DummyService.deleteDummy();
    return result;
});
