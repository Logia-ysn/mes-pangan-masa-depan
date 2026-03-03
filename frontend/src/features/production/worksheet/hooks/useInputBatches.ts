/**
 * useInputBatches Hook
 * Extracted from WorksheetForm.tsx — manages input batch add/remove/list
 */

import { useMemo, useCallback } from 'react';
import type { InputBatch, Stock, WorksheetFormData } from '../types/worksheet.types';

interface UseInputBatchesReturn {
    totalInputWeight: number;
    addBatch: (stock: Stock, quantity: number, unitPrice: number, batchLabel?: string, rawBatchId?: string) => void;
    removeBatch: (index: number) => void;
}

export function useInputBatches(
    inputBatches: InputBatch[],
    setFormData: React.Dispatch<React.SetStateAction<WorksheetFormData>>
): UseInputBatchesReturn {
    const totalInputWeight = useMemo(() =>
        inputBatches.reduce((sum, b) => sum + b.quantity, 0),
        [inputBatches]
    );

    const addBatch = useCallback((
        stock: Stock,
        quantity: number,
        unitPrice: number,
        batchLabel?: string,
        rawBatchId?: string
    ) => {
        const batch: InputBatch = {
            id_stock: stock.id,
            stock_name: batchLabel || stock.ProductType?.name || 'Unknown',
            batch_code: rawBatchId,
            quantity,
            unit_price: unitPrice,
        };
        setFormData((prev) => ({
            ...prev,
            input_batches: [...prev.input_batches, batch]
        }));
    }, [setFormData]);

    const removeBatch = useCallback((index: number) => {
        setFormData((prev) => ({
            ...prev,
            input_batches: prev.input_batches.filter((_, i) => i !== index)
        }));
    }, [setFormData]);

    return { totalInputWeight, addBatch, removeBatch };
}
