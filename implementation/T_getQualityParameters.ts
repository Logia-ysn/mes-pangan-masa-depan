import { T_getQualityParameters } from "../types/api/T_getQualityParameters";
import { qualityParameterService } from "../src/services/quality-parameter.service";

export const t_getQualityParameters: T_getQualityParameters = async (req, res) => {
    try {
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
    } catch (error: any) {
        res.status(500);
        return {
            success: false,
            message: error.message || 'Internal Server Error'
        };
    }
}
