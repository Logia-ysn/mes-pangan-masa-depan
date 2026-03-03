/**
 * HPPSummary Component
 * Extracted from WorksheetForm.tsx — displays cost breakdown + yield card
 */

import type { HPPCalculation } from '../types/worksheet.types';
import { formatCurrency, formatNumber } from '../../../../utils/formatUtils';

interface HPPSummaryProps {
    hppCalc: HPPCalculation;
    berasOutput: number;
    totalInputWeight: number;
    yieldPercentage: string;
    productionCostValue: string;
    onProductionCostChange: (value: string) => void;
}

const HPPSummary = ({
    hppCalc,
    berasOutput,
    totalInputWeight,
    yieldPercentage,
    productionCostValue,
    onProductionCostChange,
}: HPPSummaryProps) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Section 4: Cost & HPP */}
        <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <span className="material-symbols-outlined" style={{ color: 'var(--primary)', background: 'rgba(59, 130, 246, 0.1)', padding: 8, borderRadius: '50%' }}>calculate</span>
                <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>4. Cost & HPP</h3>
            </div>

            <div className="form-group">
                <label className="form-label">Production Cost (Rp)</label>
                <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={productionCostValue}
                    onChange={e => onProductionCostChange(e.target.value)}
                    style={{ textAlign: 'right' }}
                />
            </div>

            <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-elevated)', borderRadius: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Production Cost</span>
                    <span>{formatCurrency(hppCalc.productionCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--text-muted)' }}>+ Raw Material Cost</span>
                    <span>{formatCurrency(hppCalc.rawMaterialCost)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ color: 'var(--text-muted)' }}>- Side Product Revenue</span>
                    <span style={{ color: 'var(--success)' }}>({formatCurrency(hppCalc.sideProductRevenue)})</span>
                </div>
                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: '1.1rem' }}>
                        <span>HPP Total</span>
                        <span style={{ color: 'var(--primary)' }}>{formatCurrency(hppCalc.hpp)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>HPP per kg</span>
                        <span style={{ fontWeight: 500 }}>{berasOutput > 0 ? formatCurrency(hppCalc.hpp / berasOutput) : '-'}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Yield Stats */}
        <div style={{
            padding: 24,
            background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
            borderRadius: 12,
            border: '1px solid #bae6fd'
        }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1', textTransform: 'uppercase', letterSpacing: 1 }}>
                RENDEMEN (YIELD)
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: '#0284c7', marginTop: 8 }}>
                {yieldPercentage}%
            </div>
            <div style={{ fontSize: '0.75rem', color: '#0369a1' }}>
                {formatNumber(berasOutput)} kg dari {formatNumber(totalInputWeight)} kg
            </div>
        </div>
    </div>
);

export default HPPSummary;
