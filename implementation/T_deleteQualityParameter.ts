import { T_deleteQualityParameter } from "../types/api/T_deleteQualityParameter";
import { qualityParameterService } from "../src/services/quality-parameter.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_deleteQualityParameter: T_deleteQualityParameter = apiWrapper(async (req, res) => {
    await requireAuth(req, 'ADMIN');

    const id = req.path.id;
    const success = await qualityParameterService.delete(id);

    if (!success) {
        throw new Error('Quality parameter not found');
    }

    return {
        success: true,
        message: 'Quality parameter deleted successfully'
    };
});
