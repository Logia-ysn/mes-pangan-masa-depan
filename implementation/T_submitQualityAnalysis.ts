import { T_submitQualityAnalysis } from "../types/api/T_submitQualityAnalysis";
import { qualityAnalysisService } from "../src/services/quality-analysis.service";

export const t_submitQualityAnalysis: T_submitQualityAnalysis = async (req, res) => {
    try {
        const data = await qualityAnalysisService.analyzeAndSave(req.body);

        return {
            success: true,
            message: 'Quality Analysis submitted successfully',
            data
        };
    } catch (error: any) {
        res.status(500);
        console.error(error);
        return {
            success: false,
            message: error.message || 'Internal Server Error'
        };
    }
}
