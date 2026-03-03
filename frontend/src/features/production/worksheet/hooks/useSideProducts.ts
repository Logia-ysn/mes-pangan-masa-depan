/**
 * useSideProducts Hook
 * Extracted from WorksheetForm.tsx — manages side product auto-calculations
 */

import { useEffect, useCallback } from 'react';
import type { SideProduct, WorksheetFormData } from '../types/worksheet.types';
import { SIDE_PRODUCT_AUTO_PERCENTAGE } from '../config/worksheet.config';

interface UseSideProductsReturn {
    updateSideProduct: (index: number, field: keyof SideProduct, value: number) => void;
}

export function useSideProducts(
    _sideProducts: SideProduct[],
    totalInputWeight: number,
    setFormData: React.Dispatch<React.SetStateAction<WorksheetFormData>>
): UseSideProductsReturn {
    // Auto-calculate SEKAM when input weight changes
    useEffect(() => {
        setFormData((prev) => ({
            ...prev,
            side_products: prev.side_products.map((sp) => {
                if (sp.product_code === 'SEKAM' && sp.is_auto) {
                    return { ...sp, quantity: totalInputWeight * (SIDE_PRODUCT_AUTO_PERCENTAGE.SEKAM / 100) };
                }
                return sp;
            })
        }));
    }, [totalInputWeight, setFormData]);

    const updateSideProduct = useCallback((index: number, field: keyof SideProduct, value: number) => {
        setFormData((prev) => {
            const updated = [...prev.side_products];
            // Type-safe field assignment for numeric SideProduct fields
            const item = { ...updated[index] };
            if (field === 'quantity' || field === 'unit_price') {
                item[field] = value;
            }
            updated[index] = item;
            return { ...prev, side_products: updated };
        });
    }, [setFormData]);

    return { updateSideProduct };
}
