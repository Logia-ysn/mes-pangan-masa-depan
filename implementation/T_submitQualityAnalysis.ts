import { T_submitQualityAnalysis } from "../types/api/T_submitQualityAnalysis";
import { qualityAnalysisService } from "../src/services/quality-analysis.service";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

export const t_submitQualityAnalysis: T_submitQualityAnalysis = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');

    const data = await qualityAnalysisService.analyzeAndSave(req.body);

    return {
        success: true,
        message: 'Quality Analysis submitted successfully',
        data
    };
});
