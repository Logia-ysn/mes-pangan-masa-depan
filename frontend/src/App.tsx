import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/Layout';

// Pages
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import Settings from './pages/Settings';

// Production Module
import Worksheets from './pages/production/Worksheets';
import WorksheetDetail from './pages/production/WorksheetDetail';
import Scheduling from './pages/production/Scheduling';
import Stocks from './pages/production/Stocks';
import Machines from './pages/production/Machines';
import Maintenance from './pages/production/Maintenance';
import OEE from './pages/production/OEE';
import RawMaterialReceipt from './pages/production/RawMaterialReceipt';
import QCGabah from './pages/production/QCGabah';

import './index.css';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, isLoading } = useAuth();

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

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const { token } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <Login />} />

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
          <Route path="schedule" element={<Scheduling />} />
          <Route path="qc-gabah" element={<QCGabah />} />
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
  );
};

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
