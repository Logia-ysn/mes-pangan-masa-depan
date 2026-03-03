/**
 * InputBatchSection Component
 * Extracted from WorksheetForm.tsx — displays input batch table with add/remove
 */

import type { InputBatch } from '../types/worksheet.types';
import { formatNumber, formatCurrency } from '../../../../utils/formatUtils';

interface InputBatchSectionProps {
    batches: InputBatch[];
    totalInputWeight: number;
    rawMaterialCost: number;
    onAdd: () => void;
    onRemove: (index: number) => void;
}

const InputBatchSection = ({ batches, totalInputWeight, rawMaterialCost, onAdd, onRemove }: InputBatchSectionProps) => (
    <div className="form-group" style={{ marginTop: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label className="form-label" style={{ margin: 0 }}>Input Batches (Raw Material) *</label>
            <button type="button" className="btn btn-primary btn-sm" onClick={onAdd}>
                <span className="material-symbols-outlined icon-sm">add</span>
                Add Batch
            </button>
        </div>

        {batches.length === 0 ? (
            <div style={{ padding: 24, background: 'var(--bg-elevated)', borderRadius: 8, textAlign: 'center', color: 'var(--text-muted)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, marginBottom: 8 }}>inventory</span>
                <p>No input batches added. Click "Add Batch" to select raw material.</p>
            </div>
        ) : (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: 8 }}>
                <table className="table" style={{ margin: 0 }}>
                    <thead>
                        <tr>
                            <th>Batch / Material</th>
                            <th style={{ textAlign: 'right' }}>Qty Pakai</th>
                            <th style={{ textAlign: 'right' }}>Harga/kg</th>
                            <th style={{ textAlign: 'right' }}>Total Biaya</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {batches.map((batch, idx) => (
                            <tr key={idx}>
                                <td>
                                    <div style={{ fontWeight: 500 }}>{batch.stock_name}</div>
                                </td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatNumber(batch.quantity)} kg</td>
                                <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>{formatCurrency(batch.unit_price)}</td>
                                <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatCurrency(batch.quantity * batch.unit_price)}</td>
                                <td style={{ textAlign: 'center' }}>
                                    <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => onRemove(idx)}>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--error)' }}>delete</span>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        <tr style={{ background: 'var(--bg-elevated)' }}>
                            <td style={{ fontWeight: 600 }}>Total Input</td>
                            <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'monospace' }}>{formatNumber(totalInputWeight)} kg</td>
                            <td></td>
                            <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--primary)', fontFamily: 'monospace' }}>{formatCurrency(rawMaterialCost)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default InputBatchSection;
