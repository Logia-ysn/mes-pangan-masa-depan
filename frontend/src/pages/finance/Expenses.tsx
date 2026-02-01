import { useState, useEffect } from 'react';
import { Header } from '../../components/Layout';
import { expenseApi } from '../../services/api';
import { exportToCSV } from '../../utils/exportUtils';

interface Expense {
    id: number;
    expense_date: string;
    amount: number;
    description: string;
    id_expense_category: number;
}

const Expenses = () => {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await expenseApi.getAll({ limit: 50 });
            setExpenses(res.data.data || []);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        const data = expenses.map(e => ({
            Date: new Date(e.expense_date).toLocaleDateString('id-ID'),
            'Category ID': e.id_expense_category,
            Description: e.description,
            Amount: e.amount
        }));
        exportToCSV(data, `Expenses_${new Date().toISOString().split('T')[0]}`);
    };

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

    const formatCurrency = (num: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);

    // Stats
    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const avgExpense = expenses.length > 0 ? totalExpenses / expenses.length : 0;

    return (
        <>
            <Header title="Pengeluaran" subtitle="Pencatatan biaya operasional harian" />

            <div className="page-content">
                {/* Stats Grid */}
                <div className="stats-grid">
                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Total Pengeluaran</span>
                            <span className="material-symbols-outlined stat-card-icon">account_balance_wallet</span>
                        </div>
                        <div className="stat-card-value text-error">{formatCurrency(totalExpenses)}</div>
                        <span className="badge badge-error">Total</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Rata-rata / Transaksi</span>
                            <span className="material-symbols-outlined stat-card-icon">analytics</span>
                        </div>
                        <div className="stat-card-value">{formatCurrency(avgExpense)}</div>
                        <span className="badge badge-info">Average</span>
                    </div>

                    <div className="stat-card">
                        <div className="stat-card-header">
                            <span className="stat-card-label">Jumlah Transaksi</span>
                            <span className="material-symbols-outlined stat-card-icon">receipt</span>
                        </div>
                        <div className="stat-card-value">{expenses.length}</div>
                        <span className="badge badge-muted">Transactions</span>
                    </div>
                </div>

                <div className="card" style={{ marginTop: 24 }}>
                    <div className="card-header">
                        <div>
                            <h3 className="card-title">Data Pengeluaran Harian</h3>
                            <p className="card-subtitle">Daftar biaya operasional</p>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button className="btn btn-secondary" onClick={handleExport}>
                                <span className="material-symbols-outlined icon-sm">download</span>
                                Export
                            </button>
                            <button className="btn btn-primary">
                                <span className="material-symbols-outlined icon-sm">add</span>
                                Tambah Pengeluaran
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="empty-state">
                            <div className="empty-state-icon">
                                <span className="material-symbols-outlined animate-pulse">hourglass_empty</span>
                            </div>
                            <h3>Memuat data...</h3>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Tanggal</th>
                                        <th>Kategori ID</th>
                                        <th>Deskripsi</th>
                                        <th>Jumlah</th>
                                        <th style={{ textAlign: 'right' }}>Aksi</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {expenses.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ textAlign: 'center', padding: '40px' }}>
                                                <div className="empty-state">
                                                    <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-muted)' }}>payments</span>
                                                    <p>Belum ada data pengeluaran</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        expenses.map((e) => (
                                            <tr key={e.id}>
                                                <td>{formatDate(e.expense_date)}</td>
                                                <td>
                                                    <span className="badge badge-muted">
                                                        #{e.id_expense_category}
                                                    </span>
                                                </td>
                                                <td style={{ fontWeight: 500 }}>{e.description}</td>
                                                <td style={{ color: 'var(--error)', fontWeight: 600 }}>{formatCurrency(e.amount)}</td>
                                                <td style={{ textAlign: 'right' }}>
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="btn btn-ghost btn-sm">
                                                            <span className="material-symbols-outlined icon-sm">edit</span>
                                                        </button>
                                                        <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}>
                                                            <span className="material-symbols-outlined icon-sm">delete</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Expenses;
