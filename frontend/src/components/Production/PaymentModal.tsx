import { useState } from 'react';
import { materialReceiptApi } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface PaymentModalProps {
    receiptId: number;
    onClose: () => void;
    onSuccess: () => void;
}

const PaymentModal = ({ receiptId, onClose, onSuccess }: PaymentModalProps) => {
    const { showSuccess, showError } = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        payment_method: 'TRANSFER',
        payment_reference: ''
    });

    const handleSubmit = async () => {
        setLoading(true);
        try {
            await materialReceiptApi.markAsPaid(receiptId, formData);
            showSuccess('Berhasil', 'Pembayaran berhasil dicatat');
            onSuccess();
            onClose();
        } catch (error: any) {
            showError('Gagal', error.response?.data?.error?.message || error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal" style={{ maxWidth: 400 }}>
                <div className="modal-header"><h3>Catat Pembayaran</h3></div>
                <div className="modal-body">
                    <div className="form-group">
                        <label className="form-label">Metode Pembayaran</label>
                        <select className="form-input form-select" value={formData.payment_method}
                            onChange={e => setFormData({ ...formData, payment_method: e.target.value })}>
                            <option value="CASH">Tunai</option>
                            <option value="TRANSFER">Transfer Bank</option>
                            <option value="CHECK">Cek</option>
                            <option value="GIRO">Giro</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Nomor Referensi</label>
                        <input type="text" className="form-input" placeholder="Nomor transfer/cek/giro..."
                            value={formData.payment_reference}
                            onChange={e => setFormData({ ...formData, payment_reference: e.target.value })} />
                    </div>
                </div>
                <div className="modal-footer" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                    <button className="btn btn-secondary" onClick={onClose}>Batal</button>
                    <button className="btn btn-primary" onClick={handleSubmit} disabled={loading}>
                        {loading ? 'Menyimpan...' : 'Simpan Pembayaran'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentModal;
