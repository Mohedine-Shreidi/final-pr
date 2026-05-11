import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MapProvider } from './components/maps/MapProvider';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { isSupabaseConfigured } from './lib/supabase';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import EmergencyMap from './pages/EmergencyMap';
import Reports from './pages/Reports';
import LostFound from './pages/LostFound';
import Accessibility from './pages/Accessibility';
import Sharing from './pages/Sharing';
import Assistant from './pages/Assistant';
import AdminPanel from './pages/AdminPanel';
import Messages from './pages/Messages';
import Profile from './pages/Profile';
import SettingsPage from './pages/SettingsPage';
import AuthPage from './pages/AuthPage';

function AdminRoute() {
  const { profile } = useAuth();
  if (profile?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  return <AdminPanel />;
}

function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth();

  // Show nothing while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin mx-auto" />
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>Loading CivicHub...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth page if not authenticated (only when Supabase is configured)
  if (!isAuthenticated && isSupabaseConfigured) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/emergency-map" element={<EmergencyMap />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/lost-found" element={<LostFound />} />
        <Route path="/accessibility" element={<Accessibility />} />
        <Route path="/sharing" element={<Sharing />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/admin" element={<AdminRoute />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MapProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </MapProvider>
    </AuthProvider>
  );
}
