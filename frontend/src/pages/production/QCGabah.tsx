import { useState } from 'react';
import Header from '../../components/Layout/Header';
import { qcGabahApi } from '../../services/api';

const QCGabah = () => {
    const [loading, setLoading] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
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

    const [error, setError] = useState<string | null>(null);

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
        } catch (err: any) {
            console.error(err);
            // Check for response data error (Backend error message)
            const errorMessage = err.response?.data?.error || err.message || "Failed to analyze image";
            setError(errorMessage);
            alert(`Analysis Failed: ${errorMessage}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: 24, paddingBottom: 100 }}>
            <Header
                title="QC Gabah - Green Detection"
                subtitle="Analisis kualitas gabah berbasis Machine Learning (Kadar Hijau)"
            />

            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 24 }}>
                {/* Input Section */}
                <div className="card" style={{ flex: 1, minWidth: 300, padding: 24 }}>
                    <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Upload Sampel</h3>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Supplier</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Nama Supplier"
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Lot / Batch Code</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="Kode Lot"
                            value={lot}
                            onChange={(e) => setLot(e.target.value)}
                        />
                    </div>

                    <div style={{ marginBottom: 24 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>Foto Sampel</label>
                        <div style={{
                            border: '2px dashed var(--border-color)',
                            borderRadius: 8,
                            padding: 24,
                            textAlign: 'center',
                            cursor: 'pointer',
                            background: 'var(--bg-surface-secondary)'
                        }} onClick={() => document.getElementById('file-upload')?.click()}>

                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    style={{ maxWidth: '100%', maxHeight: 300, borderRadius: 8 }}
                                />
                            ) : (
                                <div style={{ padding: 40 }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>add_photo_alternate</span>
                                    <p style={{ marginTop: 8, color: 'var(--text-secondary)' }}>Klik untuk upload foto gabah</p>
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
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <span className="material-symbols-outlined" style={{ marginRight: 8 }}>analytics</span>
                                Analyze Quality
                            </>
                        )}
                    </button>

                    {error && (
                        <div style={{ marginTop: 16, padding: 12, background: '#fee2e2', color: '#dc2626', borderRadius: 8, fontSize: '0.9rem' }}>
                            {error}
                        </div>
                    )}
                </div>

                {/* Result Section */}
                <div className="card" style={{ flex: 1, minWidth: 300, padding: 24 }}>
                    <h3 style={{ marginBottom: 20, fontSize: '1.1rem' }}>Hasil Analisis</h3>

                    {result ? (
                        <div style={{ textAlign: 'center' }}>
                            <div style={{
                                background: result.grade === 'KW 1' ? '#dcfce7' : result.grade === 'KW 2' ? '#fef9c3' : '#fee2e2',
                                color: result.grade === 'KW 1' ? '#166534' : result.grade === 'KW 2' ? '#854d0e' : '#991b1b',
                                padding: '24px',
                                borderRadius: 16,
                                display: 'inline-block',
                                marginBottom: 24,
                                minWidth: 200
                            }}>
                                <div style={{ fontSize: '0.9rem', fontWeight: 600, textTransform: 'uppercase', marginBottom: 4 }}>Predicted Grade</div>
                                <div style={{ fontSize: '3rem', fontWeight: 800 }}>{result.grade}</div>
                                <div style={{ fontSize: '1.1rem', fontWeight: 600, marginTop: 8 }}>Reference: {result.status}</div>
                            </div>

                            <div style={{ textAlign: 'left', marginTop: 16 }}>
                                <div style={{ marginBottom: 16 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                        <span style={{ fontWeight: 500 }}>Prosentase Butir Hijau</span>
                                        <span style={{ fontWeight: 700 }}>{result.green_percentage}%</span>
                                    </div>
                                    <div style={{ height: 12, background: '#e5e7eb', borderRadius: 6, overflow: 'hidden' }}>
                                        <div style={{
                                            width: `${Math.min(result.green_percentage, 100)}%`,
                                            height: '100%',
                                            background: result.green_percentage < 10 ? '#22c55e' : result.green_percentage < 20 ? '#eab308' : '#ef4444'
                                        }} />
                                    </div>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 8 }}>
                                        * Semakin rendah persentase butir hijau, semakin baik kualitas gabah.
                                        (Max 10% untuk KW 1)
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
                            minHeight: 300
                        }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 64, marginBottom: 16 }}>query_stats</span>
                            <p>Upload foto dan klik Analyze untuk melihat hasil</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QCGabah;
