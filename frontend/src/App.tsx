import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';

import './index.css';

// Lazy-loaded pages (code splitting)
const Login = React.lazy(() => import('./pages/auth/Login'));
const Dashboard = React.lazy(() => import('./pages/dashboard/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));
const PurchaseOrders = React.lazy(() => import('./pages/purchasing/PurchaseOrders'));
const PurchaseOrderDetail = React.lazy(() => import('./pages/purchasing/PurchaseOrderDetail'));
const PurchaseOrderPrint = React.lazy(() => import('./pages/purchasing/PurchaseOrderPrint'));
const Suppliers = React.lazy(() => import('./pages/purchasing/Suppliers'));
const RawMaterialReceipt = React.lazy(() => import('./pages/production/RawMaterialReceipt'));
const QCGabah = React.lazy(() => import('./pages/production/QCGabah'));
const WorkOrders = React.lazy(() => import('./pages/production/WorkOrders'));
const Worksheets = React.lazy(() => import('./pages/production/Worksheets'));
const WorksheetDetail = React.lazy(() => import('./pages/production/WorksheetDetail'));
const WorksheetForm = React.lazy(() => import('./pages/production/WorksheetForm'));
const ProductionScheduling = React.lazy(() => import('./pages/production/ProductionScheduling'));
const ProductionLines = React.lazy(() => import('./pages/production/ProductionLines'));
const DryingLogs = React.lazy(() => import('./pages/production/DryingLogs'));
const QCResults = React.lazy(() => import('./pages/production/QCResults'));
const RendemenMonitor = React.lazy(() => import('./pages/production/RendemenMonitor'));
const Stocks = React.lazy(() => import('./pages/production/Stocks'));
const StockTransfers = React.lazy(() => import('./pages/inventory/StockTransfers'));
const StockOpname = React.lazy(() => import('./pages/inventory/StockOpname'));
const Machines = React.lazy(() => import('./pages/production/Machines'));
const Maintenance = React.lazy(() => import('./pages/production/Maintenance'));
const DowntimeTracking = React.lazy(() => import('./pages/equipment/DowntimeTracking'));
const OEE = React.lazy(() => import('./pages/production/OEE'));
const ProductionReport = React.lazy(() => import('./pages/reports/ProductionReport'));
const COGMReport = React.lazy(() => import('./pages/reports/COGMReport'));
const StockReport = React.lazy(() => import('./pages/reports/StockReport'));
const QualityTrends = React.lazy(() => import('./pages/reports/QualityTrends'));
const ProcessParameters = React.lazy(() => import('./pages/reports/ProcessParameters'));
const BatchGenealogy = React.lazy(() => import('./pages/inventory/BatchGenealogy'));
const Users = React.lazy(() => import('./pages/admin/Users'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));
const Factories = React.lazy(() => import('./pages/admin/Factories'));
const ProductTypes = React.lazy(() => import('./pages/admin/ProductTypes'));
const NonConformance = React.lazy(() => import('./pages/quality/NonConformance'));

import RoleGuard from './components/RoleGuard';
import LogoLoader from './components/UI/LogoLoader';

const PageLoader = () => <LogoLoader />;

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LogoLoader fullScreen text="Menghubungkan ke sistem..." />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { user } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        
        {/* Print Layout (No Sidebar) */}
        <Route path="/print/purchase-orders/:id" element={
          <ProtectedRoute>
            <PurchaseOrderPrint />
          </ProtectedRoute>
        } />

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />

          {/* ===== Penerimaan Bahan Baku Module ===== */}
          <Route path="receiving">
            <Route path="purchase-orders" element={
              <RoleGuard requiredRole="SUPERVISOR"><PurchaseOrders /></RoleGuard>
            } />
            <Route path="purchase-orders/:id" element={
              <RoleGuard requiredRole="SUPERVISOR"><PurchaseOrderDetail /></RoleGuard>
            } />
            <Route path="suppliers" element={
              <RoleGuard requiredRole="SUPERVISOR"><Suppliers /></RoleGuard>
            } />
            <Route path="raw-materials" element={
              <RoleGuard requiredRole="OPERATOR"><RawMaterialReceipt /></RoleGuard>
            } />
            <Route path="qc-gabah" element={<QCGabah />} />
          </Route>

          {/* ===== Produksi Module ===== */}
          <Route path="production">
            <Route path="work-orders" element={
              <RoleGuard requiredRole="SUPERVISOR"><WorkOrders /></RoleGuard>
            } />
            <Route path="worksheets" element={<Worksheets />} />
            <Route path="worksheets/new" element={
              <RoleGuard requiredRole="SUPERVISOR"><WorksheetForm /></RoleGuard>
            } />
            <Route path="worksheets/:id" element={<WorksheetDetail />} />
            <Route path="worksheets/:id/edit" element={
              <RoleGuard requiredRole="SUPERVISOR"><WorksheetForm /></RoleGuard>
            } />
            <Route path="lines" element={
              <RoleGuard requiredRole="SUPERVISOR"><ProductionLines /></RoleGuard>
            } />
            <Route path="drying-logs" element={
              <RoleGuard requiredRole="SUPERVISOR"><DryingLogs /></RoleGuard>
            } />
            <Route path="qc-results" element={
              <RoleGuard requiredRole="SUPERVISOR"><QCResults /></RoleGuard>
            } />
            <Route path="rendemen" element={
              <RoleGuard requiredRole="SUPERVISOR"><RendemenMonitor /></RoleGuard>
            } />
            <Route path="scheduling" element={
              <RoleGuard requiredRole="SUPERVISOR"><ProductionScheduling /></RoleGuard>
            } />
          </Route>

          {/* ===== Kualitas Module ===== */}
          <Route path="quality">
            <Route path="ncr" element={<NonConformance />} />
          </Route>

          {/* ===== Inventory Module ===== */}
          <Route path="inventory">
            <Route path="stocks" element={<Stocks />} />
            <Route path="transfers" element={
              <RoleGuard requiredRole="SUPERVISOR"><StockTransfers /></RoleGuard>
            } />
            <Route path="stock-opname" element={
              <RoleGuard requiredRole="SUPERVISOR"><StockOpname /></RoleGuard>
            } />
            <Route path="batch-genealogy" element={<BatchGenealogy />} />
          </Route>

          {/* ===== Mesin & Maintenance Module ===== */}
          <Route path="equipment">
            <Route path="machines" element={<Machines />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="downtime" element={<DowntimeTracking />} />
            <Route path="oee" element={<OEE />} />
          </Route>

          {/* ===== Laporan Module ===== */}
          <Route path="reports">
            <Route path="production" element={
              <RoleGuard requiredRole="SUPERVISOR"><ProductionReport /></RoleGuard>
            } />
            <Route path="cogm" element={
              <RoleGuard requiredRole="ADMIN"><COGMReport /></RoleGuard>
            } />
            <Route path="stock" element={
              <RoleGuard requiredRole="SUPERVISOR"><StockReport /></RoleGuard>
            } />
            <Route path="quality" element={
              <RoleGuard requiredRole="SUPERVISOR"><QualityTrends /></RoleGuard>
            } />
            <Route path="process-params" element={
              <RoleGuard requiredRole="SUPERVISOR"><ProcessParameters /></RoleGuard>
            } />
          </Route>

          {/* ===== Admin Module ===== */}
          <Route path="admin">
            <Route path="users" element={
              <RoleGuard requiredRole="ADMIN"><Users /></RoleGuard>
            } />
            <Route path="audit-logs" element={
              <RoleGuard requiredRole="ADMIN"><AuditLogs /></RoleGuard>
            } />
            <Route path="factories" element={
              <RoleGuard requiredRole="ADMIN"><Factories /></RoleGuard>
            } />
            <Route path="product-types" element={
              <RoleGuard requiredRole="ADMIN"><ProductTypes /></RoleGuard>
            } />
          </Route>

          {/* Legacy routes - redirect to new paths */}
          <Route path="worksheets" element={<Navigate to="/production/worksheets" replace />} />
          <Route path="stocks" element={<Navigate to="/inventory/stocks" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '60vh',
              textAlign: 'center',
              padding: '2rem',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 80, color: 'var(--text-muted)', marginBottom: 16 }}>
                search_off
              </span>
              <h1 style={{ fontSize: '3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>404</h1>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Halaman Tidak Ditemukan
              </h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: 24, maxWidth: 400 }}>
                Halaman yang Anda cari tidak ada atau telah dipindahkan.
              </p>
              <button className="btn btn-primary" onClick={() => window.location.href = '/dashboard'}>
                <span className="material-symbols-outlined icon-sm">home</span>
                Kembali ke Dashboard
              </button>
            </div>
          } />
        </Route>
      </Routes>
    </Suspense>
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <ErrorBoundary>
              <AppRoutes />
            </ErrorBoundary>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
