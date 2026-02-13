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
const Stocks = React.lazy(() => import('./pages/production/Stocks'));
const Machines = React.lazy(() => import('./pages/production/Machines'));
const Maintenance = React.lazy(() => import('./pages/production/Maintenance'));
const OEE = React.lazy(() => import('./pages/production/OEE'));
const RawMaterialReceipt = React.lazy(() => import('./pages/production/RawMaterialReceipt'));
const QCGabah = React.lazy(() => import('./pages/production/QCGabah'));
const Customers = React.lazy(() => import('./pages/sales/Customers'));
const Invoices = React.lazy(() => import('./pages/sales/Invoices'));
const InvoiceDetail = React.lazy(() => import('./pages/sales/InvoiceDetail'));

const PageLoader = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '60vh',
    color: 'var(--text-secondary)'
  }}>
    <span className="material-symbols-outlined" style={{ fontSize: 32, animation: 'spin 1s linear infinite' }}>
      progress_activity
    </span>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'var(--bg-body)',
        color: 'var(--text-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 48, marginBottom: 16, display: 'block' }}>hourglass_empty</span>
          <span>Loading...</span>
        </div>
      </div>
    );
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
            <Route path="worksheets/:id" element={<WorksheetDetail />} />
            <Route path="stocks" element={<Stocks />} />
            <Route path="raw-materials" element={<RawMaterialReceipt />} />
            <Route path="machines" element={<Machines />} />
            <Route path="maintenance" element={<Maintenance />} />
            <Route path="oee" element={<OEE />} />
            <Route path="qc-gabah" element={<QCGabah />} />
          </Route>

          {/* Sales Module */}
          <Route path="sales">
            <Route path="customers" element={<Customers />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="invoices/:id" element={<InvoiceDetail />} />
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
