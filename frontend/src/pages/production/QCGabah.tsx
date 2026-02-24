import { useState } from 'react';
import { qcGabahApi } from '../../services/api';
import { logger } from '../../utils/logger';
import { useToast } from '../../contexts/ToastContext';

interface AnalysisResult {
    green_percentage: number;
    yellow_percentage: number;
    damaged_percentage?: number;
    rotten_percentage?: number;
    defect_percentage?: number;
    red_percentage?: number;
    chalky_percentage?: number;
    normal_percentage?: number;
    grade: string;
    status: string;
    level: number;
}

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
    'KW 1': { bg: 'rgba(34, 197, 94, 0.1)', text: '#166534', border: '#22c55e' },
    'KW 2': { bg: 'rgba(234, 179, 8, 0.1)', text: '#854d0e', border: '#eab308' },
    'KW 3': { bg: 'rgba(239, 68, 68, 0.1)', text: '#991b1b', border: '#ef4444' },
    'REJECT': { bg: 'rgba(127, 29, 29, 0.15)', text: '#7f1d1d', border: '#dc2626' },
};

const COLOR_BAR_ITEMS = [
    { key: 'yellow_percentage', label: 'Kuning (Baik)', color: '#eab308' },
    { key: 'green_percentage', label: 'Hijau (Mentah)', color: '#22c55e' },
    { key: 'damaged_percentage', label: 'Rusak', color: '#a16207' },
    { key: 'rotten_percentage', label: 'Busuk', color: '#1c1917' },
    { key: 'red_percentage', label: 'Merah', color: '#ef4444' },
    { key: 'chalky_percentage', label: 'Kapur', color: '#d1d5db' },
    { key: 'normal_percentage', label: 'Lainnya', color: '#94a3b8' },
] as const;

const QCGabah = () => {
    const { showError, showSuccess } = useToast();
    const [loading, setLoading] = useState(false);
    const [_imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    // Form Inputs
    const [supplier, setSupplier] = useState('');
    const [lot, setLot] = useState('');

    // Result
    const [result, setResult] = useState<AnalysisResult | null>(null);
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

    const gradeStyle = result ? (GRADE_COLORS[result.grade] || GRADE_COLORS['KW 3']) : null;

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
                        {result && gradeStyle ? (
                            <div>
                                {/* Grade Display */}
                                <div style={{ textAlign: 'center', marginBottom: 24 }}>
                                    <div style={{
                                        background: gradeStyle.bg,
                                        color: gradeStyle.text,
                                        padding: '32px 24px',
                                        borderRadius: 16,
                                        display: 'inline-block',
                                        minWidth: 240,
                                        border: `2px solid ${gradeStyle.border}`
                                    }}>
                                        <div style={{ fontSize: '0.875rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 8, opacity: 0.8 }}>
                                            Predicted Grade
                                        </div>
                                        <div style={{ fontSize: '3.5rem', fontWeight: 800, lineHeight: 1 }}>
                                            {result.grade}
                                        </div>
                                        {result.level > 0 && (
                                            <div style={{ fontSize: '1.25rem', fontWeight: 600, marginTop: 4, opacity: 0.7 }}>
                                                Level {result.level}
                                            </div>
                                        )}
                                        <div style={{
                                            marginTop: 12,
                                            padding: '4px 16px',
                                            borderRadius: 20,
                                            fontSize: '0.85rem',
                                            fontWeight: 700,
                                            display: 'inline-block',
                                            background: result.status === 'OK' ? 'rgba(34,197,94,0.2)' :
                                                result.status === 'REJECTED' ? 'rgba(239,68,68,0.2)' : 'rgba(234,179,8,0.2)',
                                            color: result.status === 'OK' ? '#166534' :
                                                result.status === 'REJECTED' ? '#991b1b' : '#854d0e',
                                        }}>
                                            {result.status}
                                        </div>
                                    </div>
                                </div>

                                {/* Stacked Color Bar */}
                                <div style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Distribusi Warna</span>
                                    </div>
                                    <div style={{
                                        height: 28,
                                        borderRadius: 8,
                                        overflow: 'hidden',
                                        display: 'flex',
                                        background: 'var(--bg-surface-secondary)',
                                        border: '1px solid var(--border-color)'
                                    }}>
                                        {COLOR_BAR_ITEMS.map(item => {
                                            const val = (result as any)[item.key] ?? 0;
                                            if (val <= 0) return null;
                                            return (
                                                <div
                                                    key={item.key}
                                                    title={`${item.label}: ${val}%`}
                                                    style={{
                                                        width: `${val}%`,
                                                        background: item.color,
                                                        transition: 'width 1s ease-out',
                                                        position: 'relative',
                                                        minWidth: val > 3 ? 'auto' : 0
                                                    }}
                                                >
                                                    {val >= 8 && (
                                                        <span style={{
                                                            position: 'absolute',
                                                            inset: 0,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            color: ['#eab308', '#d1d5db'].includes(item.color) ? '#000' : '#fff',
                                                        }}>
                                                            {val}%
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Color Legend */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                                    gap: 8,
                                    marginBottom: 20,
                                }}>
                                    {COLOR_BAR_ITEMS.map(item => {
                                        const val = (result as any)[item.key] ?? 0;
                                        return (
                                            <div key={item.key} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                padding: '6px 10px',
                                                borderRadius: 8,
                                                background: val > 0 ? 'var(--bg-surface-secondary)' : 'transparent',
                                                opacity: val > 0 ? 1 : 0.4,
                                            }}>
                                                <div style={{
                                                    width: 12, height: 12, borderRadius: 3,
                                                    background: item.color,
                                                    border: item.color === '#d1d5db' ? '1px solid var(--border-color)' : 'none',
                                                    flexShrink: 0,
                                                }} />
                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.label}</span>
                                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)', marginLeft: 'auto' }}>{val}%</span>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Defect Warning */}
                                {(result.defect_percentage ?? 0) > 0 && (
                                    <div style={{
                                        padding: '12px 16px',
                                        borderRadius: 10,
                                        marginBottom: 16,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 12,
                                        background: (result.defect_percentage ?? 0) > 10
                                            ? 'rgba(239, 68, 68, 0.1)'
                                            : (result.defect_percentage ?? 0) > 5
                                                ? 'rgba(234, 179, 8, 0.1)'
                                                : 'rgba(59, 130, 246, 0.1)',
                                        border: `1px solid ${(result.defect_percentage ?? 0) > 10
                                            ? 'rgba(239, 68, 68, 0.3)'
                                            : (result.defect_percentage ?? 0) > 5
                                                ? 'rgba(234, 179, 8, 0.3)'
                                                : 'rgba(59, 130, 246, 0.3)'}`,
                                    }}>
                                        <span className="material-symbols-outlined" style={{
                                            fontSize: 20,
                                            color: (result.defect_percentage ?? 0) > 10 ? '#ef4444' :
                                                (result.defect_percentage ?? 0) > 5 ? '#eab308' : '#3b82f6',
                                        }}>
                                            {(result.defect_percentage ?? 0) > 10 ? 'error' : 'warning'}
                                        </span>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>
                                                Defect Total: {result.defect_percentage}%
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                                                Rusak: {result.damaged_percentage ?? 0}% · Busuk: {result.rotten_percentage ?? 0}%
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Info */}
                                <div className="alert alert-info">
                                    <span className="material-symbols-outlined icon-sm">info</span>
                                    <p style={{ fontSize: '0.85rem' }}>
                                        Grade ditentukan dari 3 faktor: persentase kuning (min), defect/kerusakan (maks), dan butir hijau/mentah (maks). Grade = worst-case dari ketiga faktor.
                                    </p>
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
