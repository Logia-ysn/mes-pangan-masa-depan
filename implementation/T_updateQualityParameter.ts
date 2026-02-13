import { T_updateQualityParameter } from "../types/api/T_updateQualityParameter";
import { qualityParameterService } from "../src/services/quality-parameter.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_updateQualityParameter: T_updateQualityParameter = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');

    const id = req.path.id;
    const data = await qualityParameterService.update(id, req.body);

    return {
        success: true,
        message: 'Quality Parameter updated successfully',
        data
    };
});
