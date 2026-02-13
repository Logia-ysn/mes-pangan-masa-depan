import React from 'react';

export interface ProductionStep {
    id: string;
    label: string;
    status: 'completed' | 'in-progress' | 'pending';
    icon: string;
    date?: string;
    meta?: string; // e.g., "Est. 2h left"
}

interface ProductionProgressProps {
    steps: ProductionStep[];
}

const ProductionProgress: React.FC<ProductionProgressProps> = ({ steps }) => {
    return (
        <div className="card" style={{ marginBottom: 24 }}>
            <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="material-symbols-outlined" style={{ color: 'var(--primary)' }}>timeline</span>
                    <h3 className="card-title">Production Steps</h3>
                </div>
                <div className="badge badge-muted">Step {steps.filter(s => s.status === 'completed').length + (steps.some(s => s.status === 'in-progress') ? 1 : 0)} of {steps.length}</div>
            </div>

            <div style={{ padding: '20px 0 40px', position: 'relative' }}>
                {/* Progress Bar Background */}
                <div style={{
                    position: 'absolute',
                    top: 40,
                    left: '10%',
                    right: '10%',
                    height: 4,
                    background: 'var(--bg-elevated)',
                    zIndex: 0
                }}>
                    {/* Active Progress Fill */}
                    <div style={{
                        height: '100%',
                        background: 'var(--success)',
                        width: `${(steps.filter(s => s.status === 'completed').length / (steps.length - 1)) * 100}%`,
                        transition: 'width 0.5s ease'
                    }}></div>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 1,
                    padding: '0 20px'
                }}>
                    {steps.map((step) => {
                        const isCompleted = step.status === 'completed';
                        const isInProgress = step.status === 'in-progress';
                        const isPending = step.status === 'pending';

                        let iconBg = 'var(--bg-elevated)';
                        let iconColor = 'var(--text-muted)';
                        let borderColor = 'transparent';

                        if (isCompleted) {
                            iconBg = 'white';
                            iconColor = 'var(--success)';
                            borderColor = 'var(--success)';
                        } else if (isInProgress) {
                            iconBg = 'var(--primary)';
                            iconColor = 'white';
                            borderColor = 'rgba(19, 127, 236, 0.2)'; // Primary color with opacity
                        } else {
                            iconBg = 'white';
                            borderColor = 'var(--border-color)';
                        }

                        return (
                            <div key={step.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: 120 }}>
                                {/* Icon Circle */}
                                <div style={{
                                    width: 48,
                                    height: 48,
                                    borderRadius: '50%',
                                    background: isCompleted ? 'white' : iconBg,
                                    border: `2px solid ${borderColor}`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    marginBottom: 16,
                                    boxShadow: isInProgress ? '0 0 0 4px rgba(19, 127, 236, 0.1)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}>
                                    <span className="material-symbols-outlined" style={{
                                        color: isCompleted ? 'var(--success)' : iconColor,
                                        fontSize: 24,
                                        fontWeight: isInProgress ? 'bold' : 'normal'
                                    }}>
                                        {isCompleted ? 'check' : step.icon}
                                    </span>
                                </div>

                                {/* Label */}
                                <h4 style={{
                                    fontSize: '0.95rem',
                                    fontWeight: isInProgress ? 700 : 600,
                                    color: isInProgress ? 'var(--primary)' : 'var(--text-primary)',
                                    marginBottom: 4
                                }}>
                                    {step.label}
                                </h4>

                                {/* Status Badge */}
                                <div style={{ marginBottom: 4 }}>
                                    {isCompleted && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--success)', fontSize: '0.8rem', fontWeight: 500 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--success)' }}></div>
                                            Completed
                                        </div>
                                    )}
                                    {isInProgress && (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, color: 'var(--primary)', fontSize: '0.8rem', fontWeight: 500 }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)' }}></div>
                                            In Progress
                                        </div>
                                    )}
                                    {isPending && (
                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Pending</span>
                                    )}
                                </div>

                                {/* Meta Data (Date/Estimate) */}
                                {step.date && (
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {step.date}
                                    </span>
                                )}
                                {step.meta && (
                                    <div style={{
                                        marginTop: 4,
                                        background: 'var(--bg-elevated)',
                                        padding: '2px 8px',
                                        borderRadius: 12,
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        {step.meta}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default React.memo(ProductionProgress);
