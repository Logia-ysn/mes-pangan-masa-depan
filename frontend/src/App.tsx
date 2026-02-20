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
const Worksheets = React.lazy(() => import('./pages/production/Worksheets'));
const WorksheetDetail = React.lazy(() => import('./pages/production/WorksheetDetail'));
const WorksheetForm = React.lazy(() => import('./pages/production/WorksheetForm'));
const Stocks = React.lazy(() => import('./pages/production/Stocks'));
const Machines = React.lazy(() => import('./pages/production/Machines'));
const Maintenance = React.lazy(() => import('./pages/production/Maintenance'));
const OEE = React.lazy(() => import('./pages/production/OEE'));
const RawMaterialReceipt = React.lazy(() => import('./pages/production/RawMaterialReceipt'));
const QCGabah = React.lazy(() => import('./pages/production/QCGabah'));
const Customers = React.lazy(() => import('./pages/sales/Customers'));
const Invoices = React.lazy(() => import('./pages/sales/Invoices'));
const InvoiceDetail = React.lazy(() => import('./pages/sales/InvoiceDetail'));
const PurchaseOrders = React.lazy(() => import('./pages/purchasing/PurchaseOrders'));
const PurchaseOrderDetail = React.lazy(() => import('./pages/purchasing/PurchaseOrderDetail'));
const ProductionReport = React.lazy(() => import('./pages/reports/ProductionReport'));
const SalesReport = React.lazy(() => import('./pages/reports/SalesReport'));
const COGMReport = React.lazy(() => import('./pages/reports/COGMReport'));
const StockReport = React.lazy(() => import('./pages/reports/StockReport'));
const QualityTrends = React.lazy(() => import('./pages/reports/QualityTrends'));
const Users = React.lazy(() => import('./pages/admin/Users'));
const AuditLogs = React.lazy(() => import('./pages/admin/AuditLogs'));

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

        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          {/* Dashboard */}
          <Route index element={<Dashboard />} />
          <Route path="settings" element={<Settings />} />

          {/* Production Module */}
          <Route path="production">
            <Route path="worksheets" element={<Worksheets />} />
            <Route path="worksheets/new" element={
              <RoleGuard requiredRole="SUPERVISOR"><WorksheetForm /></RoleGuard>
            } />
            <Route path="worksheets/:id" element={<WorksheetDetail />} />
            <Route path="worksheets/:id/edit" element={
              <RoleGuard requiredRole="SUPERVISOR"><WorksheetForm /></RoleGuard>
            } />
            <Route path="stocks" element={<Stocks />} />
            <Route path="raw-materials" element={
              <RoleGuard requiredRole="OPERATOR"><RawMaterialReceipt /></RoleGuard>
            } />
            <Route path="machines" element={<Machines />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="oee" element={<OEE />} />
            <Route path="qc-gabah" element={<QCGabah />} />
          </Route>

          {/* Sales Module */}
          <Route path="sales">
            <Route path="customers" element={
              <RoleGuard requiredRole="SUPERVISOR"><Customers /></RoleGuard>
            } />
            <Route path="invoices" element={
              <RoleGuard requiredRole="SUPERVISOR"><Invoices /></RoleGuard>
            } />
            <Route path="invoices/:id" element={
              <RoleGuard requiredRole="SUPERVISOR"><InvoiceDetail /></RoleGuard>
            } />
          </Route>

          {/* Purchasing Module */}
          <Route path="purchasing">
            <Route path="purchase-orders" element={
              <RoleGuard requiredRole="SUPERVISOR"><PurchaseOrders /></RoleGuard>
            } />
            <Route path="purchase-orders/:id" element={
              <RoleGuard requiredRole="SUPERVISOR"><PurchaseOrderDetail /></RoleGuard>
            } />
          </Route>

          {/* Reports Module */}
          <Route path="reports">
            <Route path="production" element={
              <RoleGuard requiredRole="SUPERVISOR"><ProductionReport /></RoleGuard>
            } />
            <Route path="sales" element={
              <RoleGuard requiredRole="SUPERVISOR"><SalesReport /></RoleGuard>
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
          </Route>

          {/* Admin Module */}
          <Route path="admin">
            <Route path="users" element={
              <RoleGuard requiredRole="ADMIN"><Users /></RoleGuard>
            } />
            <Route path="audit-logs" element={
              <RoleGuard requiredRole="ADMIN"><AuditLogs /></RoleGuard>
            } />
          </Route>

          {/* Legacy routes - redirect to new paths */}
          <Route path="worksheets" element={<Navigate to="/production/worksheets" replace />} />
          <Route path="stocks" element={<Navigate to="/production/stocks" replace />} />

          {/* 404 fallback */}
          <Route path="*" element={
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '60vh',
              textAlign: 'center'
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 64, color: 'var(--text-muted)', marginBottom: 16 }}>
                search_off
              </span>
              <h2 style={{ marginBottom: 8 }}>Halaman Tidak Ditemukan</h2>
              <p style={{ color: 'var(--text-secondary)' }}>Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
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
