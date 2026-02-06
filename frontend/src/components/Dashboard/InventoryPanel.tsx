import React from 'react';
import { Link } from 'react-router-dom';

interface StockItem {
    name: string;
    quantity: number;
    max_capacity: number;
    unit: string;
    status: string;
}

interface LowStockAlert {
    product: string;
    current: number;
    minimum: number;
}

interface InventorySnapshot {
    stocks: StockItem[];
    low_stock_alerts: LowStockAlert[];
    avg_stock_age_days: number;
}

interface InventoryPanelProps {
    data: InventorySnapshot;
}

const InventoryPanel: React.FC<InventoryPanelProps> = ({ data }) => {
    const formatNumber = (num: number) =>
        new Intl.NumberFormat('id-ID').format(num);

    const getStatusClass = (status: string) => {
        switch (status) {
            case 'good': return 'stock-good';
            case 'warning': return 'stock-warning';
            case 'critical': return 'stock-critical';
            default: return '';
        }
    };

    return (
        <div className="dashboard-panel inventory-panel">
            <div className="panel-header">
                <div>
                    <h3>Inventory Snapshot</h3>
                    <p className="panel-subtitle">Stok saat ini</p>
                </div>
                <Link to="/production/stocks" className="btn btn-ghost btn-sm">
                    Lihat Semua
                    <span className="material-symbols-outlined icon-sm">arrow_forward</span>
                </Link>
            </div>

            {/* Stock Bars */}
            <div className="stock-bars">
                {data.stocks.slice(0, 5).map((stock, index) => {
                    const percent = Math.min(100, (stock.quantity / stock.max_capacity) * 100);
                    return (
                        <div key={index} className="stock-bar-item">
                            <div className="stock-bar-header">
                                <span className="stock-name">{stock.name}</span>
                                <span className="stock-value">
                                    {formatNumber(stock.quantity)} {stock.unit}
                                </span>
                            </div>
                            <div className="stock-bar-track">
                                <div
                                    className={`stock-bar-fill ${getStatusClass(stock.status)}`}
                                    style={{ width: `${percent}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Low Stock Alerts */}
            {data.low_stock_alerts.length > 0 && (
                <div className="low-stock-alerts">
                    <div className="alert-header">
                        <span className="material-symbols-outlined">warning</span>
                        <span>Stok Rendah</span>
                    </div>
                    {data.low_stock_alerts.map((alert, index) => (
                        <div key={index} className="alert-item">
                            <span className="alert-product">{alert.product}</span>
                            <span className="alert-qty">
                                {formatNumber(alert.current)} / {formatNumber(alert.minimum)} min
                            </span>
                        </div>
                    ))}
                </div>
            )}

            {/* Avg Stock Age */}
            <div className="stock-meta">
                <span className="material-symbols-outlined icon-sm">schedule</span>
                <span>Rata-rata umur stok: <strong>{data.avg_stock_age_days} hari</strong></span>
            </div>
        </div>
    );
};

export default InventoryPanel;
