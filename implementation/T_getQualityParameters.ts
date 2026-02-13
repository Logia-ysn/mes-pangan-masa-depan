import { T_getQualityParameters } from "../types/api/T_getQualityParameters";
import { requireAuth } from "../utility/auth";
import { qualityParameterService } from "../src/services/quality-parameter.service";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_getQualityParameters: T_getQualityParameters = apiWrapper(async (req, res) => {
    await requireAuth(req, 'OPERATOR');

    let data;
    if (req.query.id_variety) {
        data = await qualityParameterService.getByVariety(req.query.id_variety);
    } else {
        data = await qualityParameterService.getAll();
    }

    return {
        success: true,
        data
    };
});
