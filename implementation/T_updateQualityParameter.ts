import { T_updateQualityParameter } from "../types/api/T_updateQualityParameter";
import { qualityParameterService } from "../src/services/quality-parameter.service";

export const t_updateQualityParameter: T_updateQualityParameter = async (req, res) => {
    try {
        const id = req.path.id;
        const data = await qualityParameterService.update(id, req.body);

        return {
            success: true,
            message: 'Quality Parameter updated successfully',
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
