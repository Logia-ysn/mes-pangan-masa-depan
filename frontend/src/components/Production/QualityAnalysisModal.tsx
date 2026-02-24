import { useState, useEffect } from 'react';
import { qualityParameterApi, qualityAnalysisApi, qcGabahApi } from '../../services/api';
import { logger } from '../../utils/logger';

interface QualityAnalysisModalProps {
    batchId: string;
    stockMovementId?: number; // Optional, if editing existing
    varietyId?: string; // Changed to string to match form data
    varietyName?: string;
    initialData?: {
        moisture: string;
        density: string;
        grade: string;
    };
    onClose: () => void;
    onSave: (data: any) => void; // Pass data back to parent
}

const QualityAnalysisModal = ({ batchId, stockMovementId, varietyId, varietyName, initialData, onClose, onSave }: QualityAnalysisModalProps) => {
    const [loading, setLoading] = useState(false);
    const [config, setConfig] = useState<any[]>([]);

    // Quality Parameters State
    const [moisture, setMoisture] = useState<string>(initialData?.moisture || '');
    const [sampleWeight, setSampleWeight] = useState<string>(''); // Sample weight in grams
    const [density, setDensity] = useState<string>(initialData?.density || '');
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    // Calculated Grades (Client-side preview)
    const [moistureGrade, setMoistureGrade] = useState('-');
    const [densityGrade, setDensityGrade] = useState('-');
    const [colorGrade, setColorGrade] = useState('-'); // Default to unanalyzed (Out of Range)
    const [finalGrade, setFinalGrade] = useState(initialData?.grade || '-');
    const [totalScore, setTotalScore] = useState<number>(0);

    useEffect(() => {
        fetchConfig();
    }, [varietyId]);

    // Calculate Density automatically
    // Formula: Dry Weight = Weight * (1 - Moisture/100)
    //          Density = Dry Weight / 500 (ukuran gelas ukur)
    // Results in g/ml (standard range 0.6 - 1.0)
    useEffect(() => {
        const m = parseFloat(moisture);
        const w = parseFloat(sampleWeight);

        if (!isNaN(m) && !isNaN(w) && w > 0) {
            const dryWeight = w * (1 - (m / 100));
            const calculatedDensity = dryWeight / 500; // g/ml

            setDensity(calculatedDensity.toFixed(3));
        } else {
            setDensity('');
        }
    }, [moisture, sampleWeight]);


    useEffect(() => {
        if (config.length > 0) calculateGrades();
    }, [moisture, density, config, colorGrade]);

    const fetchConfig = async () => {
        try {
            // Always fetch global params first (params without id_variety)
            const globalRes = await qualityParameterApi.getAll();
            const allParams = globalRes.data?.data || [];

            // Separate global params (no variety) from variety-specific
            const globalParams = allParams.filter((p: any) => !p.id_variety);

            // Fetch variety-specific params if varietyId is selected
            let varietyParams: any[] = [];
            if (varietyId) {
                varietyParams = allParams.filter((p: any) => p.id_variety === parseInt(varietyId));
            }

            // Merge logic:
            // 1. For Visual Analysis (Color/GreenPercentage) -> ALWAYS Global Only
            // 2. For others (Moisture/Density) -> Variety Specific > Global
            const mergedConfig: any[] = [];
            const grades = ['KW 1', 'KW 2', 'KW 3'];
            const types = ['Moisture', 'Density', 'Color', 'GreenPercentage'];

            for (const type of types) {
                const isVisual = type === 'Color' || type === 'GreenPercentage';

                for (const grade of grades) {
                    if (isVisual) {
                        // Global Only
                        const gParams = globalParams.filter((p: any) => p.name === type && p.grade === grade);
                        mergedConfig.push(...gParams);
                    } else {
                        // Variety Specific > Global
                        const vParams = varietyParams.filter((p: any) => p.name === type && p.grade === grade);
                        if (vParams.length > 0) {
                            mergedConfig.push(...vParams);
                        } else {
                            const gParams = globalParams.filter((p: any) => p.name === type && p.grade === grade);
                            mergedConfig.push(...gParams);
                        }
                    }
                }
            }

            setConfig(mergedConfig);

            logger.log('Quality Config loaded:', mergedConfig.length, 'params', varietyId ? `(variety: ${varietyId})` : '(global fallback)');
        } catch (error) {
            logger.error('Failed to fetch quality config:', error);
        }
    };

    const determineGrade = (value: number, type: string) => {
        if (!value && value !== 0) return null;
        const params = config.filter((p: any) => p.name === type);
        for (const p of params) {
            if (value >= Number(p.min_value) && value <= Number(p.max_value)) {
                return { grade: p.grade, level: p.level || 1 };
            }
        }
        return { grade: 'Out of Range', level: 99 };
    };

    const calculateGrades = () => {
        const mVal = parseFloat(moisture);
        const dVal = parseFloat(density);

        const mResult = determineGrade(mVal, 'Moisture');
        const dResult = determineGrade(dVal, 'Density');

        // Format display string e.g., "KW 1:2"
        const formatResult = (res: any) => {
            if (!res) return '-';
            if (res.grade === 'Out of Range') return 'Out of Range';
            // Always show level, even if it is 1
            return `${res.grade}:${res.level}`;
        }

        setMoistureGrade(formatResult(mResult));
        setDensityGrade(formatResult(dResult));

        // Helper: Convert Grade:Level to Points
        const getPoints = (res: { grade: string, level: number } | null) => {
            if (!res) return 0;
            if (res.grade === 'REJECT' || res.grade === 'Out of Range') return 1;

            const map: Record<string, number> = {
                'KW 1:1': 10, 'KW 1:2': 9, 'KW 1:3': 8,
                'KW 2:1': 7, 'KW 2:2': 6, 'KW 2:3': 5,
                'KW 3:1': 4, 'KW 3:2': 3, 'KW 3:3': 2
            };
            const key = `${res.grade}:${res.level}`;
            return map[key] || 1; // Default to reject if unknown
        };


        // Parse Color Result - Default to "Out of Range" if not analyzed
        let cResult: { grade: string, level: number } = { grade: 'Out of Range', level: 99 };
        if (colorGrade && colorGrade !== '-' && colorGrade !== 'Analyzing...' && colorGrade !== 'Error' && colorGrade !== 'Out of Range') {
            const parts = colorGrade.split(':');
            const gradePart = parts[0].trim();
            const levelPart = parts[1] ? parseInt(parts[1]) : 1;
            // Validate that it's a known grade
            if (gradePart.startsWith('KW')) {
                cResult = { grade: gradePart, level: levelPart };
            }
        }

        const pA = getPoints(mResult);
        const pB = getPoints(dResult);
        const pC = getPoints(cResult);

        const totalPoints = pA + pB + pC;
        setTotalScore(totalPoints);

        // Define Reference Values (Nilai Acuan) mappings
        // Based on user matrix: 30->KW1:1, 27->KW1:2, 24->KW1:3, etc.
        const references = [
            { score: 30, grade: 'KW 1', level: 1 },
            { score: 27, grade: 'KW 1', level: 2 },
            { score: 24, grade: 'KW 1', level: 3 },
            { score: 21, grade: 'KW 2', level: 1 },
            { score: 18, grade: 'KW 2', level: 2 },
            { score: 15, grade: 'KW 2', level: 3 },
            { score: 12, grade: 'KW 3', level: 1 },
            { score: 9, grade: 'KW 3', level: 2 },
            { score: 6, grade: 'KW 3', level: 3 },
            { score: 3, grade: 'REJECT', level: 0 },
        ];

        // Find closest reference (Min Absolute Difference)
        let closest = references[references.length - 1];
        let minDiff = Infinity;

        // One rule from matrix: "25 lebih dekat dengan KW 1:3" (Ref 24).
        // 25 - 24 = 1. (Next ref is 27, diff is 2). Correct.
        // What if equidistant? E.g. 29 (between 30 and 27). Usually round up or down?
        // Let's assume standard rounding: 28.5 is midpoint.
        // Simple abs diff loop works. If tie, prefer higher score (top of list) or lower?
        // Logic usually prefers 'better' grade if equally close? Or strict math?
        // Let's iterate from Top (Best) to Bottom.

        for (const ref of references) {
            const diff = Math.abs(totalPoints - ref.score);
            if (diff < minDiff) {
                minDiff = diff;
                closest = ref;
            }
        }

        // Final Assignment
        if (closest.grade === 'REJECT') {
            setFinalGrade('REJECT');
        } else {
            setFinalGrade(`${closest.grade}:${closest.level}`);
        }

        // Log for debugging
        logger.log(`Calculation: A(${pA}) + B(${pB}) + C(${pC}) = ${totalPoints}. Closest Ref: ${closest.score} -> ${closest.grade}:${closest.level}`);
    };

    // State for ML Analysis
    const [greenPercentage, setGreenPercentage] = useState<number | null>(null);
    const [yellowPercentage, setYellowPercentage] = useState<number | null>(null);
    const [damagedPercentage, setDamagedPercentage] = useState<number | null>(null);
    const [rottenPercentage, setRottenPercentage] = useState<number | null>(null);
    const [defectPercentage, setDefectPercentage] = useState<number | null>(null);

    const analyzeImage = async (imageSrc: string) => {
        try {
            // Resize/Compress Image before sending to avoid 413 Payload Too Large
            const img = new Image();
            img.src = imageSrc;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                if (!ctx) return;

                // Max dimensions
                const MAX_WIDTH = 800;
                const MAX_HEIGHT = 800;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > MAX_WIDTH) {
                        height *= MAX_WIDTH / width;
                        width = MAX_WIDTH;
                    }
                } else {
                    if (height > MAX_HEIGHT) {
                        width *= MAX_HEIGHT / height;
                        height = MAX_HEIGHT;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to JPEG with 0.7 quality
                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);

                // Show loading indicator in Color Grade
                setColorGrade('Analyzing...');

                qcGabahApi.analyze({
                    image_base64: compressedBase64
                }).then((res) => {
                    const data = res.data;

                    // Format grade with level (e.g., "KW 1:2")
                    let displayGrade = data.grade;
                    if (data.level) {
                        displayGrade = `${data.grade}:${data.level}`;
                    }

                    setColorGrade(displayGrade);
                    setGreenPercentage(data.green_percentage ?? null);
                    setYellowPercentage(data.yellow_percentage ?? null);
                    setDamagedPercentage(data.damaged_percentage ?? null);
                    setRottenPercentage(data.rotten_percentage ?? null);
                    setDefectPercentage(data.defect_percentage ?? null);
                }).catch((error: any) => {
                    logger.error('ML Analysis Failed:', error);
                    const errorMessage = error.response?.data?.error || error.message || "Unknown Error";
                    setColorGrade('Error');
                    setGreenPercentage(null);
                    setYellowPercentage(null);
                    setDamagedPercentage(null);
                    setRottenPercentage(null);
                    setDefectPercentage(null);
                    alert(`ML Analysis Failed: ${errorMessage}`);
                })
            };

        } catch (err) {
            logger.error(err);
        }
    };

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);

            // Trigger Analysis
            analyzeImage(url);
        }
    };

    const handleFinalize = async () => {
        const data = {
            moisture,
            density,
            greenPercentage,
            yellowPercentage,
            qualityGrade: finalGrade,
            notes: 'Analyzed via Submodule'
        };

        // If we have a real stock movement (editing), save to backend
        if (stockMovementId) {
            setLoading(true);
            try {
                await qualityAnalysisApi.submit({
                    batch_id: batchId,
                    id_stock_movement: stockMovementId,
                    variety_id: parseInt(varietyId || '0'),
                    moisture_value: parseFloat(moisture),
                    density_value: parseFloat(density),
                    green_percentage: greenPercentage ?? 0,
                    yellow_percentage: yellowPercentage ?? 0,
                    damaged_percentage: damagedPercentage ?? undefined,
                    rotten_percentage: rottenPercentage ?? undefined,
                    defect_percentage: defectPercentage ?? undefined,
                    final_grade: finalGrade,
                    notes: `Auto Analysis. Color Grade: ${colorGrade}. Defect: ${defectPercentage ?? 0}%`
                });
                onSave(data);
                onClose();
            } catch (err) {
                logger.error(err);
                alert("Error saving analysis");
            } finally {
                setLoading(false);
            }
        } else {
            // Just pass back to form for new entries
            onSave(data);
            onClose();
        }
    };

    const getGradeColor = (grade: string) => {
        if (!grade || grade === '-') return '#9ca3af'; // Gray for unanalyzed
        if (grade === 'Out of Range' || grade === 'REJECT') return '#dc2626'; // Red for reject
        if (grade.startsWith('KW 1')) return '#22c55e'; // Green
        if (grade.startsWith('KW 2')) return '#eab308'; // Yellow
        if (grade.startsWith('KW 3')) return '#ef4444'; // Orange-Red
        return '#94a3b8';
    }

    return (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
            <div className="modal" style={{ maxWidth: 1000, width: '90%', maxHeight: '90vh', overflowY: 'auto', padding: 0 }}>
                {/* Header */}
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Raw Material Quality Analysis</h2>
                        <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Analyze batch quality parameters and generate final KW ratings.</p>
                    </div>
                </div>

                <div style={{ padding: 24, background: 'var(--bg-main)' }}>
                    {/* Top Info Bar */}
                    <div className="card mb-6" style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Select Batch ID</label>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{batchId || 'New Batch'}</div>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Analysis Date</label>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{new Date().toLocaleDateString()}</div>
                        </div>
                        <div>
                            <label className="form-label" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>Material Type</label>
                            <div style={{ fontWeight: 600, fontSize: '1rem' }}>{varietyName || '-'}</div>
                        </div>
                    </div>

                    {/* Metrics Grid */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>

                        {/* A: Moisture */}
                        <div className="card" style={{ padding: 20, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 700 }}>Kadar Air (A)</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Moisture Content</span>
                                </div>
                                <span className="badge badge-primary">METRIC A</span>
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label className="form-label">Value (%)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ fontSize: '2rem', height: 60, fontWeight: 700, color: 'var(--primary)' }}
                                    value={moisture}
                                    onChange={e => setMoisture(e.target.value)}
                                    placeholder="0.0"
                                />
                            </div>

                            <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{
                                    width: moistureGrade === 'Out of Range' ? 'auto' : 40,
                                    minWidth: 40,
                                    height: 40, borderRadius: 8,
                                    background: getGradeColor(moistureGrade),
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                                    padding: moistureGrade === 'Out of Range' ? '0 8px' : 0,
                                    fontSize: moistureGrade === 'Out of Range' ? '0.65rem' : '1rem'
                                }}>
                                    {moistureGrade === '-' ? '?' : moistureGrade === 'Out of Range' ? 'Out of Range' : moistureGrade.replace('KW ', '')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {moistureGrade.startsWith('KW 1') ? 'Standard Met' :
                                            moistureGrade === 'Out of Range' ? 'REJECT' : 'Check Standard'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Classification Result</div>
                                </div>
                            </div>
                        </div>

                        {/* B: Density */}
                        <div className="card" style={{ padding: 20, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 700 }}>Beras Densitas (B)</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Density Measurement</span>
                                </div>
                                <span className="badge" style={{ background: '#e0e7ff', color: '#4338ca' }}>METRIC B</span>
                            </div>

                            <div style={{ marginBottom: 12 }}>
                                <label className="form-label">Berat Sampel (gr)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    value={sampleWeight}
                                    onChange={e => setSampleWeight(e.target.value)}
                                    placeholder="e.g. 500"
                                />
                            </div>

                            <div style={{ marginBottom: 24 }}>
                                <label className="form-label">Calculated Density (g/ml)</label>
                                <input
                                    type="number"
                                    className="form-input"
                                    style={{ fontSize: '2rem', height: 60, fontWeight: 700, color: '#4338ca', background: 'var(--bg-surface)' }}
                                    value={density}
                                    readOnly
                                    placeholder="0"
                                />
                            </div>

                            <div style={{ background: 'var(--bg-surface)', padding: 12, borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center' }}>
                                <div style={{
                                    width: densityGrade === 'Out of Range' ? 'auto' : 40,
                                    minWidth: 40,
                                    height: 40, borderRadius: 8,
                                    background: getGradeColor(densityGrade),
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800,
                                    padding: densityGrade === 'Out of Range' ? '0 8px' : 0,
                                    fontSize: densityGrade === 'Out of Range' ? '0.65rem' : '1rem'
                                }}>
                                    {densityGrade === '-' ? '?' : densityGrade === 'Out of Range' ? 'Out of Range' : densityGrade.replace('KW ', '')}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                                        {densityGrade.startsWith('KW 1') ? 'Optimal Density' :
                                            densityGrade === 'Out of Range' ? 'REJECT' : 'Check Standard'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Classification Result</div>
                                </div>
                            </div>
                        </div>

                        {/* C: Color */}
                        <div className="card" style={{ padding: 20, position: 'relative' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                                <div>
                                    <h4 style={{ margin: 0, fontWeight: 700 }}>Warna (C)</h4>
                                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Visual Quality</span>
                                </div>
                                <span className="badge" style={{ background: '#ffedd5', color: '#9a3412' }}>METRIC C</span>
                            </div>

                            <div
                                style={{
                                    border: '2px dashed var(--border-color)',
                                    borderRadius: 12, height: 140,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: 16, cursor: 'pointer',
                                    background: previewUrl ? `url(${previewUrl}) center/cover` : 'white'
                                }}
                                onClick={() => document.getElementById('modal-img-upload')?.click()}
                            >
                                <input type="file" id="modal-img-upload" hidden accept="image/*" onChange={handleImageChange} />
                                {!previewUrl && (
                                    <>
                                        <span className="material-symbols-outlined" style={{ color: 'var(--text-muted)' }}>cloud_upload</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 8 }}>Drop sample image</span>
                                    </>
                                )}
                            </div>

                            {/* Mini Color Breakdown */}
                            {yellowPercentage !== null && (
                                <div style={{ height: 14, borderRadius: 4, overflow: 'hidden', display: 'flex', background: '#e5e7eb', marginBottom: 8 }}>
                                    {(yellowPercentage ?? 0) > 0 && <div style={{ width: `${yellowPercentage}%`, background: '#eab308' }} title={`Kuning: ${yellowPercentage}%`} />}
                                    {(greenPercentage ?? 0) > 0 && <div style={{ width: `${greenPercentage}%`, background: '#22c55e' }} title={`Hijau: ${greenPercentage}%`} />}
                                    {(damagedPercentage ?? 0) > 0 && <div style={{ width: `${damagedPercentage}%`, background: '#a16207' }} title={`Rusak: ${damagedPercentage}%`} />}
                                    {(rottenPercentage ?? 0) > 0 && <div style={{ width: `${rottenPercentage}%`, background: '#1c1917' }} title={`Busuk: ${rottenPercentage}%`} />}
                                </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                <div style={{ padding: '4px 0' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Kuning (Baik)</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#eab308' }}>{yellowPercentage !== null ? `${yellowPercentage}%` : '-'}</div>
                                </div>
                                <div style={{ padding: '4px 0' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hijau (Mentah)</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#22c55e' }}>{greenPercentage !== null ? `${greenPercentage}%` : '-'}</div>
                                </div>
                                <div style={{ padding: '4px 0' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Defect (Rusak+Busuk)</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: (defectPercentage ?? 0) > 5 ? '#ef4444' : '#3b82f6' }}>{defectPercentage !== null ? `${defectPercentage}%` : '-'}</div>
                                </div>
                                <div style={{ padding: '4px 0' }}>
                                    <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Grade Visual</div>
                                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{colorGrade === '-' ? 'N/A' : colorGrade}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Final Ribbon */}
                    <div style={{
                        background: 'linear-gradient(90deg, #2563eb, #1d4ed8)',
                        borderRadius: 12, color: 'white', padding: '24px 32px',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)'
                    }}>
                        <div>
                            <div style={{ fontSize: '0.875rem', opacity: 0.9, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 4 }}>Final Quality Rating</div>
                            <div style={{ fontSize: '2rem', fontWeight: 800 }}>Grade: {finalGrade === 'KW 1' ? 'Premium Choice' : finalGrade}</div>
                            <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: '0.875rem', opacity: 0.8 }}>
                                <span><span className="material-symbols-outlined icon-sm" style={{ verticalAlign: 'text-bottom' }}>schedule</span> Last calc: Just now</span>
                                <span><span className="material-symbols-outlined icon-sm" style={{ verticalAlign: 'text-bottom' }}>verified</span> Verified by System</span>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '4rem', fontWeight: 800, lineHeight: 1 }}>{finalGrade}</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                                <div style={{ fontSize: '1.25rem', fontWeight: 700, opacity: 0.9 }}>Score: {totalScore}</div>
                                <div className="badge" style={{ background: 'rgba(255,255,255,0.2)', color: 'white', border: 'none' }}>A+ RATING</div>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer */}
                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end', gap: 12, background: 'white' }}>
                    <button className="btn btn-ghost" onClick={onClose} style={{ border: '1px solid var(--border-color)' }}>Cancel & Reset</button>
                    <button className="btn btn-secondary" disabled>Save Analysis Record</button>
                    <button className="btn btn-primary" onClick={handleFinalize} disabled={loading}>
                        <span className="material-symbols-outlined icon-sm">check_circle</span>
                        Finalize & Release Batch
                    </button>
                </div>
            </div>
        </div>
    );
};

export default QualityAnalysisModal;
