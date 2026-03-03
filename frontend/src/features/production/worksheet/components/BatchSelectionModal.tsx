/**
 * BatchSelectionModal Component
 * Extracted from WorksheetForm.tsx — modal for selecting raw material batches
 */

import { useState, useEffect } from 'react';
import api from '../../../../services/api';
import { formatNumber, formatCurrency } from '../../../../utils/formatUtils';
import { logger } from '../../../../utils/logger';
import type { Stock, ReceiptBatch } from '../types/worksheet.types';

interface BatchSelectionModalProps {
    stocks: Stock[];
    selectedFactory: number | null;
    onSelect: (stock: Stock, quantity: number, unitPrice: number, batchLabel: string, rawBatchId?: string) => void;
    onClose: () => void;
}

const BatchSelectionModal = ({ stocks, selectedFactory, onSelect, onClose }: BatchSelectionModalProps) => {
    const [receiptBatches, setReceiptBatches] = useState<ReceiptBatch[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedBatch, setSelectedBatch] = useState<ReceiptBatch | null>(null);
    const [quantity, setQuantity] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch receipt batches on mount
    useEffect(() => {
        const fetchBatches = async () => {
            try {
                // Get all stock movements for this factory with reference_type = RAW_MATERIAL_RECEIPT
                const params: Record<string, string | number> = {
                    reference_type: 'RAW_MATERIAL_RECEIPT',
                    movement_type: 'IN',
                    limit: 200
                };
                const res = await api.get('/stock-movements', { params });
                const rawData = res.data?.data?.data || res.data?.data || res.data || [];
                const movements = Array.isArray(rawData) ? rawData : (rawData.data || []);

                // Parse notes JSON and build batch list
                interface MovementRecord {
                    id: number;
                    id_stock: number;
                    quantity: number;
                    notes?: string;
                    created_at: string;
                    Stock?: {
                        id_factory?: number;
                        quantity?: number;
                        ProductType?: { name?: string; code?: string };
                    };
                }
                const batches: ReceiptBatch[] = (movements as MovementRecord[])
                    .filter((m) => {
                        // Filter by factory via Stock relation
                        const stock = m.Stock;
                        return stock && (!selectedFactory || stock.id_factory === selectedFactory);
                    })
                    .map((m) => {
                        let noteData: Record<string, unknown> = {};
                        try {
                            noteData = JSON.parse(m.notes || '{}');
                        } catch { noteData = {}; }

                        const stock = m.Stock;
                        return {
                            id: m.id,
                            id_stock: m.id_stock,
                            batchId: String(noteData.batchId || `MOV-${m.id}`),
                            supplier: String(noteData.supplier || '-'),
                            category: String(noteData.category || '-'),
                            productName: String(stock?.ProductType?.name || noteData.category || 'Unknown'),
                            productCode: String(stock?.ProductType?.code || '-'),
                            qualityGrade: String(noteData.qualityGrade || '-'),
                            quantity: Number(m.quantity),
                            pricePerKg: Number(noteData.pricePerKg) || 0,
                            otherCosts: Number(noteData.otherCosts) || 0,
                            dateReceived: m.created_at,
                            stockQuantity: Number(stock?.quantity) || 0
                        };
                    });

                setReceiptBatches(batches);
            } catch (error) {
                logger.error('Error fetching receipt batches:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBatches();
    }, [selectedFactory]);

    // Filter batches by search
    const filteredBatches = searchTerm
        ? receiptBatches.filter(b =>
            b.batchId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.productName.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : receiptBatches;

    const handleSelectBatch = (batch: ReceiptBatch) => {
        setSelectedBatch(batch);
        setQuantity(''); // Reset qty
    };

    // Max available = aggregate stock quantity for this product
    const maxAvailable = selectedBatch
        ? stocks.find(s => s.id === selectedBatch.id_stock)?.quantity || 0
        : 0;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 750 }}>
                <div className="modal-header">
                    <h3 className="modal-title">Pilih Batch Bahan Baku</h3>
                    <button className="modal-close" onClick={onClose}>
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <div className="modal-body">
                    {/* Search */}
                    <div className="form-group" style={{ marginBottom: 12 }}>
                        <div style={{ position: 'relative' }}>
                            <span className="material-symbols-outlined" style={{
                                position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                                color: 'var(--text-muted)', fontSize: 18
                            }}>search</span>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Cari batch ID, supplier, atau material..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                style={{ paddingLeft: 40 }}
                            />
                        </div>
                    </div>

                    {/* Batch List */}
                    <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 8 }}>
                        {loading ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined animate-spin" style={{ display: 'inline-block' }}>sync</span>
                                <p>Memuat data batch...</p>
                            </div>
                        ) : filteredBatches.length === 0 ? (
                            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>
                                <span className="material-symbols-outlined" style={{ fontSize: 32 }}>inventory</span>
                                <p>Tidak ada batch penerimaan ditemukan</p>
                            </div>
                        ) : (
                            <table className="table" style={{ margin: 0 }}>
                                <thead>
                                    <tr>
                                        <th>Batch ID</th>
                                        <th>Material</th>
                                        <th>Supplier</th>
                                        <th>Grade</th>
                                        <th style={{ textAlign: 'right' }}>Qty Terima</th>
                                        <th style={{ textAlign: 'right' }}>Harga/kg</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBatches.map(batch => (
                                        <tr
                                            key={batch.id}
                                            onClick={() => handleSelectBatch(batch)}
                                            style={{
                                                cursor: 'pointer',
                                                background: selectedBatch?.id === batch.id
                                                    ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                                                borderLeft: selectedBatch?.id === batch.id
                                                    ? '3px solid var(--primary)' : '3px solid transparent'
                                            }}
                                        >
                                            <td>
                                                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{batch.batchId}</span>
                                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                                    {new Date(batch.dateReceived).toLocaleDateString('id-ID')}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>{batch.productCode}</span>
                                                {' '}{batch.productName}
                                            </td>
                                            <td style={{ fontSize: '0.85rem' }}>{batch.supplier}</td>
                                            <td>
                                                <span className="badge badge-muted">{batch.qualityGrade}</span>
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace' }}>
                                                {formatNumber(batch.quantity)} kg
                                            </td>
                                            <td style={{ textAlign: 'right', fontFamily: 'monospace', fontWeight: 600 }}>
                                                {batch.pricePerKg > 0 ? formatCurrency(batch.pricePerKg) : '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Selected Batch Detail + Qty Input */}
                    {selectedBatch && (
                        <div style={{
                            marginTop: 16, padding: 16, borderRadius: 8,
                            border: '2px solid var(--primary)',
                            background: 'rgba(59, 130, 246, 0.03)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                                <div>
                                    <strong>{selectedBatch.batchId}</strong> — {selectedBatch.productName}
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                        Supplier: {selectedBatch.supplier} | Grade: {selectedBatch.qualityGrade}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                                        {formatCurrency(selectedBatch.pricePerKg + (selectedBatch.otherCosts / (selectedBatch.quantity || 1)))}/kg
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                        Base: {formatCurrency(selectedBatch.pricePerKg)} | Biaya: {formatCurrency(selectedBatch.otherCosts / (selectedBatch.quantity || 1))}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
                                        Stok tersedia: {formatNumber(maxAvailable)} kg
                                    </div>
                                </div>
                            </div>

                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Jumlah yang dipakai (kg) *</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    max={maxAvailable}
                                    placeholder={`Max: ${formatNumber(maxAvailable)} kg`}
                                    step="0.01"
                                    style={{ fontSize: '1.1rem', fontWeight: 600 }}
                                    autoFocus
                                />
                                {quantity && parseFloat(quantity) > 0 && (
                                    <small style={{ color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                                        Total biaya: <strong style={{ color: 'var(--primary)' }}>
                                            {formatCurrency(parseFloat(quantity) * selectedBatch.pricePerKg)}
                                        </strong>
                                    </small>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <div className="modal-footer">
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            if (!selectedBatch || !quantity) return;
                            const stock = stocks.find(s => s.id === selectedBatch.id_stock);
                            if (!stock) return;
                            const qty = parseFloat(quantity);
                            const batchLabel = `${selectedBatch.batchId} - ${selectedBatch.productName}`;
                            const basePrice = selectedBatch.pricePerKg || 0;
                            const totalOtherCosts = selectedBatch.otherCosts || 0;
                            const totalReceivedQty = selectedBatch.quantity || 1;
                            const overheadPerKg = totalOtherCosts / totalReceivedQty;
                            const landedPricePerKg = basePrice + overheadPerKg;

                            onSelect(stock, qty, landedPricePerKg, batchLabel, selectedBatch.batchId);
                        }}
                        disabled={!selectedBatch || !quantity || parseFloat(quantity) <= 0}
                    >
                        <span className="material-symbols-outlined icon-sm">add</span>
                        Tambah Batch
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BatchSelectionModal;
