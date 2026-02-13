import React from 'react';

interface KPICardProps {
    label: string;
    value: string | number;
    icon: string;
    trend?: 'up' | 'down' | 'stable';
    trendValue?: string;
    status?: 'good' | 'warning' | 'critical';
    statusLabel?: string;
    unit?: string;
    progress?: number;
}

const KPICard: React.FC<KPICardProps> = ({
    label,
    value,
    icon,
    trend,
    trendValue,
    status = 'good',
    statusLabel,
    unit,
    progress
}) => {
    const getTrendIcon = () => {
        switch (trend) {
            case 'up': return 'trending_up';
            case 'down': return 'trending_down';
            default: return 'trending_flat';
        }
    };

    const getTrendClass = () => {
        if (trend === 'up') return 'trend-up';
        if (trend === 'down') return 'trend-down';
        return 'trend-stable';
    };

    const getStatusClass = () => {
        switch (status) {
            case 'good': return 'status-good';
            case 'warning': return 'status-warning';
            case 'critical': return 'status-critical';
            default: return '';
        }
    };

    return (
        <div className={`kpi-card ${getStatusClass()} animate-fade-up`}>
            <div className="kpi-card-header">
                <span className="kpi-card-label">{label}</span>
                <div className="kpi-card-icon">
                    <span className="material-symbols-outlined">{icon}</span>
                </div>
            </div>
            <div className="kpi-card-value">
                {value}
                {unit && <span className="kpi-card-unit">{unit}</span>}
            </div>
            {(trend || statusLabel) && (
                <div className={`kpi-card-footer ${getTrendClass()}`}>
                    {trend && (
                        <span className="kpi-card-trend">
                            <span className="material-symbols-outlined icon-sm">{getTrendIcon()}</span>
                            {trendValue}
                        </span>
                    )}
                    {statusLabel && (
                        <span className={`kpi-status-badge ${getStatusClass()}`}>
                            {statusLabel}
                        </span>
                    )}
                </div>
            )}
            {progress !== undefined && (
                <div className="kpi-card-progress">
                    <div
                        className="kpi-card-progress-bar"
                        style={{ width: `${Math.min(100, progress)}%` }}
                    />
                </div>
            )}
        </div>
    );
};

export default React.memo(KPICard);
