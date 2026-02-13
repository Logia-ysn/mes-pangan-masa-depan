import { T_generateDummy } from "../types/api/T_generateDummy";
import { DummyService } from "../src/services/dummy.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_generateDummy: T_generateDummy = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERUSER');

    const result = await DummyService.generateAll();
    return result;
});
