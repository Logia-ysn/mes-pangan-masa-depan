import { useState } from 'react';
import { qcGabahApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';

const QCGabah = () => {
    const { showError, showSuccess } = useToast();
    const [loading, setLoading] = useState(false);
    const [_imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form Inputs
    const [supplier, setSupplier] = useState('');
    const [lot, setLot] = useState('');

    // Result
    const [result, setResult] = useState<{
        green_percentage: number;
        grade: string;
        status: string;
    } | null>(null);

    const [_error, setError] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setImageFile(file);

            // Preview
            const reader = new FileReader();
            reader.onload = (ev) => {
                setImagePreview(ev.target?.result as string);
            };
            reader.readAsDataURL(file);

            // Reset result when new file chosen
            setResult(null);
            setError(null);
        }
    };

    const handleAnalyze = async () => {
        if (!imagePreview) return;

        setLoading(true);
        setError(null);

        try {
            const res = await qcGabahApi.analyze({
                image_base64: imagePreview,
                supplier,
                lot
            });

            setResult(res.data);
            showSuccess('Analisis Berhasil', 'Kualitas gabah telah teridentifikasi');
        } catch (err: any) {
            logger.error(err);
            const errorMessage = err.response?.data?.error || err.message || "Failed to analyze image";
            setError(errorMessage);
            showError('Analisis Gagal', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="page-content">
            <div className="grid-2">
                {/* Input Section */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Upload Sampel</h3>
                        <p className="card-subtitle">Analisis berbasis AI Vision</p>
                    </div>
                    <div style={{ padding: 24 }}>
                        <div className="form-group">
                            <label className="form-label">Supplier</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Nama Supplier"
                                value={supplier}
                                onChange={(e) => setSupplier(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Lot / Batch Code</label>
                            <input
                                type="text"
                                className="form-input"
                                placeholder="Kode Lot"
                                value={lot}
                                onChange={(e) => setLot(e.target.value)}
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Foto Sampel</label>
                            <div style={{
                                border: '2px dashed var(--border-color)',
                                borderRadius: 12,
                                padding: 24,
                                textAlign: 'center',
                                cursor: 'pointer',
                                background: 'var(--bg-surface-secondary)',
                                transition: 'all 0.2s ease'
                            }} onClick={() => document.getElementById('file-upload')?.click()}>

                                {imagePreview ? (
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8, boxShadow: 'var(--shadow-sm)' }}
                                    />
                                ) : (
                                    <div style={{ padding: 40 }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>add_photo_alternate</span>
                                        <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Klik atau seret foto ke sini</p>
                                    </div>
                                )}

                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>

                        <button
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '12px', justifyContent: 'center' }}
                            disabled={!imagePreview || loading}
                            onClick={handleAnalyze}
                        >
                            {loading ? (
                                <>
                                    <span className="material-symbols-outlined spin" style={{ marginRight: 8 }}>refresh</span>
                                    Menganalisis...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined" style={{ marginRight: 8 }}>analytics</span>
                                    Analisis Kualitas
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Result Section */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Hasil Analisis</h3>
                        <p className="card-subtitle">Estimasi kualitas berdasarkan visual</p>
                    </div>
                    <div style={{ padding: 24 }}>
                        {result ? (
                            <div style={{ textAlign: 'center' }}>
                                <div style={{
                                    background: result.grade === 'KW 1' ? 'rgba(34, 197, 94, 0.1)' : result.grade === 'KW 2' ? 'rgba(234, 179, 8, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    color: result.grade === 'KW 1' ? '#166534' : result.grade === 'KW 2' ? '#854d0e' : '#991b1b',
                                    padding: '32px 24px',
                                    borderRadius: 16,
                                    display: 'inline-block',
                                    marginBottom: 24,
                                    minWidth: 240,
                                    border: '1px solid currentColor'
                                }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>Predicted Grade</div>
                                    <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>{result.grade}</div>
                                    <div style={{ fontSize: '1rem', fontWeight: 600, marginTop: 12 }}>{result.status}</div>
                                </div>

                                <div style={{ textAlign: 'left', marginTop: 16 }}>
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <span style={{ fontWeight: 500, color: 'var(--text-secondary)' }}>Prosentase Butir Hijau</span>
                                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{result.green_percentage}%</span>
                                        </div>
                                        <div style={{ height: 12, background: 'var(--bg-surface-secondary)', borderRadius: 6, overflow: 'hidden' }}>
                                            <div style={{
                                                width: `${Math.min(result.green_percentage, 100)}%`,
                                                height: '100%',
                                                background: result.green_percentage < 10 ? '#22c55e' : result.green_percentage < 20 ? '#eab308' : '#ef4444',
                                                transition: 'width 1s ease-out'
                                            }} />
                                        </div>
                                    </div>

                                    <div className="alert alert-info">
                                        <span className="material-symbols-outlined icon-sm">info</span>
                                        <p style={{ fontSize: '0.85rem' }}>
                                            Semakin rendah persentase butir hijau, semakin baik kualitas gabah. Max 10% untuk grade KW 1.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                alignItems: 'center',
                                opacity: 0.5,
                                minHeight: 300,
                                textAlign: 'center'
                            }}>
                                <div style={{
                                    width: 80, height: 80, borderRadius: '50%',
                                    background: 'var(--bg-surface-secondary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 16
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 40 }}>query_stats</span>
                                </div>
                                <h3>Belum Ada Data</h3>
                                <p>Silakan upload foto dan klik tombol analisis</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QCGabah;
