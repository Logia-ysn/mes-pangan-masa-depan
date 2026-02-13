import { T_analyzeGrain } from "../types/api/T_analyzeGrain";
import { qcGabahRepository } from "../src/repositories/qc-gabah.repository";
import { requireAuth } from "../utility/auth";
import { apiWrapper } from "../src/utils/apiWrapper";

// ML Service URL - Use Railway URL in production, localhost in development
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

export const t_analyzeGrain: T_analyzeGrain = apiWrapper(async (req, res) => {
    await requireAuth(req, 'SUPERVISOR');

    const { image_base64, supplier, lot } = req.body;

    console.log(`[ML-INFO] Calling ML Service at: ${ML_SERVICE_URL}`);

    // Call ML Service via HTTP
    const response = await fetch(`${ML_SERVICE_URL}/analyze-base64`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            image_base64,
            supplier,
            lot
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`[ML-ERROR] ML Service returned ${response.status}: ${errorText}`);
        throw new Error(`ML Service Error: ${errorText}`);
    }

    const result = await response.json();
    console.log('[ML-INFO] ML Analysis Result:', result);

    // Ensure values are numbers before saving
    const greenPct = typeof result.green_percentage === 'number'
        ? result.green_percentage
        : parseFloat(result.green_percentage || '0');

    // Save to DB
    const entity = await qcGabahRepository.create({
        supplier,
        lot,
        image_url: "ml_service_processed",
        green_percentage: greenPct,
        grade: result.grade || 'Unknown',
        level: result.level || 1,
        status: result.status || 'WARNING'
    });

    return entity;
});
