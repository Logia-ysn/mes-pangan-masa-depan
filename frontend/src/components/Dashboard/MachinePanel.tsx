import React from 'react';
import { Link } from 'react-router-dom';

interface MachinesSummary {
    total: number;
    active: number;
    maintenance: number;
    inactive: number;
    top_downtime: { name: string; hours: number }[];
    oee_breakdown: {
        availability: number;
        performance: number;
        quality: number;
    };
}

interface MachinePanelProps {
    data: MachinesSummary;
}

const MachinePanel: React.FC<MachinePanelProps> = ({ data }) => {
    const formatPercent = (value: number) => `${Math.round(value)}%`;

    return (
        <div className="dashboard-panel machine-panel">
            {/* Machine Summary */}
            <div className="panel-section">
                <div className="panel-section-header">
                    <h4>Ringkasan Mesin</h4>
                    <Link to="/production/machines" className="btn btn-ghost btn-sm">
                        <span className="material-symbols-outlined icon-sm">arrow_forward</span>
                    </Link>
                </div>
                <div className="machine-stats-grid">
                    <div className="machine-stat">
                        <span className="machine-stat-value">{data.total}</span>
                        <span className="machine-stat-label">Total</span>
                    </div>
                    <div className="machine-stat active">
                        <span className="machine-stat-value">{data.active}</span>
                        <span className="machine-stat-label">Aktif</span>
                    </div>
                    <div className="machine-stat maintenance">
                        <span className="machine-stat-value">{data.maintenance}</span>
                        <span className="machine-stat-label">Maint.</span>
                    </div>
                    <div className="machine-stat inactive">
                        <span className="machine-stat-value">{data.inactive}</span>
                        <span className="machine-stat-label">Off</span>
                    </div>
                </div>
            </div>

            {/* OEE Breakdown */}
            <div className="panel-section">
                <div className="panel-section-header">
                    <h4>OEE Breakdown</h4>
                    <Link to="/production/oee" className="btn btn-ghost btn-sm">
                        <span className="material-symbols-outlined icon-sm">arrow_forward</span>
                    </Link>
                </div>
                <div className="oee-breakdown">
                    <div className="oee-metric">
                        <div className="oee-metric-header">
                            <span>Availability</span>
                            <span className="oee-metric-value">{formatPercent(data.oee_breakdown.availability)}</span>
                        </div>
                        <div className="oee-progress-bar">
                            <div
                                className="oee-progress-fill availability"
                                style={{ width: `${data.oee_breakdown.availability}%` }}
                            />
                        </div>
                    </div>
                    <div className="oee-metric">
                        <div className="oee-metric-header">
                            <span>Performance</span>
                            <span className="oee-metric-value">{formatPercent(data.oee_breakdown.performance)}</span>
                        </div>
                        <div className="oee-progress-bar">
                            <div
                                className="oee-progress-fill performance"
                                style={{ width: `${data.oee_breakdown.performance}%` }}
                            />
                        </div>
                    </div>
                    <div className="oee-metric">
                        <div className="oee-metric-header">
                            <span>Quality</span>
                            <span className="oee-metric-value">{formatPercent(data.oee_breakdown.quality)}</span>
                        </div>
                        <div className="oee-progress-bar">
                            <div
                                className="oee-progress-fill quality"
                                style={{ width: `${data.oee_breakdown.quality}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Downtime */}
            {data.top_downtime.length > 0 && (
                <div className="panel-section">
                    <h4>Top Downtime</h4>
                    <div className="downtime-list">
                        {data.top_downtime.map((item, index) => (
                            <div key={index} className="downtime-item">
                                <span className="downtime-machine">{item.name}</span>
                                <span className="downtime-hours">{item.hours.toFixed(1)}h</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default React.memo(MachinePanel);
