import React from 'react';
import { Link } from 'react-router-dom';

interface MaintenanceItem {
    machine: string;
    due_date: string;
    type: string;
    days_until?: number;
    days_overdue?: number;
}

interface MaintenancePanelData {
    upcoming: MaintenanceItem[];
    overdue: MaintenanceItem[];
    tickets_this_month: number;
}

interface MaintenancePanelProps {
    data: MaintenancePanelData;
}

const MaintenancePanel: React.FC<MaintenancePanelProps> = ({ data }) => {

    return (
        <div className="dashboard-panel maintenance-panel">
            <div className="panel-header">
                <div>
                    <h3>Maintenance</h3>
                    <p className="panel-subtitle">{data.tickets_this_month} tiket bulan ini</p>
                </div>
                <Link to="/production/maintenance" className="btn btn-ghost btn-sm">
                    Lihat Semua
                    <span className="material-symbols-outlined icon-sm">arrow_forward</span>
                </Link>
            </div>

            {/* Overdue Section */}
            {data.overdue.length > 0 && (
                <div className="maintenance-section overdue">
                    <div className="section-header">
                        <span className="material-symbols-outlined">error</span>
                        <span>Overdue ({data.overdue.length})</span>
                    </div>
                    <div className="maintenance-list">
                        {data.overdue.map((item, index) => (
                            <div key={index} className="maintenance-item overdue">
                                <div className="maintenance-info">
                                    <span className="maintenance-machine">{item.machine}</span>
                                    <span className="maintenance-type">{item.type}</span>
                                </div>
                                <div className="maintenance-date">
                                    <span className="days-badge overdue">
                                        {item.days_overdue}d lewat
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upcoming Section */}
            <div className="maintenance-section upcoming">
                <div className="section-header">
                    <span className="material-symbols-outlined">event_upcoming</span>
                    <span>Mendatang</span>
                </div>
                {data.upcoming.length > 0 ? (
                    <div className="maintenance-list">
                        {data.upcoming.map((item, index) => (
                            <div key={index} className="maintenance-item">
                                <div className="maintenance-info">
                                    <span className="maintenance-machine">{item.machine}</span>
                                    <span className="maintenance-type">{item.type}</span>
                                </div>
                                <div className="maintenance-date">
                                    <span className={`days-badge ${item.days_until && item.days_until <= 3 ? 'soon' : ''}`}>
                                        {item.days_until === 0 ? 'Hari ini' : `${item.days_until}d lagi`}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="empty-message">Tidak ada jadwal dalam 14 hari</p>
                )}
            </div>
        </div>
    );
};

export default React.memo(MaintenancePanel);
