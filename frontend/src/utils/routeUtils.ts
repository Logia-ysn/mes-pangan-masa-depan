export const getPageTitle = (pathname: string): { title: string; subtitle?: string } => {
    // Remove trailing slash
    const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

    if (path === '/') return { title: 'Dashboard', subtitle: 'Executive overview of manufacturing KPIs' };
    if (path === '/settings') return { title: 'Pengaturan', subtitle: 'Konfigurasi sistem dan profil' };

    // Production
    if (path === '/production/worksheets') return { title: 'Worksheet Produksi', subtitle: 'Daftar lembar kerja produksi harian' };
    if (path.startsWith('/production/worksheets/new')) return { title: 'Worksheet Baru', subtitle: 'Buat lembar kerja produksi baru' };
    if (path.includes('/production/worksheets/') && path.endsWith('/edit')) return { title: 'Edit Worksheet', subtitle: 'Ubah data lembar kerja produksi' };
    if (path.startsWith('/production/worksheets/')) return { title: 'Detail Worksheet', subtitle: 'Informasi lengkap lembar kerja' };
    if (path === '/production/stocks') return { title: 'Stok Produk', subtitle: 'Monitor inventaris produk jadi dan setengah jadi' };
    if (path === '/production/raw-materials') return { title: 'Penerimaan Gabah', subtitle: 'Input data pembelian gabah dari supplier' };
    if (path === '/production/machines') return { title: 'Status Mesin', subtitle: 'Monitor performa dan kondisi mesin produksi' };
    if (path === '/production/maintenance') return { title: 'Maintenance', subtitle: 'Jadwal dan riwayat pemeliharaan mesin' };
    if (path === '/production/oee') return { title: 'Analisis OEE', subtitle: 'Overall Equipment Effectiveness overview' };
    if (path === '/production/qc-gabah') return { title: 'Quality Control', subtitle: 'Analisis kualitas gabah menggunakan AI' };

    // Sales
    if (path === '/sales/customers') return { title: 'Data Customer', subtitle: 'Kelola database pelanggan' };
    if (path === '/sales/invoices') return { title: 'Invoice Penjualan', subtitle: 'Daftar penagihan kepada customer' };
    if (path.startsWith('/sales/invoices/')) return { title: 'Detail Invoice', subtitle: 'Informasi penagihan dan item penjualan' };

    // Purchasing
    if (path === '/purchasing/purchase-orders') return { title: 'Purchase Order', subtitle: 'Pesanan pembelian kepada supplier' };
    if (path.startsWith('/purchasing/purchase-orders/')) return { title: 'Detail PO', subtitle: 'Informasi pesanan dan status penerimaan' };

    // Reports
    if (path === '/reports/production') return { title: 'Laporan Produksi', subtitle: 'Analisis output dan rendemen pabrik' };
    if (path === '/reports/sales') return { title: 'Laporan Penjualan', subtitle: 'Analisis pendapatan dan volume penjualan' };
    if (path === '/reports/cogm') return { title: 'Laporan HPP', subtitle: 'Cost of Goods Manufactured calculation' };
    if (path === '/reports/stock') return { title: 'Laporan Stok', subtitle: 'Rekapitulasi mutasi dan saldo inventaris' };

    // Admin
    if (path === '/admin/users') return { title: 'Manajemen User', subtitle: 'Kelola akses dan akun personel' };

    return { title: 'ERP Pangan' };
};
