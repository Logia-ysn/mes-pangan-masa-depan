/**
 * HPP (Harga Pokok Produksi) Calculator Service
 * Extracted from worksheet.service.ts — handles production cost calculation
 * 
 * Formula: HPP = Raw Material Cost + Production Cost - Side Product Revenue
 * HPP/kg = HPP / Beras Output
 */

import type { HPPCalculationInput, HPPResult } from '../worksheet.types';

export class HPPCalculator {
    /**
     * Calculate HPP from input batches, side products, and production cost
     */
    calculate(params: HPPCalculationInput): HPPResult {
        const rawMaterialCost = params.inputBatches.reduce(
            (sum, b) => sum + Number(b.quantity) * Number(b.unit_price || 0), 0
        );
        const sideProductRevenue = params.sideProducts.reduce(
            (sum, sp) => sum + Number(sp.quantity) * Number(sp.unit_price || 0), 0
        );
        const productionCost = Number(params.productionCost || 0);
        const hpp = rawMaterialCost + productionCost - sideProductRevenue;
        const berasOutput = Number(params.berasOutput);
        const hppPerKg = berasOutput > 0 ? hpp / berasOutput : 0;

        return {
            rawMaterialCost,
            sideProductRevenue,
            productionCost,
            hpp,
            hppPerKg
        };
    }

    /**
     * Calculate rendemen (yield percentage)
     */
    calculateRendemen(input: number, output: number): number {
        if (input <= 0) return 0;
        return (output / input) * 100;
    }
}

export const hppCalculator = new HPPCalculator();
