import { T_createQualityParameter } from "../types/api/T_createQualityParameter";
import { qualityParameterService } from "../src/services/quality-parameter.service";

export const t_createQualityParameter: T_createQualityParameter = async (req, res) => {
    try {
        const data = await qualityParameterService.create({
            name: req.body.name,
            grade: req.body.grade,
            min_value: req.body.min_value || 0,
            max_value: req.body.max_value || 0,
            unit: req.body.unit,
            id_variety: req.body.id_variety,
            level: req.body.level || 1
        });

        return {
            success: true,
            message: 'Quality Parameter created successfully',
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
