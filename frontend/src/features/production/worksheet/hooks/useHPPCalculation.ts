/**
 * useHPPCalculation Hook
 * Extracted from WorksheetForm.tsx — computes HPP values reactively
 */

import { useMemo } from 'react';
import type { InputBatch, SideProduct, HPPCalculation } from '../types/worksheet.types';

interface UseHPPCalculationParams {
    inputBatches: InputBatch[];
    sideProducts: SideProduct[];
    productionCost: string;
    berasOutput: string;
}

export function useHPPCalculation({
    inputBatches,
    sideProducts,
    productionCost: productionCostStr,
    berasOutput: berasOutputStr,
}: UseHPPCalculationParams): HPPCalculation {
    const hppCalc = useMemo(() => {
        const productionCost = parseFloat(productionCostStr) || 0;
        const rawMaterialCost = inputBatches.reduce((sum, b) => sum + (b.quantity * b.unit_price), 0);
        const sideProductRevenue = sideProducts.reduce((sum, sp) => sum + (sp.quantity * sp.unit_price), 0);
        const hpp = productionCost + rawMaterialCost - sideProductRevenue;
        const berasOutput = parseFloat(berasOutputStr) || 0;
        const hppPerKg = berasOutput > 0 ? hpp / berasOutput : 0;

        return {
            productionCost,
            rawMaterialCost,
            sideProductRevenue,
            hpp,
            hppPerKg,
        };
    }, [inputBatches, sideProducts, productionCostStr, berasOutputStr]);

    return hppCalc;
}
