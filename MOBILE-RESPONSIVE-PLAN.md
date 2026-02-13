# Mobile-Responsive Implementation Plan — ERP Pangan Masa Depan

## Context

Kamu akan mengerjakan task mobile-responsive untuk aplikasi ERP berbasis React. Aplikasi ini sudah punya basic responsive (sidebar drawer di mobile, grid collapse), tapi masih banyak area yang belum optimal untuk layar kecil.

### Tech Stack
- **Frontend**: React 19 + Vite 7 + React Router 7
- **Styling**: Plain CSS dengan CSS Variables (TIDAK pakai Tailwind/MUI/Ant Design)
- **Icons**: @hugeicons/react
- **Charts**: Recharts
- **Theme**: Light/Dark mode via CSS Variables (`html.dark`)

### Breakpoints yang Sudah Ada
- `1024px` — tablet (grid 4→2 kolom)
- `768px` — mobile (sidebar drawer, grid→1 kolom, search hidden)

### Layout Structure
```
<div className="app">
  ├── Sidebar (fixed left, 280px, drawer di mobile)
  ├── sidebar-overlay (mobile only)
  └── <main className="main-content">
      ├── Header (sticky, 64px)
      └── <Outlet /> (page content via React Router)
```

### File Penting
- `frontend/src/index.css` — Global CSS utama (~1500 baris), semua CSS Variables, utilities, responsive rules
- `frontend/src/components/Layout/Layout.tsx` — Shell utama
- `frontend/src/components/Layout/Sidebar.tsx` — Navigasi (280px fixed)
- `frontend/src/components/Layout/Sidebar.css` — Sidebar styling
- `frontend/src/components/Layout/Header.tsx` — Header + notification dropdown
- `frontend/src/pages/dashboard/Dashboard.tsx` + `Dashboard.css` — Dashboard KPI
- `frontend/src/pages/**/*.tsx` — Semua halaman (lihat daftar di bawah)

### Daftar Halaman
1. `pages/auth/Login.tsx` — Login page
2. `pages/dashboard/Dashboard.tsx` — KPI dashboard (charts, stat cards)
3. `pages/production/Worksheets.tsx` — List worksheets + create modal
4. `pages/production/WorksheetDetail.tsx` — Detail worksheet
5. `pages/production/Stocks.tsx` — Inventory table
6. `pages/production/RawMaterialReceipt.tsx` — Raw material intake
7. `pages/production/Machines.tsx` — Machine registry table
8. `pages/production/Maintenance.tsx` — Maintenance scheduling
9. `pages/production/OEE.tsx` — OEE monitoring (charts)
10. `pages/production/QCGabah.tsx` — Quality control
11. `pages/sales/Customers.tsx` — Customer CRUD table
12. `pages/sales/Invoices.tsx` — Invoice list
13. `pages/sales/InvoiceDetail.tsx` — Invoice detail + payments
14. `pages/purchasing/PurchaseOrders.tsx` — PO list + stats
15. `pages/purchasing/PurchaseOrderDetail.tsx` — PO detail + goods receipt
16. `pages/reports/ProductionReport.tsx` — Production analytics (charts)
17. `pages/reports/SalesReport.tsx` — Sales analytics (charts)
18. `pages/reports/COGMReport.tsx` — Cost report (charts)
19. `pages/reports/StockReport.tsx` — Stock analytics (charts)
20. `pages/Settings.tsx` — Settings (factories, suppliers, products)

### Pola UI yang Digunakan di Semua Halaman
- `.stats-grid` → stat cards di atas halaman
- `.card` → container utama
- `.card-header` → judul + tombol aksi (sudah flex-direction: column di mobile)
- `.table-container > table` → data table
- `.modal-overlay > .modal` → modal CRUD (form inputs)
- `.form-group`, `.form-row` → form layout (biasanya grid 2 kolom)
- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost` → tombol

---

## Task yang Harus Dikerjakan

### Task 1: Tambah Breakpoint 480px (Small Phone)

Di `index.css`, tambahkan breakpoint `@media (max-width: 480px)` untuk layar kecil:

```css
@media (max-width: 480px) {
  .page-content {
    padding: 12px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .stat-card {
    padding: 12px;
  }

  .card {
    border-radius: 8px;
  }

  .card-header {
    padding: 12px;
    gap: 8px;
  }

  .card-body, .card-content {
    padding: 12px;
  }

  h1, .page-title { font-size: 1.25rem; }
  h2 { font-size: 1.125rem; }
  h3, .card-title { font-size: 1rem; }

  .btn {
    padding: 8px 12px;
    font-size: 0.8125rem;
  }

  .modal {
    width: 95vw;
    max-height: 90vh;
    margin: 5vh auto;
    border-radius: 12px;
  }

  .modal-body {
    padding: 12px;
  }

  .form-row {
    grid-template-columns: 1fr;
  }
}
```

### Task 2: Responsive Tables → Card View di Mobile

Tabel data adalah masalah terbesar di mobile. Buat horizontal scroll + opsi card view.

Di `index.css`, perbaiki `.table-container` untuk mobile:

```css
/* Sudah ada, pastikan ini benar */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (max-width: 768px) {
  /* Opsi 1: Horizontal scroll dengan min-width */
  .table-container table {
    min-width: 600px;
  }

  /* Sembunyikan kolom yang kurang penting */
  .table-container th.hide-mobile,
  .table-container td.hide-mobile {
    display: none;
  }

  /* Compact table */
  .table-container th,
  .table-container td {
    padding: 8px 10px;
    font-size: 0.75rem;
    white-space: nowrap;
  }
}
```

Kemudian, untuk setiap halaman yang punya tabel, tambahkan class `hide-mobile` pada kolom yang kurang penting. Contoh kolom yang bisa disembunyikan:
- Kolom "Created At" / "Updated At"
- Kolom "Description" / "Notes"
- Kolom "Factory"
- Kolom ID yang panjang

**Halaman yang perlu diupdate** (tambah `className="hide-mobile"` di `<th>` dan `<td>`):
- `Worksheets.tsx` — hide: tanggal update, factory
- `Stocks.tsx` — hide: last updated
- `Machines.tsx` — hide: description, factory
- `Maintenance.tsx` — hide: notes, factory
- `Customers.tsx` — hide: address, created at
- `Invoices.tsx` — hide: factory, notes
- `PurchaseOrders.tsx` — hide: factory, notes

### Task 3: Mobile-Friendly Header

Perbaikan di `Header.tsx` dan `index.css`:

1. Notification dropdown harus full-width di mobile:
```css
@media (max-width: 768px) {
  .notification-dropdown {
    position: fixed;
    top: var(--header-height);
    left: 0;
    right: 0;
    width: 100%;
    max-height: 60vh;
    border-radius: 0 0 12px 12px;
  }
}
```

2. Header actions spacing lebih compact:
```css
@media (max-width: 480px) {
  .header-actions {
    gap: 4px;
  }

  .header-actions .btn {
    padding: 6px;
  }

  .header .page-title {
    font-size: 1rem;
  }

  .header .page-subtitle {
    display: none;
  }
}
```

### Task 4: Mobile-Friendly Modals & Forms

Semua modal sudah pakai `.modal-overlay > .modal`. Perbaikan:

```css
@media (max-width: 768px) {
  .modal {
    width: 100%;
    max-width: 100%;
    min-height: 50vh;
    max-height: 100vh;
    margin: 0;
    border-radius: 16px 16px 0 0;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    animation: slideUpModal 0.3s ease;
  }

  .modal-overlay {
    align-items: flex-end;
  }

  .modal-body {
    overflow-y: auto;
    max-height: calc(100vh - 140px);
  }

  /* Form rows jadi 1 kolom */
  .form-row,
  .form-grid,
  .grid-2 {
    grid-template-columns: 1fr !important;
  }

  .form-group {
    margin-bottom: 12px;
  }

  .form-input,
  .form-select,
  .form-textarea {
    font-size: 16px; /* Prevent iOS zoom on focus */
  }
}

@keyframes slideUpModal {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

### Task 5: Dashboard Mobile Optimization

Di `Dashboard.css` dan `Dashboard.tsx`:

1. KPI cards sudah responsive (auto-fit grid). Pastikan chart containers juga responsive:
```css
@media (max-width: 768px) {
  .dashboard-chart-container {
    height: 250px; /* Lebih pendek di mobile */
  }

  .dashboard-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .dashboard-panel {
    padding: 12px;
  }
}

@media (max-width: 480px) {
  .dashboard-chart-container {
    height: 200px;
  }
}
```

2. Di setiap komponen Recharts (`<ResponsiveContainer>`), pastikan sudah pakai `width="100%"` dan `height` yang cukup. Recharts `<ResponsiveContainer>` otomatis adjust — tidak perlu perubahan JSX.

### Task 6: Report Pages Mobile Optimization

Report pages punya filter bar + chart + table. Di mobile:

```css
@media (max-width: 768px) {
  .report-filters,
  .filter-bar,
  .filter-row {
    flex-direction: column;
    gap: 8px;
  }

  .filter-bar .form-input,
  .filter-bar .form-select {
    width: 100%;
  }

  .report-actions {
    flex-direction: column;
    gap: 8px;
  }

  .report-actions .btn {
    width: 100%;
    justify-content: center;
  }
}
```

### Task 7: Touch-Friendly Interactions

Tambah di `index.css`:

```css
/* Touch targets minimum 44px */
@media (max-width: 768px) {
  .btn,
  .nav-link,
  .sidebar-link,
  .table-container td .btn {
    min-height: 44px;
    min-width: 44px;
  }

  /* Disable hover effects on touch */
  @media (hover: none) {
    .btn:hover,
    .card:hover,
    .nav-link:hover {
      transform: none;
      box-shadow: none;
    }
  }

  /* Better tap feedback */
  .btn:active,
  .nav-link:active {
    transform: scale(0.97);
    transition: transform 0.1s ease;
  }
}
```

### Task 8: Sidebar Mobile Polish

Di `Sidebar.css`, tambahkan polish untuk mobile drawer:

```css
@media (max-width: 768px) {
  .sidebar {
    z-index: 1000;
    width: 85vw;
    max-width: 320px;
    box-shadow: 4px 0 24px rgba(0, 0, 0, 0.2);
  }

  .sidebar-overlay {
    z-index: 999;
    backdrop-filter: blur(2px);
  }

  /* User info di bottom sidebar lebih compact */
  .sidebar-footer {
    padding: 12px;
    font-size: 0.8125rem;
  }

  /* Close sidebar otomatis saat nav link diklik */
  /* Ini sudah di-handle di Sidebar.tsx via closeSidebar() */
}
```

### Task 9: Print Styles

Perbaiki print media query di `index.css`:

```css
@media print {
  .sidebar,
  .sidebar-overlay,
  .header,
  .btn,
  .notification-dropdown,
  .menu-toggle,
  .filter-bar,
  .report-actions {
    display: none !important;
  }

  .main-content {
    margin-left: 0 !important;
  }

  .page-content {
    padding: 0 !important;
    max-width: 100% !important;
  }

  .card {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
    break-inside: avoid;
  }

  table {
    font-size: 10pt;
  }
}
```

### Task 10: Detail Pages Mobile Optimization

`WorksheetDetail.tsx`, `InvoiceDetail.tsx`, `PurchaseOrderDetail.tsx` punya layout detail yang perlu di-optimize:

```css
@media (max-width: 768px) {
  /* Detail header info grid */
  .detail-grid,
  .detail-info,
  .info-grid {
    grid-template-columns: 1fr !important;
  }

  /* Action buttons di detail pages */
  .detail-actions,
  .page-actions {
    flex-direction: column;
    gap: 8px;
  }

  .detail-actions .btn,
  .page-actions .btn {
    width: 100%;
    justify-content: center;
  }

  /* Badge dan status inline */
  .detail-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
```

---

## Panduan Umum

1. **Jangan install library baru** — semua dikerjakan dengan plain CSS
2. **Jangan ubah struktur HTML/JSX** kecuali untuk menambah class `hide-mobile`
3. **Prioritas**: Form input harus `font-size: 16px` di mobile (prevent iOS zoom)
4. **Test di**: Chrome DevTools responsive mode — iPhone SE (375px), iPhone 14 (390px), iPad (768px)
5. **CSS Variables sudah ada** — gunakan `var(--spacing)`, `var(--border-radius)`, dll
6. **Dark mode** — pastikan semua perubahan CSS juga work di `html.dark`
7. **Perubahan CSS mayoritas di `index.css`** — hindari membuat file CSS baru kecuali sangat spesifik

## Urutan Pengerjaan

1. `index.css` — global responsive rules (Task 1, 2, 4, 7, 9, 10)
2. `Sidebar.css` — sidebar mobile polish (Task 8)
3. `Header.tsx` area di `index.css` — notification dropdown (Task 3)
4. `Dashboard.css` — dashboard mobile (Task 5)
5. Report pages area di `index.css` — filter & chart (Task 6)
6. Individual pages — tambah `hide-mobile` class di tabel (Task 2)

Setelah semua selesai, test manual di Chrome DevTools di 3 ukuran: 375px, 390px, 768px.
