import { T_deleteQualityParameter } from "../types/api/T_deleteQualityParameter";
import { qualityParameterService } from "../src/services/quality-parameter.service";

export const t_deleteQualityParameter: T_deleteQualityParameter = async (req, res) => {
    try {
        const id = req.path.id;
        const success = await qualityParameterService.delete(id);

        if (!success) {
            res.status(404);
            return {
                success: false,
                message: 'Quality parameter not found'
            };
        }

        return {
            success: true,
            message: 'Quality parameter deleted successfully'
        };
    } catch (error: any) {
        res.status(500);
        return {
            success: false,
            message: error.message || 'Internal Server Error'
        };
    }
}
