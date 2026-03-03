/**
 * SideProductSection Component
 * Extracted from WorksheetForm.tsx — displays side product table with inline editing
 */

import type { SideProduct } from '../types/worksheet.types';
import { formatCurrency } from '../../../../utils/formatUtils';

interface SideProductSectionProps {
    sideProducts: SideProduct[];
    sideProductRevenue: number;
    onUpdate: (index: number, field: keyof SideProduct, value: number) => void;
}

const SideProductSection = ({ sideProducts, sideProductRevenue, onUpdate }: SideProductSectionProps) => (
    <div className="form-group" style={{ marginTop: 20 }}>
        <label className="form-label">Side Products / Waste</label>
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 8 }}>
            <table className="table" style={{ margin: 0 }}>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th style={{ textAlign: 'right' }}>Quantity (kg)</th>
                        <th style={{ textAlign: 'right' }}>Price/kg</th>
                        <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                </thead>
                <tbody>
                    {sideProducts.map((sp, idx) => (
                        <tr key={sp.product_code}>
                            <td>
                                {sp.product_name}
                                {sp.is_auto && <span className="badge badge-info" style={{ marginLeft: 8, fontSize: '0.65rem' }}>Auto 15%</span>}
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={sp.quantity || ''}
                                    onChange={e => onUpdate(idx, 'quantity', parseFloat(e.target.value) || 0)}
                                    style={{ width: 100, textAlign: 'right' }}
                                    step="0.01"
                                />
                            </td>
                            <td style={{ textAlign: 'right' }}>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={sp.unit_price || ''}
                                    onChange={e => onUpdate(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                    style={{ width: 120, textAlign: 'right' }}
                                    placeholder="Rp"
                                />
                            </td>
                            <td style={{ textAlign: 'right', fontWeight: 500 }}>
                                {formatCurrency(sp.quantity * sp.unit_price)}
                            </td>
                        </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                        <td colSpan={3} style={{ fontWeight: 600 }}>Total Side Product Revenue</td>
                        <td style={{ textAlign: 'right', fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(sideProductRevenue)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
);

export default SideProductSection;
