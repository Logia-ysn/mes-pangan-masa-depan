export const getPageTitle = (pathname: string): { title: string; subtitle?: string } => {
    // Remove trailing slash
    const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;

    if (path === '/') return { title: 'Dashboard', subtitle: 'Executive overview of manufacturing KPIs' };
    if (path === '/settings') return { title: 'Pengaturan', subtitle: 'Konfigurasi sistem dan profil' };

    // Pembelian (Procurement)
    if (path === '/purchasing/purchase-orders') return { title: 'Purchase Order', subtitle: 'Pesanan pembelian kepada supplier' };
    if (path.startsWith('/purchasing/purchase-orders/')) return { title: 'Detail PO', subtitle: 'Informasi pesanan dan status penerimaan' };
    if (path === '/purchasing/goods-receipts') return { title: 'Penerimaan Barang', subtitle: 'Daftar penerimaan barang dari purchase order' };
    if (path === '/purchasing/suppliers') return { title: 'Supplier', subtitle: 'Kelola data pemasok bahan baku' };

    // Penerimaan Bahan Baku
    if (path === '/receiving/raw-materials') return { title: 'Penerimaan Gabah', subtitle: 'Input data pembelian gabah dari supplier' };
    if (path === '/receiving/qc-gabah') return { title: 'QC Bahan Baku', subtitle: 'Analisis kualitas gabah menggunakan AI' };

    // Produksi
    if (path === '/production/worksheets') return { title: 'Worksheet Produksi', subtitle: 'Daftar lembar kerja produksi harian' };
    if (path.startsWith('/production/worksheets/new')) return { title: 'Worksheet Baru', subtitle: 'Buat lembar kerja produksi baru' };
    if (path.includes('/production/worksheets/') && path.endsWith('/edit')) return { title: 'Edit Worksheet', subtitle: 'Ubah data lembar kerja produksi' };
    if (path.startsWith('/production/worksheets/')) return { title: 'Detail Worksheet', subtitle: 'Informasi lengkap lembar kerja' };
    if (path === '/production/rendemen') return { title: 'Rendemen Monitor', subtitle: 'Analisis tren hasil produksi gabah ke beras' };

    // Inventory
    if (path === '/inventory/stocks') return { title: 'Stok Produk', subtitle: 'Monitor inventaris produk jadi dan setengah jadi' };
    if (path === '/inventory/transfers') return { title: 'Transfer Stok', subtitle: 'Riwayat perpindahan stok antar pabrik' };

    // Penjualan (Sales)
    if (path === '/sales/customers') return { title: 'Data Customer', subtitle: 'Kelola database pelanggan' };
    if (path === '/sales/invoices') return { title: 'Invoice Penjualan', subtitle: 'Daftar penagihan kepada customer' };
    if (path.startsWith('/sales/invoices/')) return { title: 'Detail Invoice', subtitle: 'Informasi penagihan dan item penjualan' };
    if (path === '/sales/payments') return { title: 'Pembayaran', subtitle: 'Riwayat pembayaran masuk dari customer' };

    // Keuangan (Finance)
    if (path === '/finance/expenses') return { title: 'Pengeluaran Harian', subtitle: 'Pencatatan biaya operasional harian' };

    // Mesin & Maintenance
    if (path === '/equipment/machines') return { title: 'Status Mesin', subtitle: 'Monitor performa dan kondisi mesin produksi' };
    if (path === '/equipment/maintenance') return { title: 'Maintenance', subtitle: 'Jadwal dan riwayat pemeliharaan mesin' };
    if (path === '/equipment/oee') return { title: 'Analisis OEE', subtitle: 'Overall Equipment Effectiveness overview' };

    // Laporan
    if (path === '/reports/production') return { title: 'Laporan Produksi', subtitle: 'Analisis output dan rendemen pabrik' };
    if (path === '/reports/sales') return { title: 'Laporan Penjualan', subtitle: 'Analisis pendapatan dan volume penjualan' };
    if (path === '/reports/cogm') return { title: 'Laporan HPP', subtitle: 'Cost of Goods Manufactured calculation' };
    if (path === '/reports/stock') return { title: 'Laporan Stok', subtitle: 'Rekapitulasi mutasi dan saldo inventaris' };
    if (path === '/reports/quality') return { title: 'Tren Kualitas', subtitle: 'Analisis tren mutu bahan baku' };

    // Admin
    if (path === '/admin/users') return { title: 'Manajemen User', subtitle: 'Kelola akses dan akun personel' };
    if (path === '/admin/employees') return { title: 'Data Karyawan', subtitle: 'Kelola informasi dan data personel' };
    if (path === '/admin/attendance') return { title: 'Absensi Karyawan', subtitle: 'Pencatatan kehadiran dan jadwal kerja personel' };
    if (path === '/admin/audit-logs') return { title: 'Log Audit', subtitle: 'Pantau aktivitas pengguna dan perubahan data' };

    // Legacy production paths (in case accessed directly)
    if (path === '/production/stocks') return { title: 'Stok Produk', subtitle: 'Monitor inventaris produk' };
    if (path === '/production/raw-materials') return { title: 'Penerimaan Gabah', subtitle: 'Input data pembelian gabah' };
    if (path === '/production/machines') return { title: 'Status Mesin', subtitle: 'Monitor mesin produksi' };
    if (path === '/production/maintenance') return { title: 'Maintenance', subtitle: 'Pemeliharaan mesin' };
    if (path === '/production/oee') return { title: 'Analisis OEE', subtitle: 'Equipment Effectiveness' };
    if (path === '/production/qc-gabah') return { title: 'QC Bahan Baku', subtitle: 'Analisis kualitas gabah' };


    return { title: 'ERP Pangan' };
};

export const getBreadcrumbs = (pathname: string): { label: string; to?: string }[] => {
    const path = pathname.endsWith('/') && pathname.length > 1 ? pathname.slice(0, -1) : pathname;
    const items: { label: string; to?: string }[] = [];

    // Root / Dashboard
    if (path === '/') return [{ label: 'Dashboard' }];

    // Penjualan (Sales) -> mapped to Payables per user image
    if (path.startsWith('/sales')) {
        items.push({ label: 'Payables', to: '/sales/invoices' });

        if (path.startsWith('/sales/invoices')) {
            items.push({ label: 'Sales Invoice', to: '/sales/invoices' });
            if (path === '/sales/invoices/new') {
                items.push({ label: 'New Sales Invoice' });
            } else if (path.match(/\/sales\/invoices\/\d+$/)) {
                items.push({ label: 'Detail Invoice' });
            }
        } else if (path === '/sales/customers') {
            items.push({ label: 'Pelanggan' });
        } else if (path === '/sales/payments') {
            items.push({ label: 'Pembayaran' });
        }
    }

    // Produksi
    if (path.startsWith('/production')) {
        items.push({ label: 'Produksi', to: '/production/worksheets' });
        if (path.startsWith('/production/worksheets')) {
            items.push({ label: 'Worksheet', to: '/production/worksheets' });
            if (path === '/production/worksheets/new') {
                items.push({ label: 'New Entry' });
            } else if (path.match(/\/production\/worksheets\/\d+$/)) {
                items.push({ label: 'Detail' });
            }
        }
    }

    // Purchasing
    if (path.startsWith('/purchasing')) {
        items.push({ label: 'Purchasing', to: '/purchasing/purchase-orders' });
        if (path === '/purchasing/purchase-orders') items.push({ label: 'Purchase Order' });
        if (path === '/purchasing/goods-receipts') items.push({ label: 'Penerimaan' });
        if (path === '/purchasing/suppliers') items.push({ label: 'Supplier' });
    }

    // Generic fallback if items is empty
    if (items.length === 0) {
        const segments = path.split('/').filter(Boolean);
        return segments.map(s => ({
            label: s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ')
        }));
    }

    return items;
};
